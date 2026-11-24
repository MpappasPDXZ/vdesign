'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { TopNavBar } from './TopNavBar'
import { AppSidebar } from './AppSidebar'
import { ItemsDrawer } from './ItemsDrawer'
import { ProjectsView } from './ProjectsView'
import { SettingsDialog } from './SettingsDialog'
import { ContextMenu } from './ContextMenu'
import { SectionalEditor, isSectionalCouch } from './SectionalEditor'
import { BedSizeInput } from './BedSizeInput'
import { LengthInput } from './LengthInput'
import { FloorplannerControls } from './FloorplannerControls'
import { WallPropertiesPanel, type WallConnectSave } from './WallPropertiesPanel'
import { ItemMovePanel, isMovableFloorItem } from './ItemMovePanel'
import { ExteriorWallsModal, EXTERIOR_WALL_TARGET } from './ExteriorWallsModal'
import { insertWallScheduleEntry } from '@/lib/wall-schedule'
import { TextureSelector } from './TextureSelector'
import type { Wall } from '@blueprint3d/model/wall'
import { cmToInches } from './InchesDimensionInput'
import {
  downloadProjectJson,
  readRecoverySnapshot,
  writeRecoverySnapshot
} from '@/services/recovery'
import {
  loadLatestProjectFromRepo,
  saveProjectToRepo
} from '@/services/plans-repo'
import {
  normalizeAreas,
  normalizeUnderlay,
  parseProjectJson,
  toSerializedRoom
} from '@/lib/load-project'
import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { OverlayDescriptor } from '@blueprint3d/floorplanner/overlay'
import type {
  EntranceKind,
  EntranceScheduleEntry,
  FloorFinishSpec,
  WallScheduleEntry,
  VdesignProject
} from '@/types/project'
import { applyFloorFinishes } from '@/lib/floor-finishes'
import { SaveFloorplanDialog } from './SaveFloorplanDialog'

const DEFAULT_PROJECT_ID = '2713-s-224th-basement'
const DEFAULT_PROJECT_PATH = `/projects/${DEFAULT_PROJECT_ID}/floorplan.json`
import { TouchHelp } from './TouchHelp'
import DefaultFloorplan from '@blueprint3d/templates/default.json'
import { blueprintStorage } from '@/services/storage'

import { Blueprint3d } from '@blueprint3d/blueprint3d'
import { floorplannerModes } from '@blueprint3d/floorplanner/floorplanner_view'
import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'
import { ITEMS } from '@blueprint3d/constants'
import type { Item } from '@blueprint3d/items/item'
import { WallItem } from '@blueprint3d/items/wall_item'
import type { HalfEdge } from '@blueprint3d/model/half_edge'
import type { Room } from '@blueprint3d/model/room'
import { Blueprint3DModes, type Blueprint3DMode } from '@blueprint3d/config/modes'
import { RoomType } from '@blueprint3d/types/room_types'

export interface Blueprint3DAppConfig {
  enableWheelZoom?: boolean | (() => boolean)
  mode?: Blueprint3DMode
  onBlueprint3DReady?: (blueprint3d: Blueprint3d) => void
  onBedSizeChange?: (width: number, length: number) => void
  isLanguageOption?: boolean
  openMyFloorplans?: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  onViewModeChange?: (mode: '2d' | '3d') => void
  renderOverlay?: () => React.ReactNode
  alwaysSpin?: boolean
}

interface Blueprint3DAppBaseProps {
  config?: Blueprint3DAppConfig
}

export function Blueprint3DAppBase({ config = {} }: Blueprint3DAppBaseProps) {
  const {
    enableWheelZoom = true,
    mode = Blueprint3DModes.BEDROOM,
    onBlueprint3DReady,
    onBedSizeChange,
    isLanguageOption = false,
    openMyFloorplans = false,
    isFullscreen = false,
    onViewModeChange,
    renderOverlay,
    alwaysSpin = false
  } = config

  const t = useTranslations('BluePrint.saveDialog')
  const tItems = useTranslations('BluePrint.items')
  const tFloorplanner = useTranslations('BluePrint.floorplanner')
  const tMyFloorplans = useTranslations('BluePrint.myFloorplans')
  const tMain = useTranslations('BluePrint.mainControls')

  const contentRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const floorplannerCanvasRef = useRef<HTMLCanvasElement>(null)
  const importFileRef = useRef<HTMLInputElement>(null)
  const blueprint3dRef = useRef<Blueprint3d | null>(null)
  const loadingToastsRef = useRef<Array<{ toastId: string | number; itemName: string }>>([])
  const underlayConfigRef = useRef<UnderlayConfig | null>(null)
  const areasRef = useRef<AreaLabel[]>([])
  const entrancesRef = useRef<EntranceScheduleEntry[]>([])
  const floorFinishesRef = useRef<FloorFinishSpec[]>([])
  /** Skip persist while GLB/procedural items are still loading — otherwise doors vanish from saves. */
  const itemsLoadingRef = useRef(0)

  const [activeTab, setActiveTab] = useState<'projects' | 'edit' | 'items'>(
    openMyFloorplans ? 'projects' : 'edit'
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [floorplannerMode, setFloorplannerMode] = useState<'move' | 'draw' | 'delete'>('move')
  const [itemsCategory, setItemsCategory] = useState<'all' | 'door' | 'window'>('all')
  const [textureType, setTextureType] = useState<'floor' | 'wall' | null>(null)
  const [currentTarget, setCurrentTarget] = useState<HalfEdge | Room | null>(null)
  const [itemsLoading, setItemsLoading] = useState(0)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [wallSchedule, setWallSchedule] = useState<WallScheduleEntry[]>([])
  const [overlays, setOverlays] = useState<OverlayDescriptor[]>([])
  const [selectedWall, setSelectedWall] = useState<Wall | null>(null)
  const [selectedWallNumber, setSelectedWallNumber] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exteriorWallsOpen, setExteriorWallsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [underlayState, setUnderlayState] = useState<UnderlayConfig | null>(null)
  const [recoverySavedAt, setRecoverySavedAt] = useState<number | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const blueprintImageObjectUrlRef = useRef<string | null>(null)
  const recoveryOfferedRef = useRef(false)
  const undoStackRef = useRef<
    Array<{ roomJson: string; wallSchedule: WallScheduleEntry[]; selectedWallNumber: number | null }>
  >([])
  const wallScheduleRef = useRef(wallSchedule)
  wallScheduleRef.current = wallSchedule
  const selectedWallNumberRef = useRef(selectedWallNumber)
  selectedWallNumberRef.current = selectedWallNumber

  const [currentBlueprint, setCurrentBlueprint] = useState<{
    id: string
    name: string
    roomType: RoomType
  } | null>(null)
  const currentBlueprintRef = useRef(currentBlueprint)
  currentBlueprintRef.current = currentBlueprint
  const persistRecoveryRef = useRef<(() => void) | null>(null)
  const persistPlanNowRef = useRef<(() => Promise<void>) | null>(null)
  /** plans/ mtime from last Load latest / Save — sent as baseMtimeMs for merge-on-write. */
  const repoMtimeMsRef = useRef<number | undefined>(undefined)

  const tSeed = useTranslations('BluePrint.seedProjects')
  const tOverlays = useTranslations('BluePrint.overlays')
  const tSidebar = useTranslations('BluePrint.sidebar')

  const buildOverlayList = useCallback(
    (opts: {
      hasBlueprint: boolean
      blueprintOpacity: number
      blueprintVisible?: boolean
      wallNumbersVisible?: boolean
      areaLabelsVisible?: boolean
      hasAreas?: boolean
    }): OverlayDescriptor[] => {
      const list: OverlayDescriptor[] = []
      if (opts.hasBlueprint) {
        list.push({
          id: 'blueprint',
          kind: 'blueprint',
          label: tOverlays('blueprint'),
          visible: opts.blueprintVisible ?? true,
          opacity: opts.blueprintOpacity
        })
      }
      list.push({
        id: 'wallNumbers',
        kind: 'wallNumbers',
        label: tOverlays('wallNumbers'),
        visible: opts.wallNumbersVisible ?? true
      })
      if (opts.hasAreas) {
        list.push({
          id: 'areaLabels',
          kind: 'areaLabels',
          label: tOverlays('areaLabels'),
          visible: opts.areaLabelsVisible ?? true
        })
      }
      return list
    },
    [tOverlays]
  )

  const [currentMode, setCurrentMode] = useState<Blueprint3DMode>(mode)

  const getWheelZoomEnabled = useCallback(() => {
    if (typeof enableWheelZoom === 'function') {
      return enableWheelZoom()
    }
    return enableWheelZoom
  }, [enableWheelZoom])

  // Initialize Blueprint3d
  useEffect(() => {
    if (!viewerRef.current || blueprint3dRef.current) return

    const savedUnit = localStorage.getItem('dimensionUnit')
    if (savedUnit) {
      Configuration.setValue(configDimUnit, savedUnit)
    }

    const opts = {
      floorplannerElement: 'floorplanner-canvas',
      threeElement: '#viewer',
      textureDir: '/models/textures/',
      widget: false,
      enableWheelZoom: getWheelZoomEnabled(),
      alwaysSpin
    }

    const blueprint3d = new Blueprint3d(opts)
    blueprint3dRef.current = blueprint3d
    // Agent / CDP debugging — parallel item adds need a stable handle for 3D verify
    ;(window as unknown as { __vdesignBp?: typeof blueprint3d }).__vdesignBp = blueprint3d

    if (onBlueprint3DReady) {
      onBlueprint3DReady(blueprint3d)
    }

    blueprint3d.three.itemSelectedCallbacks.add((item) => {
      setSelectedItem(item)
      setTextureType(null)
    })

    blueprint3d.three.itemUnselectedCallbacks.add(() => {
      setSelectedItem(null)
    })

    // 3D: click wall to open editor (2D: single-click # badge)
    blueprint3d.three.wallClicked.add((halfEdge) => {
      setCurrentTarget(halfEdge)
      setTextureType(null)
      setSelectedItem(null)
      const wall = halfEdge.wall
      setSelectedWall((prev) => {
        if (prev === wall) {
          setSelectedWallNumber(null)
          blueprint3d.floorplanner?.selectWall(null)
          return null
        }
        const walls = blueprint3d.model.floorplan.getWalls()
        const idx = walls.indexOf(wall)
        setSelectedWallNumber(idx >= 0 ? idx + 1 : null)
        blueprint3d.floorplanner?.selectWall(wall)
        return wall
      })
    })

    blueprint3d.three.floorClicked.add((room) => {
      setCurrentTarget(room)
      setTextureType('floor')
      setSelectedItem(null)
      setSelectedWall(null)
      setSelectedWallNumber(null)
      blueprint3d.floorplanner?.selectWall(null)
    })

    blueprint3d.three.nothingClicked.add(() => {
      setTextureType(null)
      setCurrentTarget(null)
      setSelectedWall(null)
      setSelectedWallNumber(null)
      blueprint3d.floorplanner?.selectWall(null)
    })

    // 2D wall click → property editor
    const onWallSelected = (wall: Wall | null) => {
      if (!wall) {
        setSelectedWall(null)
        setSelectedWallNumber(null)
        return
      }
      const walls = blueprint3d.model.floorplan.getWalls()
      const idx = walls.indexOf(wall)
      setSelectedWall(wall)
      setSelectedWallNumber(idx >= 0 ? idx + 1 : null)
      setSelectedItem(null)
      setTextureType(null)
    }
    blueprint3d.floorplanner?.wallSelectedCallbacks.add(onWallSelected)

    blueprint3d.model.scene.itemLoadingCallbacks.add(() => {
      itemsLoadingRef.current += 1
      setItemsLoading((prev) => prev + 1)
    })

    blueprint3d.model.scene.itemLoadedCallbacks.add((item) => {
      itemsLoadingRef.current = Math.max(0, itemsLoadingRef.current - 1)
      setItemsLoading((prev) => Math.max(0, prev - 1))
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.success(tItems('loadedSuccess', { name: itemName }), { id: toastId })
      }
      // Once all pending loads finish, snapshot so doors/items aren't lost to an earlier empty save
      if (itemsLoadingRef.current === 0) {
        window.setTimeout(() => {
          if (itemsLoadingRef.current === 0) {
            persistRecoveryRef.current?.()
            void persistPlanNowRef.current?.()
          }
        }, 100)
      }
    })

    blueprint3d.model.scene.itemLoadErrorCallbacks.add(() => {
      itemsLoadingRef.current = Math.max(0, itemsLoadingRef.current - 1)
      setItemsLoading((prev) => Math.max(0, prev - 1))
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.error(tItems('loadError', { name: itemName }), { id: toastId })
      }
    })

    /** Prefer IndexedDB / recovery over seed so reload keeps edits. */
    const applyProjectToCanvas = (project: VdesignProject, id: string, name?: string) => {
      blueprint3d.model.loadSerialized(toSerializedRoom(project))
      setCurrentBlueprint({
        id,
        name: name || project.meta?.name || '2713 S 224th — Basement',
        roomType: RoomType.BEDROOM
      })
      setWallSchedule(project.wallSchedule || [])
      entrancesRef.current = Array.isArray(project.entrances)
        ? structuredClone(project.entrances)
        : []
      floorFinishesRef.current = Array.isArray(project.floorFinishes)
        ? structuredClone(project.floorFinishes)
        : []
      const underlay = normalizeUnderlay(project.underlay)
      underlayConfigRef.current = underlay
      setUnderlayState(underlay)
      const areas = normalizeAreas(project.areas)
      areasRef.current = areas
      setOverlays(
        buildOverlayList({
          hasBlueprint: !!underlay,
          blueprintOpacity: underlay?.opacity ?? 0.4,
          hasAreas: areas.length > 0
        })
      )
      requestAnimationFrame(() => {
        blueprint3d.floorplanner?.reset()
        blueprint3d.floorplanner?.setShowWallNumbers(true)
        if (underlay) blueprint3d.floorplanner?.setUnderlay({ ...underlay })
        blueprint3d.floorplanner?.setAreaLabels(areas)
        applyFloorFinishes(blueprint3d, floorFinishesRef.current, areas)
        // Plan loads after empty init — refit 3D to full drawing centroid + zoom-out
        blueprint3d.three.fitCamera?.() ?? blueprint3d.three.centerCamera?.()
      })
    }

    const loadInitialFloorplan = async () => {
      try {
        // 1) Browser DB (Save Plan / Apply / Done)
        const saved = await blueprintStorage.get(DEFAULT_PROJECT_ID)
        if (saved?.layoutData?.floorplan?.walls?.length) {
          applyProjectToCanvas(saved.layoutData as VdesignProject, saved.id, saved.name)
          return
        }
        // 2) localStorage recovery (crash / last session)
        const recovery = readRecoverySnapshot()
        if (
          recovery?.project?.floorplan?.walls?.length &&
          (!recovery.meta?.id || recovery.meta.id === DEFAULT_PROJECT_ID)
        ) {
          applyProjectToCanvas(
            recovery.project,
            DEFAULT_PROJECT_ID,
            recovery.meta?.name
          )
          return
        }
        // 3) Seed file under /public (not a cache of edits)
        const res = await fetch(`${DEFAULT_PROJECT_PATH}?t=${Date.now()}`, {
          cache: 'no-store'
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const project = parseProjectJson(await res.text()) as VdesignProject
        applyProjectToCanvas(project, DEFAULT_PROJECT_ID, project.meta?.name)
      } catch (error) {
        console.error('[Blueprint3DAppBase] Error loading default project:', error)
        blueprint3d.model.loadSerialized(JSON.stringify(DefaultFloorplan))
      }
    }

    void loadInitialFloorplan().then(() => {
      recoveryOfferedRef.current = true
    })

    return () => {
      // Cleanup if needed
    }
  }, [buildOverlayList, getWheelZoomEnabled, tItems, onBlueprint3DReady])

  // Update wheel zoom setting when it changes
  useEffect(() => {
    if (blueprint3dRef.current) {
      blueprint3dRef.current.three.controls.enableWheelZoom = getWheelZoomEnabled()
    }
  }, [getWheelZoomEnabled])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (blueprint3dRef.current && activeTab === 'edit') {
        if (viewMode === '3d') {
          blueprint3dRef.current.three.updateWindowSize()
        } else {
          blueprint3dRef.current.floorplanner?.resizeView()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab, viewMode])

  // Handle resize with ResizeObserver for accurate sizing
  useEffect(() => {
    if (!contentRef.current || !blueprint3dRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (!blueprint3dRef.current || activeTab !== 'edit') return
      if (viewMode === '3d') {
        blueprint3dRef.current.three.updateWindowSize()
      } else {
        blueprint3dRef.current.floorplanner?.resizeView()
      }
    })

    resizeObserver.observe(contentRef.current)
    return () => resizeObserver.disconnect()
  }, [activeTab, viewMode])

  const handleViewChange = useCallback(
    (mode: '2d' | '3d') => {
      if (!blueprint3dRef.current) return
      blueprint3dRef.current.three.setViewMode(mode)
      setViewMode(mode)
      onViewModeChange?.(mode)

      if (mode === '2d') {
        setTimeout(() => {
          if (blueprint3dRef.current) {
            blueprint3dRef.current.floorplanner?.reset()
            blueprint3dRef.current.floorplanner?.resetOrigin()
            // Footprints come from the live scene provider — redraw after reset.
            blueprint3dRef.current.floorplanner?.redraw()
          }
        }, 50)
      } else {
        setTimeout(() => {
          if (blueprint3dRef.current) {
            blueprint3dRef.current.model.floorplan.update()
            blueprint3dRef.current.three.updateWindowSize()
          }
        }, 50)
      }
    },
    [onViewModeChange]
  )

  const handleDeleteItem = useCallback(() => {
    if (selectedItem) {
      selectedItem.removeFromScene()
      setSelectedItem(null)
    }
  }, [selectedItem])

  const handleResizeItem = useCallback(
    (height: number, width: number, depth: number) => {
      if (selectedItem) selectedItem.resize(height, width, depth)
    },
    [selectedItem]
  )

  const handleFixedChange = useCallback(
    (fixed: boolean) => {
      if (selectedItem) selectedItem.setFixed(fixed)
    },
    [selectedItem]
  )

  // Generate top-down thumbnail
  const generateTopDownThumbnail = useCallback((): string => {
    if (!blueprint3dRef.current) return ''

    const three = blueprint3dRef.current.three
    const camera = three.camera
    const controls = three.controls
    const renderer = three.renderer

    const savedPosition = camera.position.clone()
    const savedTarget = controls.target.clone()
    const savedRotation = camera.rotation.clone()
    const savedAspect = camera.aspect

    const currentCanvas = renderer.domElement
    const savedWidth = currentCanvas.width
    const savedHeight = currentCanvas.height

    const targetWidth = 1800
    const targetHeight = 1200

    try {
      renderer.setSize(targetWidth, targetHeight, false)
      camera.aspect = targetWidth / targetHeight
      camera.updateProjectionMatrix()

      const center = blueprint3dRef.current.model.floorplan.getCenter()
      const size = blueprint3dRef.current.model.floorplan.getSize()

      const targetAspect = 3 / 2
      const roomAspect = size.x / size.z
      const margin = 1.4

      let viewWidth: number, viewHeight: number
      if (roomAspect > targetAspect) {
        viewWidth = size.x * margin
        viewHeight = viewWidth / targetAspect
      } else {
        viewHeight = size.z * margin
        viewWidth = viewHeight * targetAspect
      }

      const fov = camera.fov * (Math.PI / 180)
      const distance = Math.max(viewWidth, viewHeight) / (2 * Math.tan(fov / 2))

      controls.target.set(center.x, 0, center.z)
      camera.position.set(center.x, distance, center.z)
      camera.lookAt(controls.target)
      camera.updateProjectionMatrix()
      controls.update()

      renderer.clear()
      renderer.render(three.scene.getScene(), camera)

      return currentCanvas.toDataURL('image/webp', 0.85)
    } finally {
      renderer.setSize(savedWidth, savedHeight, false)
      camera.aspect = savedAspect
      camera.position.copy(savedPosition)
      controls.target.copy(savedTarget)
      camera.rotation.copy(savedRotation)
      camera.updateProjectionMatrix()
      controls.update()

      renderer.clear()
      renderer.render(three.scene.getScene(), camera)
    }
  }, [])

  /** Full project payload for IndexedDB (geometry + schedule/underlay/areas). */
  const buildSavePayload = useCallback(() => {
    if (!blueprint3dRef.current) return null
    const room = JSON.parse(blueprint3dRef.current.model.exportSerialized()) as {
      floorplan: VdesignProject['floorplan']
      items: VdesignProject['items']
    }
    let thumbnailBase64: string | undefined
    try {
      thumbnailBase64 = generateTopDownThumbnail() || undefined
    } catch (error) {
      console.warn('[Blueprint3DAppBase] Thumbnail generation failed:', error)
    }
    const layoutData: VdesignProject = {
      ...room,
      underlay: underlayConfigRef.current ?? undefined,
      areas: areasRef.current,
      entrances: structuredClone(entrancesRef.current),
      floorFinishes: structuredClone(floorFinishesRef.current),
      // Ref = latest schedule (avoid stale closure after Apply patches)
      wallSchedule: structuredClone(wallScheduleRef.current),
      meta: {
        name: currentBlueprintRef.current?.name
      }
    }
    return { layoutData, thumbnailBase64 }
  }, [generateTopDownThumbnail])

  const persistRecovery = useCallback(() => {
    // Never snapshot mid-load — empty item list would wipe doors from recovery/plans
    if (itemsLoadingRef.current > 0) return
    const payload = buildSavePayload()
    if (!payload) return
    writeRecoverySnapshot(payload.layoutData, {
      name: currentBlueprintRef.current?.name,
      id: currentBlueprintRef.current?.id
    })
    setRecoverySavedAt(Date.now())
  }, [buildSavePayload])
  persistRecoveryRef.current = persistRecovery

  const pushUndoSnapshot = useCallback(() => {
    const b = blueprint3dRef.current
    if (!b) return
    undoStackRef.current.push({
      roomJson: b.model.exportSerialized(),
      wallSchedule: structuredClone(wallScheduleRef.current),
      selectedWallNumber: selectedWallNumberRef.current
    })
    if (undoStackRef.current.length > 40) undoStackRef.current.shift()
    setCanUndo(true)
  }, [])

  const persistPlanNow = useCallback(async () => {
    if (itemsLoadingRef.current > 0) return
    const payload = buildSavePayload()
    if (!payload) return
    writeRecoverySnapshot(payload.layoutData, {
      name: currentBlueprintRef.current?.name,
      id: currentBlueprintRef.current?.id
    })
    setRecoverySavedAt(Date.now())
    const bp = currentBlueprintRef.current
    if (!bp) return
    try {
      await blueprintStorage.upsert(bp.id, {
        name: bp.name,
        layoutData: payload.layoutData,
        thumbnailBase64: payload.thumbnailBase64,
        roomType: bp.roomType
      })
    } catch (error) {
      console.warn('[Blueprint3DAppBase] Auto-save after edit failed:', error)
    }
  }, [buildSavePayload])
  persistPlanNowRef.current = persistPlanNow

  const handleUndo = useCallback(() => {
    const entry = undoStackRef.current.pop()
    setCanUndo(undoStackRef.current.length > 0)
    const b = blueprint3dRef.current
    if (!entry || !b) return
    b.model.loadSerialized(entry.roomJson)
    setWallSchedule(entry.wallSchedule)
    setSelectedWall(null)
    setSelectedWallNumber(null)
    b.floorplanner?.selectWall(null)
    b.floorplanner?.reset()
    b.floorplanner?.setShowWallNumbers(true)
    if (underlayConfigRef.current) {
      b.floorplanner?.setUnderlay({ ...underlayConfigRef.current })
    }
    b.floorplanner?.setAreaLabels(areasRef.current)
    b.floorplanner?.redraw()
    void persistPlanNow()
    toast.success('Undone — plan saved')
  }, [persistPlanNow])

  const handleWallPropsChanged = useCallback(() => {
    const b = blueprint3dRef.current
    if (!b || !selectedWall) return
    b.model.floorplan.update()
    b.floorplanner?.selectWall(selectedWall)
    b.floorplanner?.redraw()
    requestAnimationFrame(() => {
      b.floorplanner?.redraw()
    })
    const n = selectedWallNumber
    if (n != null) {
      setWallSchedule((prev) => {
        const next = prev.map((entry) =>
          entry.n === n
            ? {
                ...entry,
                name: selectedWall.name || entry.name,
                role: selectedWall.name || entry.role,
                outerLength: `${cmToInches(selectedWall.getLength())}"`,
                thickness: `${cmToInches(selectedWall.thickness)}"`,
                wallType: selectedWall.wallType,
                exposure: selectedWall.exposure
              }
            : entry
        )
        wallScheduleRef.current = next
        return next
      })
    }
    requestAnimationFrame(() => {
      void persistPlanNow()
    })
  }, [selectedWall, selectedWallNumber, persistPlanNow])

  const handleDeleteWall = useCallback(() => {
    if (!selectedWall) return
    pushUndoSnapshot()
    const n = selectedWallNumber
    const wall = selectedWall
    setSelectedWall(null)
    setSelectedWallNumber(null)
    wall.remove()
    const fp = blueprint3dRef.current?.floorplanner
    blueprint3dRef.current?.model.floorplan.update()
    fp?.selectWall(null)
    fp?.redraw()
    if (n != null) {
      setWallSchedule((prev) =>
        prev
          .filter((entry) => entry.n !== n)
          .map((entry, idx) => ({ ...entry, n: idx + 1 }))
      )
    }
    void persistPlanNow()
    toast.success('Wall deleted — plan saved', {
      action: { label: 'Undo', onClick: () => handleUndo() }
    })
  }, [selectedWall, selectedWallNumber, pushUndoSnapshot, persistPlanNow, handleUndo])

  /** Wall Editor Connect host → orange stroke on 2D plan. */
  const handleConnectHostHighlight = useCallback((host: Wall | null) => {
    blueprint3dRef.current?.floorplanner?.setConnectHostWall(host)
  }, [])

  const handleConnectSaved = useCallback(
    (n: number, connect: WallConnectSave) => {
      const extendsWord =
        connect.extends === 'N'
          ? 'north'
          : connect.extends === 'E'
            ? 'east'
            : connect.extends === 'S'
              ? 'south'
              : 'west'
      setWallSchedule((prev) => {
        const row = {
          connectsToWall: connect.connectsToWall,
          connectsAt: connect.connectsAt,
          extends: extendsWord
        }
        const has = prev.some((e) => e.n === n)
        const next = !has
          ? [...prev, { n, role: `Wall ${n}`, ...row }].sort((a, b) => a.n - b.n)
          : prev.map((e) => (e.n === n ? { ...e, ...row } : e))
        wallScheduleRef.current = next
        return next
      })
    },
    []
  )

  const handleUpdateScheduleMeta = useCallback(
    (n: number, patch: Partial<WallScheduleEntry>) => {
      setWallSchedule((prev) => {
        const merge = (entry: WallScheduleEntry): WallScheduleEntry => {
          const merged: WallScheduleEntry = { ...entry, ...patch }
          // null lineage = clear key (JSON would drop undefined anyway)
          for (const key of ['lengthLineage', 'thicknessLineage', 'offsetLineage'] as const) {
            if (key in patch && patch[key] == null) delete merged[key]
          }
          return merged
        }
        const has = prev.some((e) => e.n === n)
        const next = !has
          ? [...prev, merge({ n, role: patch.role || `Wall ${n}` })].sort((a, b) => a.n - b.n)
          : prev.map((e) => (e.n === n ? merge(e) : e))
        wallScheduleRef.current = next
        return next
      })
      // Carpenter-square lineage (and other meta) must hit IndexedDB without waiting for Apply
      const lineageTouched =
        'lengthLineage' in patch ||
        'thicknessLineage' in patch ||
        'offsetLineage' in patch
      if (lineageTouched) {
        requestAnimationFrame(() => {
          void persistPlanNow()
        })
      }
    },
    [persistPlanNow]
  )

  const selectWallByIndex = useCallback((index0: number) => {
    const b = blueprint3dRef.current
    if (!b) return
    const walls = b.model.floorplan.getWalls()
    const wall = walls[index0]
    if (!wall) return
    setViewMode('2d')
    setFloorplannerMode('move')
    b.floorplanner?.setMode(floorplannerModes.MOVE)
    b.floorplanner?.selectWall(wall)
    setSelectedWall(wall)
    setSelectedWallNumber(index0 + 1)
    b.floorplanner?.redraw()
  }, [])

  const handleAddExteriorWall = useCallback(() => {
    const b = blueprint3dRef.current
    if (!b) return
    const walls = b.model.floorplan.getWalls()
    if (walls.length >= EXTERIOR_WALL_TARGET) {
      toast.message(`Already at ${EXTERIOR_WALL_TARGET} walls`)
      return
    }
    pushUndoSnapshot()
    const afterN = walls.length
    try {
      const inserted = b.model.floorplan.insertWallAfter(afterN - 1)
      inserted.exposure = 'exterior'
      inserted.wallType = 'concrete'
      const newN = afterN + 1
      setWallSchedule((prev) =>
        insertWallScheduleEntry(prev, afterN, {
          role: `Exterior #${newN}`,
          name: `basement #${newN} exterior wall`,
          outerLength: '8\'',
          thickness: '8"',
          wallType: 'concrete',
          exposure: 'exterior',
          connectsToWall: afterN > 0 ? afterN : undefined,
          connectsAt: 'bottom',
          offsetInches: 0,
          notes: 'Added via exterior walls modal'
        })
      )
      setViewMode('2d')
      setFloorplannerMode('move')
      b.floorplanner?.setMode(floorplannerModes.MOVE)
      b.floorplanner?.selectWall(inserted)
      setSelectedWall(inserted)
      setSelectedWallNumber(newN)
      b.floorplanner?.redraw()
      void persistPlanNow()
      toast.success(`Added exterior wall #${newN}`)
    } catch (err) {
      console.error(err)
      toast.error('Could not add wall')
    }
  }, [pushUndoSnapshot, persistPlanNow])

  const handleExteriorWallChanged = useCallback(() => {
    const b = blueprint3dRef.current
    if (!b || !selectedWall) return
    b.model.floorplan.update()
    b.floorplanner?.selectWall(selectedWall)
    b.floorplanner?.redraw()
    requestAnimationFrame(() => b.floorplanner?.redraw())
    const n = selectedWallNumber
    if (n != null) {
      setWallSchedule((prev) => {
        const next = prev.map((entry) =>
          entry.n === n
            ? {
                ...entry,
                name: selectedWall.name || entry.name,
                role: selectedWall.name || entry.role,
                outerLength: `${cmToInches(selectedWall.getLength())}"`,
                thickness: `${cmToInches(selectedWall.thickness)}"`,
                wallType: selectedWall.wallType,
                exposure: selectedWall.exposure
              }
            : entry
        )
        wallScheduleRef.current = next
        return next
      })
    }
    requestAnimationFrame(() => {
      void persistPlanNow()
    })
  }, [selectedWall, selectedWallNumber, persistPlanNow])

  // Debounced recovery autosave — survives refresh/crash in localStorage
  useEffect(() => {
    if (!blueprint3dRef.current) return
    const timer = window.setTimeout(() => {
      persistRecovery()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [persistRecovery, wallSchedule, underlayState, selectedWall, viewMode])

  // Save: IndexedDB + repo plans/{slug}.json + plans/versions/…
  const handleSave = useCallback(async () => {
    if (currentBlueprint) {
      if (itemsLoadingRef.current > 0) {
        toast.message(tMain('savePlanWaitItems') || 'Wait for items to finish loading, then Save again')
        return
      }
      const payload = buildSavePayload()
      if (!payload) return
      const toastId = toast.loading(t('saving') || 'Saving floorplan...')
      try {
        writeRecoverySnapshot(payload.layoutData, {
          name: currentBlueprint.name,
          id: currentBlueprint.id
        })
        setRecoverySavedAt(Date.now())
        await blueprintStorage.upsert(currentBlueprint.id, {
          name: currentBlueprint.name,
          layoutData: payload.layoutData,
          thumbnailBase64: payload.thumbnailBase64,
          roomType: currentBlueprint.roomType
        })
        try {
          const repo = await saveProjectToRepo({
            project: payload.layoutData,
            name: currentBlueprint.name,
            id: currentBlueprint.id,
            baseMtimeMs: repoMtimeMsRef.current
          })
          if (typeof repo.mtimeMs === 'number') repoMtimeMsRef.current = repo.mtimeMs
          const mergeHint =
            repo.merged && repo.mergeNotes?.length
              ? ` · merged: ${repo.mergeNotes.join('; ')}`
              : ''
          toast.success(
            `${tMain('savePlanRepoOk', {
              path: repo.relativeLatest,
              walls: repo.walls
            })}${mergeHint}`,
            { id: toastId, duration: 7000 }
          )
        } catch (repoErr) {
          console.error('[Save Plan] repo write failed:', repoErr)
          toast.success(
            tMain('savePlanRepoFail', {
              error: repoErr instanceof Error ? repoErr.message : String(repoErr)
            }),
            { id: toastId, duration: 8000 }
          )
          downloadProjectJson(
            payload.layoutData,
            `${currentBlueprint.name}-recovery.json`
          )
        }
      } catch (error) {
        console.error('Failed to update floorplan:', error)
        toast.error(t('saveError'), { id: toastId })
        downloadProjectJson(payload.layoutData, `${currentBlueprint.name}-recovery.json`)
      }
    } else {
      setSaveDialogOpen(true)
    }
  }, [buildSavePayload, currentBlueprint, t, tMain])

  const handleDownload = useCallback(() => {
    const payload = buildSavePayload()
    if (!payload) return
    writeRecoverySnapshot(payload.layoutData, {
      name: currentBlueprint?.name,
      id: currentBlueprint?.id
    })
    setRecoverySavedAt(Date.now())
    downloadProjectJson(
      payload.layoutData,
      `${(currentBlueprint?.name || 'vdesign-plan').replace(/[^\w.-]+/g, '-')}.json`
    )
    toast.success(tMain('downloadPlan'))
  }, [buildSavePayload, currentBlueprint?.id, currentBlueprint?.name, tMain])

  const handleNew = useCallback(() => {
    setSaveDialogOpen(true)
  }, [])

  // Create new blueprint via dialog
  const handleSaveFloorplan = useCallback(
    async (name: string, roomType: RoomType) => {
      const payload = buildSavePayload()
      if (!payload) return
      const toastId = toast.loading(t('saving') || 'Saving floorplan...')
      try {
        const result = await blueprintStorage.create({
          name,
          layoutData: payload.layoutData,
          thumbnailBase64: payload.thumbnailBase64,
          roomType
        })
        setCurrentBlueprint({ id: result.id, name, roomType })
        try {
          const repo = await saveProjectToRepo({
            project: payload.layoutData,
            name,
            id: result.id,
            baseMtimeMs: repoMtimeMsRef.current
          })
          if (typeof repo.mtimeMs === 'number') repoMtimeMsRef.current = repo.mtimeMs
          toast.success(
            tMain('savePlanRepoOk', { path: repo.relativeLatest, walls: repo.walls }),
            { id: toastId, duration: 7000 }
          )
        } catch (repoErr) {
          console.error(repoErr)
          toast.success(t('saveSuccess'), { id: toastId })
        }
      } catch (error) {
        console.error('Failed to save floorplan:', error)
        toast.error(t('saveError'), { id: toastId })
      }
    },
    [buildSavePayload, t, tMain]
  )

  const applyAreas = useCallback((areas: AreaLabel[]) => {
    areasRef.current = areas
    blueprint3dRef.current?.floorplanner?.setAreaLabels(areas)
  }, [])

  // Load from saved floorplan / imported project
  const handleLoadFloorplan = useCallback(
    (
      data: string,
      loadedMode?: RoomType,
      blueprintId?: string,
      blueprintName?: string,
      underlay?: UnderlayConfig | null,
      areas?: AreaLabel[],
      schedule?: WallScheduleEntry[]
    ) => {
      if (!blueprint3dRef.current) return
      blueprint3dRef.current.model.loadSerialized(data)
      if (loadedMode) setCurrentMode(loadedMode as Blueprint3DMode)
      if (blueprintId && blueprintName) {
        setCurrentBlueprint({
          id: blueprintId,
          name: blueprintName,
          roomType: loadedMode || RoomType.BEDROOM
        })
      } else if (blueprintName) {
        setCurrentBlueprint({
          id: blueprintId || `import-${Date.now()}`,
          name: blueprintName,
          roomType: loadedMode || RoomType.BEDROOM
        })
      }
      const nextUnderlay = underlay === undefined ? null : underlay
      underlayConfigRef.current = nextUnderlay
      setUnderlayState(nextUnderlay)
      const nextAreas = areas ?? []
      applyAreas(nextAreas)
      setWallSchedule(schedule ?? [])
      setOverlays(
        buildOverlayList({
          hasBlueprint: !!nextUnderlay,
          blueprintOpacity: nextUnderlay?.opacity ?? 0.4,
          hasAreas: nextAreas.length > 0
        })
      )
      setActiveTab('edit')
      setViewMode('2d')
      requestAnimationFrame(() => {
        const b = blueprint3dRef.current
        if (!b) return
        // Procedural entrances attach during loadSerialized; rebuild wall holes + 2D gaps
        b.model.floorplan.getWalls().forEach((w) => {
          if (w.items.length > 0) w.fireRedraw()
        })
        b.floorplanner?.reset()
        b.floorplanner?.setShowWallNumbers(true)
        if (nextUnderlay) {
          b.floorplanner?.setUnderlay({ ...nextUnderlay })
        } else {
          b.floorplanner?.setUnderlay(null)
        }
        applyAreas(nextAreas)
        applyFloorFinishes(b, floorFinishesRef.current, nextAreas)
      })
    },
    [applyAreas, buildOverlayList]
  )

  const applyProjectExtras = useCallback((project: VdesignProject) => {
    entrancesRef.current = Array.isArray(project.entrances)
      ? structuredClone(project.entrances)
      : []
    floorFinishesRef.current = Array.isArray(project.floorFinishes)
      ? structuredClone(project.floorFinishes)
      : []
  }, [])

  const handleLoadLatestPlan = useCallback(async () => {
    const toastId = toast.loading(tMain('loadLatestPlan'))
    try {
      const hint = currentBlueprintRef.current?.name || currentBlueprintRef.current?.id
      const { project, relativePath, mtimeMs } = await loadLatestProjectFromRepo(hint)
      repoMtimeMsRef.current = mtimeMs
      applyProjectExtras(project)
      handleLoadFloorplan(
        toSerializedRoom(project),
        RoomType.BEDROOM,
        currentBlueprintRef.current?.id || DEFAULT_PROJECT_ID,
        project.meta?.name || relativePath.replace(/^plans\//, '').replace(/\.json$/i, ''),
        normalizeUnderlay(project.underlay),
        normalizeAreas(project.areas),
        project.wallSchedule || []
      )
      const bp = currentBlueprintRef.current
      if (bp) {
        await blueprintStorage.upsert(bp.id, {
          name: bp.name,
          layoutData: project,
          roomType: bp.roomType
        })
      }
      writeRecoverySnapshot(project, { name: bp?.name, id: bp?.id })
      setRecoverySavedAt(Date.now())
      const walls = project.floorplan?.walls?.length ?? 0
      toast.success(tMain('loadLatestPlanOk', { path: relativePath, walls }), {
        id: toastId,
        duration: 6000
      })
    } catch (err) {
      console.error(err)
      toast.error(
        tMain('loadLatestPlanFail', {
          error: err instanceof Error ? err.message : String(err)
        }),
        { id: toastId }
      )
    }
  }, [applyProjectExtras, handleLoadFloorplan, tMain])

  const handleImportClick = useCallback(() => {
    importFileRef.current?.click()
  }, [])

  const handleImportFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      try {
        const project = parseProjectJson(await file.text())
        applyProjectExtras(project)
        handleLoadFloorplan(
          toSerializedRoom(project),
          RoomType.BEDROOM,
          undefined,
          project.meta?.name || file.name.replace(/\.json$/i, ''),
          normalizeUnderlay(project.underlay),
          normalizeAreas(project.areas),
          project.wallSchedule || []
        )
        toast.success(tSeed('importSuccess'))
      } catch (err) {
        console.error(err)
        toast.error(tSeed('importError'))
      }
    },
    [applyProjectExtras, handleLoadFloorplan, tSeed]
  )

  const handleOverlayToggle = useCallback((id: string, visible: boolean) => {
    setOverlays((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, visible } : o))
      const fp = blueprint3dRef.current?.floorplanner
      if (fp) {
        if (id === 'blueprint') {
          const cfg = underlayConfigRef.current
          const bp = next.find((o) => o.id === 'blueprint')
          if (visible && cfg) {
            fp.setUnderlay({ ...cfg, opacity: bp?.opacity ?? cfg.opacity })
          } else {
            fp.setUnderlay(null)
          }
        } else if (id === 'wallNumbers') {
          fp.setShowWallNumbers(visible)
        } else if (id === 'areaLabels') {
          fp.setAreaLabels(visible ? areasRef.current : [])
        }
      }
      return next
    })
  }, [])

  const applyUnderlay = useCallback(
    (next: UnderlayConfig | null, opts?: { visible?: boolean }) => {
      underlayConfigRef.current = next
      setUnderlayState(next)
      const fp = blueprint3dRef.current?.floorplanner
      const visible = opts?.visible ?? true
      if (next && visible) {
        fp?.setUnderlay({ ...next })
      } else {
        fp?.setUnderlay(null)
      }
      setOverlays((prev) => {
        const hasAreas = prev.some((o) => o.id === 'areaLabels') || areasRef.current.length > 0
        const wallNumbersVisible = prev.find((o) => o.id === 'wallNumbers')?.visible ?? true
        const areaLabelsVisible = prev.find((o) => o.id === 'areaLabels')?.visible ?? true
        return buildOverlayList({
          hasBlueprint: !!next,
          blueprintOpacity: next?.opacity ?? 0.4,
          blueprintVisible: !!next && visible,
          hasAreas,
          wallNumbersVisible,
          areaLabelsVisible
        })
      })
    },
    [buildOverlayList]
  )

  const handleUnderlayChange = useCallback((next: UnderlayConfig) => {
    underlayConfigRef.current = next
    setUnderlayState(next)
    setOverlays((prev) => {
      const had = prev.some((o) => o.id === 'blueprint')
      const mapped = prev.map((o) =>
        o.id === 'blueprint' ? { ...o, opacity: next.opacity, visible: true } : o
      )
      return had
        ? mapped
        : buildOverlayList({
            hasBlueprint: true,
            blueprintOpacity: next.opacity,
            blueprintVisible: true,
            hasAreas: areasRef.current.length > 0
          })
    })
    blueprint3dRef.current?.floorplanner?.updateUnderlay(next)
  }, [buildOverlayList])

  const handleUnderlayRemove = useCallback(() => {
    if (blueprintImageObjectUrlRef.current) {
      URL.revokeObjectURL(blueprintImageObjectUrlRef.current)
      blueprintImageObjectUrlRef.current = null
    }
    applyUnderlay(null, { visible: false })
  }, [applyUnderlay])

  const handleUnderlayAddFile = useCallback(
    (file: File) => {
      const objectUrl = URL.createObjectURL(file)
      if (blueprintImageObjectUrlRef.current) {
        URL.revokeObjectURL(blueprintImageObjectUrlRef.current)
      }
      blueprintImageObjectUrlRef.current = objectUrl

      const img = new Image()
      img.onload = () => {
        const size = blueprint3dRef.current?.model.floorplan.getSize()
        const planW = size && size.x > 0 ? size.x : 2000
        const planH = size && size.z > 0 ? size.z : 1200
        const aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
        let widthCm = planW
        let heightCm = widthCm / aspect
        if (heightCm > planH * 1.25) {
          heightCm = planH
          widthCm = heightCm * aspect
        }
        const existing = underlayConfigRef.current
        const next: UnderlayConfig = {
          url: objectUrl,
          opacity: existing?.opacity ?? 0.4,
          xCm: existing?.xCm ?? 0,
          yCm: existing?.yCm ?? 0,
          widthCm: existing?.widthCm && existing.url ? existing.widthCm : widthCm,
          heightCm: existing?.heightCm && existing.url ? existing.heightCm : heightCm
        }
        applyUnderlay(next, { visible: true })
        toast.success(tOverlays('blueprint'))
      }
      img.onerror = () => {
        toast.error(tSeed('loadError'))
        URL.revokeObjectURL(objectUrl)
        if (blueprintImageObjectUrlRef.current === objectUrl) {
          blueprintImageObjectUrlRef.current = null
        }
      }
      img.src = objectUrl
    },
    [applyUnderlay, tOverlays, tSeed]
  )

  const handleUnitChange = useCallback(
    (unit: string) => {
      Configuration.setValue(configDimUnit, unit)
      if (blueprint3dRef.current && activeTab === 'edit' && viewMode === '2d') {
        blueprint3dRef.current.floorplanner?.reset()
      }
    },
    [activeTab, viewMode]
  )

  const handleTabChange = useCallback(
    (tab: 'projects' | 'edit' | 'items') => {
      setActiveTab(tab)
      setTextureType(null)

      if (blueprint3dRef.current && tab === 'edit') {
        blueprint3dRef.current.three.stopSpin()
        blueprint3dRef.current.three.getController().setSelectedObject(null)

        if (viewMode === '2d') {
          const canvas = floorplannerCanvasRef.current
          if (canvas) {
            const resizeObserver = new ResizeObserver(() => {
              if (blueprint3dRef.current && canvas.clientWidth > 0) {
                blueprint3dRef.current.floorplanner?.reset()
                blueprint3dRef.current.floorplanner?.resetOrigin()
                resizeObserver.disconnect()
              }
            })
            resizeObserver.observe(canvas)
          }
        } else {
          blueprint3dRef.current.model.floorplan.update()
          setTimeout(() => {
            if (blueprint3dRef.current) {
              blueprint3dRef.current.three.updateWindowSize()
            }
          }, 100)
        }
      }
    },
    [viewMode]
  )

  const handleFloorplannerModeChange = useCallback((mode: 'move' | 'draw' | 'delete') => {
    setFloorplannerMode(mode)
    setViewMode('2d')
    setActiveTab('edit')
    if (!blueprint3dRef.current) return
    const modeMap = {
      move: floorplannerModes.MOVE,
      draw: floorplannerModes.DRAW,
      delete: floorplannerModes.DELETE
    }
    blueprint3dRef.current.floorplanner?.setMode(modeMap[mode])
    if (mode !== 'move') {
      setSelectedWall(null)
      setSelectedWallNumber(null)
      blueprint3dRef.current.floorplanner?.selectWall(null)
    }
    if (mode === 'draw') {
      toast.message(tFloorplanner('escHint'))
    } else if (mode === 'delete') {
      toast.message(tFloorplanner('deleteWalls'))
    }
  }, [tFloorplanner])

  /** 3D zoom — prefer Main helpers; fall back to controls (HMR may keep an old instance). */
  const withThreeZoom = useCallback((dir: 'in' | 'out' | 'fit') => {
    const three = blueprint3dRef.current?.three as
      | {
          zoomIn?: (n?: number) => void
          zoomOut?: (n?: number) => void
          fitCamera?: () => void
          centerCamera?: () => void
          camera?: { far: number; updateProjectionMatrix: () => void }
          controls?: {
            maxDistance: number
            dollyIn: (s?: number) => void
            dollyOut: (s?: number) => void
            update: () => void
          }
        }
      | null
      | undefined
    if (!three) return
    if (dir === 'fit') {
      three.fitCamera?.() ?? three.centerCamera?.()
      return
    }
    if (dir === 'in' && typeof three.zoomIn === 'function') {
      three.zoomIn()
      return
    }
    if (dir === 'out' && typeof three.zoomOut === 'function') {
      three.zoomOut()
      return
    }
    const controls = three.controls
    if (!controls) return
    controls.maxDistance = Math.max(controls.maxDistance || 0, 100000)
    if (three.camera) {
      three.camera.far = Math.max(three.camera.far || 0, controls.maxDistance * 2)
      three.camera.updateProjectionMatrix()
    }
    for (let i = 0; i < 6; i++) {
      if (dir === 'out') controls.dollyIn()
      else controls.dollyOut()
    }
    controls.update()
  }, [])

  const handleAddEntrance = useCallback(
    (kind: EntranceKind) => {
      const b = blueprint3dRef.current
      const host = selectedWall
      const n = selectedWallNumber
      if (!b || !host || n == null) {
        toast.error(tSidebar('addEntranceNeedWall'))
        return
      }
      if (!host.frontEdge && !host.backEdge) {
        toast.error(tSidebar('addEntranceFailed'))
        return
      }

      const catalog =
        kind === 'stairs'
          ? ITEMS.find((it) => it.key === 'entranceStairs')
          : ITEMS.find((it) => it.key === 'doorOne') || ITEMS.find((it) => it.category === 'door')
      if (!catalog) {
        toast.error(tSidebar('addEntranceFailed'))
        return
      }

      const kindLabel =
        kind === 'stairs' ? tSidebar('addEntranceStairs') : tSidebar('addEntranceDoor')
      const translatedName = tItems(catalog.key)
      const toastId = toast.loading(tItems('loadingItem', { name: translatedName }))

      const onLoaded = (item: Item) => {
        b.model.scene.itemLoadedCallbacks.remove(onLoaded)
        if (!(item instanceof WallItem)) {
          toast.error(tSidebar('addEntranceFailed'), { id: toastId })
          return
        }
        const ok = item.placeOnWall(host, 0.5)
        if (!ok) {
          toast.error(tSidebar('addEntranceFailed'), { id: toastId })
          return
        }
        item.metadata.entranceKind = kind
        item.metadata.hostWallN = n
        const nextN =
          (entrancesRef.current.reduce((m, e) => Math.max(m, e.n || 0), 0) || 0) + 1
        entrancesRef.current = [
          ...entrancesRef.current,
          {
            id: `entrance-${Date.now()}`,
            n: nextN,
            kind,
            wallN: n,
            name: kindLabel,
            offsetInches: undefined,
            sillInches: 0
          }
        ]
        toast.success(tSidebar('addEntrancePlaced', { n, kind: kindLabel }), { id: toastId })
        void persistPlanNow()
      }
      b.model.scene.itemLoadedCallbacks.add(onLoaded)

      const metadata = {
        itemName: catalog.name,
        itemKey: catalog.key,
        resizable: true,
        modelUrl: catalog.model,
        itemType: parseInt(catalog.type, 10),
        description: catalog.description,
        entranceKind: kind,
        hostWallN: n
      }
      b.model.scene.addItem(parseInt(catalog.type, 10), catalog.model, metadata)

      setActiveTab('edit')
      // Sync three controls (unlock orbit) — don't only flip React display
      handleViewChange('3d')
      setSidebarOpen(false)
    },
    [selectedWall, selectedWallNumber, tSidebar, tItems, persistPlanNow, handleViewChange]
  )

  const handleAddItem = useCallback(() => {
    setItemsCategory('all')
    setActiveTab('items')
    handleViewChange('3d')
  }, [handleViewChange])

  const handleInsertWall = useCallback(() => {
    const b = blueprint3dRef.current
    if (!b) return
    const walls = b.model.floorplan.getWalls()
    if (!walls.length) {
      toast.error(tSidebar('insertWallNeedHost'))
      return
    }
    const max = walls.length
    const raw = window.prompt(
      tSidebar('insertWallPrompt', { max }),
      selectedWallNumber != null ? String(selectedWallNumber) : String(max)
    )
    if (raw == null) return
    const trimmed = raw.trim()
    let afterN: number
    if (trimmed === '') {
      if (selectedWallNumber == null) {
        toast.error(tSidebar('insertWallNeedHost'))
        return
      }
      afterN = selectedWallNumber
    } else {
      afterN = parseInt(trimmed, 10)
    }
    if (!Number.isFinite(afterN) || afterN < 0 || afterN > max) {
      toast.error(tSidebar('insertWallNeedHost'))
      return
    }

    pushUndoSnapshot()
    setViewMode('2d')
    setActiveTab('edit')
    try {
      const inserted = b.model.floorplan.insertWallAfter(afterN - 1)
      const newN = afterN + 1
      setWallSchedule((prev) =>
        insertWallScheduleEntry(prev, afterN, {
          role: `Inserted after #${afterN}`,
          name: inserted.name || `basement #${newN} inserted`,
          outerLength: '8\'',
          thickness:
            inserted.thickness > 0
              ? `${+(inserted.thickness / 2.54).toFixed(2)}"`.replace(/\.00"/, '"')
              : null,
          wallType: inserted.wallType,
          exposure: inserted.exposure,
          notes: 'Inserted stub — set length / Connect Place'
        })
      )
      setFloorplannerMode('move')
      b.floorplanner?.setMode(floorplannerModes.MOVE)
      b.floorplanner?.selectWall(inserted)
      setSelectedWall(inserted)
      setSelectedWallNumber(newN)
      b.floorplanner?.redraw()
      void persistPlanNow()
      toast.success(tSidebar('insertWallDone', { n: newN, after: afterN }), {
        action: { label: 'Undo', onClick: () => handleUndo() }
      })
    } catch (err) {
      console.error(err)
      toast.error(tSidebar('insertWallNeedHost'))
    }
  }, [
    selectedWallNumber,
    pushUndoSnapshot,
    persistPlanNow,
    handleUndo,
    tSidebar
  ])

  const handleFloorplannerDone = useCallback(() => {
    if (blueprint3dRef.current) {
      blueprint3dRef.current.model.floorplan.update()
    }
    void persistPlanNow().then(() => {
      toast.success(tFloorplanner('doneSaved'))
    })
    setViewMode('3d')
  }, [persistPlanNow, tFloorplanner])

  const handleSelectWallNumber = useCallback((n: number) => {
    const b = blueprint3dRef.current
    if (!b) return
    const walls = b.model.floorplan.getWalls()
    const wall = walls[n - 1]
    if (!wall) return
    setViewMode('2d')
    setFloorplannerMode('move')
    b.floorplanner?.setMode(floorplannerModes.MOVE)
    b.floorplanner?.selectWall(wall)
    setSelectedWall(wall)
    setSelectedWallNumber(n)
  }, [])

  const handleTypedLength = useCallback((lengthCm: number) => {
    const fp = blueprint3dRef.current?.floorplanner
    if (!fp) return
    if (!fp.canCommitDrawLength()) {
      toast.message(tFloorplanner('typedLengthNeedStart'))
      return
    }
    fp.commitDrawLength(lengthCm)
  }, [tFloorplanner])

  const handleItemSelect = useCallback(
    (item: {
      name: string
      key: string
      model: string
      type: string
      description?: string
    }) => {
      if (!blueprint3dRef.current) return
      const translatedName = tItems(item.key)
      const toastId = toast.loading(tItems('loadingItem', { name: translatedName }))
      loadingToastsRef.current.push({ toastId, itemName: translatedName })

      const metadata = {
        itemName: item.name,
        itemKey: item.key,
        resizable: true,
        modelUrl: item.model,
        itemType: parseInt(item.type),
        description: item.description
      }

      blueprint3dRef.current.model.scene.addItem(parseInt(item.type), item.model, metadata)
      setActiveTab('edit')
      // Always pull up 3D (sync three controls — not only React display flag)
      handleViewChange('3d')
    },
    [tItems, handleViewChange]
  )

  const handleTextureSelect = useCallback(
    (textureUrl: string, stretch: boolean, scale: number) => {
      if (currentTarget) {
        currentTarget.setTexture(textureUrl, stretch, scale)
      }
    },
    [currentTarget]
  )

  return (
    <div className="relative h-full w-full">
      <input
        ref={importFileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFileChange}
      />

      {/* Main Content Area — blueprint canvas + 2D/3D only */}
      <div ref={contentRef} className="h-full w-full relative overflow-hidden">
        <TouchHelp />

        {!isFullscreen && (
          <>
            <AppSidebar
              open={sidebarOpen}
              onOpenChange={setSidebarOpen}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              overlays={overlays}
              onOverlayToggle={handleOverlayToggle}
              underlay={underlayState}
              onUnderlayChange={handleUnderlayChange}
              onUnderlayRemove={handleUnderlayRemove}
              onUnderlayAddFile={handleUnderlayAddFile}
              wallSchedule={wallSchedule}
              selectedWallNumber={selectedWallNumber}
              onSelectWallNumber={handleSelectWallNumber}
              onSave={handleSave}
              onNew={handleNew}
              onImport={handleImportClick}
              onDownload={handleDownload}
              onLoadLatest={handleLoadLatestPlan}
              onSettingsClick={() => setSettingsOpen(true)}
              projectName={currentBlueprint?.name}
              onHelpClick={() => setHelpOpen(true)}
              autosaveLabel={
                recoverySavedAt
                  ? `Autosaved ${new Date(recoverySavedAt).toLocaleTimeString()}`
                  : null
              }
              floorplannerMode={floorplannerMode}
              onFloorplannerMode={handleFloorplannerModeChange}
              onAddEntrance={handleAddEntrance}
              onAddItem={handleAddItem}
              onInsertWall={handleInsertWall}
              onOpenExteriorWalls={() => {
                setExteriorWallsOpen(true)
                setViewMode('2d')
                const walls = blueprint3dRef.current?.model.floorplan.getWalls() || []
                if (walls.length && selectedWallNumber == null) {
                  selectWallByIndex(0)
                } else if (selectedWallNumber != null) {
                  selectWallByIndex(selectedWallNumber - 1)
                }
              }}
            />
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
              <TopNavBar
                viewMode={viewMode}
                onViewModeChange={handleViewChange}
                showViewToggle
                onZoomIn={() => withThreeZoom('in')}
                onZoomOut={() => withThreeZoom('out')}
                onFitView={() => withThreeZoom('fit')}
              />
            </div>
          </>
        )}

        {/* Projects View */}
        <div
          className="absolute inset-0"
          style={{ display: activeTab === 'projects' ? 'block' : 'none' }}
        >
          {activeTab === 'projects' && (
            <ProjectsView
              onBlueprintLoad={(layoutData, roomType, id, name, underlay, areas, schedule) => {
                handleLoadFloorplan(layoutData, roomType, id, name, underlay, areas, schedule)
                setSidebarOpen(false)
              }}
            />
          )}
        </div>

        {/* Edit View */}
        <div
          className="absolute inset-0"
          style={{ display: activeTab === 'edit' || activeTab === 'items' ? 'block' : 'none' }}
        >
          <div
            id="viewer"
            ref={viewerRef}
            className="absolute inset-0"
            style={{ display: viewMode === '3d' ? 'block' : 'none' }}
          >
            {viewMode === '3d' && (
              <>
                {renderOverlay && renderOverlay()}
                {itemsLoading > 0 && (
                  <div id="loading-modal">
                    <div className="loading-content">
                      <p>
                        {tMyFloorplans('loading')}
                        <span className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div
            id="floorplanner"
            className="absolute inset-0"
            style={{ display: viewMode === '2d' ? 'block' : 'none' }}
          >
            <canvas id="floorplanner-canvas" ref={floorplannerCanvasRef}></canvas>
            {viewMode === '2d' && !isFullscreen && (
              <div className="absolute left-14 bottom-5 z-[60] flex flex-col items-start gap-2">
                <FloorplannerControls
                  mode={floorplannerMode}
                  onModeChange={handleFloorplannerModeChange}
                  onDone={handleFloorplannerDone}
                />
                {floorplannerMode === 'draw' && (
                  <>
                    <LengthInput enabled onCommit={handleTypedLength} />
                    <div className="rounded bg-black/50 px-2.5 py-1.5 text-sm text-primary-foreground">
                      {tFloorplanner('escHint')}
                    </div>
                  </>
                )}
              </div>
            )}
            {!selectedWall && canUndo && !isFullscreen && viewMode === '2d' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="pointer-events-auto absolute right-3 top-12 z-[70] h-8 gap-1 bg-background/95 shadow-md"
                onClick={handleUndo}
              >
                Undo
              </Button>
            )}
          </div>

          {/* One Wall Editor instance — portaled to body (papercut: open/visibility hell). */}
          {selectedWall && !isFullscreen && (
            <WallPropertiesPanel
              wall={selectedWall}
              wallNumber={selectedWallNumber}
              scheduleEntry={
                selectedWallNumber != null
                  ? wallSchedule.find((s) => s.n === selectedWallNumber) ?? null
                  : null
              }
              walls={(blueprint3dRef.current?.model.floorplan.getWalls() || []).map((w, i) => ({
                n: i + 1,
                wall: w,
                label: w.name || wallSchedule.find((s) => s.n === i + 1)?.role || `Wall ${i + 1}`
              }))}
              onClose={() => {
                setSelectedWall(null)
                setSelectedWallNumber(null)
                blueprint3dRef.current?.floorplanner?.selectWall(null)
              }}
              onBeforeMutate={pushUndoSnapshot}
              onChanged={handleWallPropsChanged}
              onConnectSaved={handleConnectSaved}
              onSchedulePatch={handleUpdateScheduleMeta}
              onConnectHostHighlight={handleConnectHostHighlight}
              onDelete={handleDeleteWall}
              canUndo={canUndo}
              onUndo={handleUndo}
            />
          )}

          {viewMode === '3d' &&
            !isFullscreen &&
            selectedItem &&
            isMovableFloorItem(selectedItem) && (
              <ItemMovePanel
                item={selectedItem}
                onMoved={() => {
                  blueprint3dRef.current?.three && ((blueprint3dRef.current.three as { _needsUpdate?: boolean })._needsUpdate = true)
                }}
              />
            )}

          {selectedItem &&
            isSectionalCouch(selectedItem) &&
            !textureType &&
            !isFullscreen && (
              <SectionalEditor
                selectedItem={selectedItem}
                scene={blueprint3dRef.current?.model.scene}
                onDelete={handleDeleteItem}
                onClose={() => {
                  selectedItem.setUnselected()
                  setSelectedItem(null)
                }}
              />
            )}

          {selectedItem &&
            !isSectionalCouch(selectedItem) &&
            !textureType &&
            !isFullscreen && (
              <div className="absolute right-2 md:right-4 top-16 md:top-20 z-[70]">
                <ContextMenu
                  selectedItem={selectedItem}
                  onDelete={handleDeleteItem}
                  onResize={handleResizeItem}
                  onFixedChange={handleFixedChange}
                />
              </div>
            )}

          {textureType && !isFullscreen && (
            <div className="absolute right-2 md:right-4 top-16 md:top-20 z-[70] max-h-[calc(100vh-100px)] md:max-h-[calc(100vh-120px)] overflow-y-auto">
              <TextureSelector type={textureType} onTextureSelect={handleTextureSelect} />
            </div>
          )}

          {mode === 'generator' && !selectedItem && !textureType && onBedSizeChange && !isFullscreen && (
            <div className="absolute right-2 md:right-4 top-16 md:top-20 z-[70]">
              <BedSizeInput onSizeChange={onBedSizeChange} />
            </div>
          )}
        </div>
      </div>

      {helpOpen && !isFullscreen && (
        <ControlsHelpForced viewMode={viewMode} onClose={() => setHelpOpen(false)} />
      )}

      <ItemsDrawer
        isOpen={activeTab === 'items'}
        onClose={() => {
          setActiveTab('edit')
          setItemsCategory('all')
        }}
        onItemSelect={handleItemSelect}
        initialCategory={itemsCategory}
      />

      <ExteriorWallsModal
        open={exteriorWallsOpen}
        onOpenChange={setExteriorWallsOpen}
        walls={blueprint3dRef.current?.model.floorplan.getWalls() || []}
        wallSchedule={wallSchedule}
        selectedIndex={Math.max(0, (selectedWallNumber ?? 1) - 1)}
        onSelectIndex={selectWallByIndex}
        onBeforeMutate={pushUndoSnapshot}
        onChanged={handleExteriorWallChanged}
        onConnectSaved={handleConnectSaved}
        onAddWall={handleAddExteriorWall}
        onUpdateScheduleMeta={handleUpdateScheduleMeta}
      />

      <SettingsDialog
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUnitChange={handleUnitChange}
        isLanguageOption={isLanguageOption}
      />

      <SaveFloorplanDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveFloorplan}
        defaultName={`Floorplan ${new Date().toLocaleDateString()}`}
        defaultRoomType={
          Object.values(RoomType).includes(currentMode as RoomType)
            ? (currentMode as RoomType)
            : RoomType.BEDROOM
        }
      />
    </div>
  )
}

/** Inline help dialog opened from the sidebar (no floating FAB). */
function ControlsHelpForced({
  viewMode,
  onClose
}: {
  viewMode: '2d' | '3d'
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">
          {viewMode === '2d' ? '2D Floorplanner Controls' : '3D Viewer Controls'}
        </h2>
        <p className="mb-2 text-sm text-muted-foreground">
          {viewMode === '2d'
            ? 'Use the left menu for move / draw / delete. Click a wall # badge (or the Edit list) to open Wall Editor. Type a length while drawing, then Enter.'
            : 'Click furniture to select. Drag it, or use N/E/S/W + angle (0–360). Orbit: left-drag · pan: right-drag · zoom: scroll.'}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
