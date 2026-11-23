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
import { BedSizeInput } from './BedSizeInput'
import { LengthInput } from './LengthInput'
import { FloorplannerControls } from './FloorplannerControls'
import { WallPropertiesPanel } from './WallPropertiesPanel'
import { TextureSelector } from './TextureSelector'
import type { Wall } from '@blueprint3d/model/wall'
import { cmToInches } from './InchesDimensionInput'
import {
  downloadProjectJson,
  readRecoverySnapshot,
  writeRecoverySnapshot
} from '@/services/recovery'
import {
  normalizeAreas,
  normalizeUnderlay,
  parseProjectJson,
  toSerializedRoom
} from '@/lib/load-project'
import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { OverlayDescriptor } from '@blueprint3d/floorplanner/overlay'
import type { WallScheduleEntry, VdesignProject } from '@/types/project'
import { SaveFloorplanDialog } from './SaveFloorplanDialog'

const DEFAULT_PROJECT_PATH = '/projects/2713-s-224th-basement/floorplan.json'
import { TouchHelp } from './TouchHelp'
import DefaultFloorplan from '@blueprint3d/templates/default.json'
import { blueprintStorage } from '@/services/storage'

import { Blueprint3d } from '@blueprint3d/blueprint3d'
import { floorplannerModes } from '@blueprint3d/floorplanner/floorplanner_view'
import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'
import type { Item } from '@blueprint3d/items/item'
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

  const [activeTab, setActiveTab] = useState<'projects' | 'edit' | 'items'>(
    openMyFloorplans ? 'projects' : 'edit'
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [floorplannerMode, setFloorplannerMode] = useState<'move' | 'draw' | 'delete'>('move')
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

  const tSeed = useTranslations('BluePrint.seedProjects')
  const tOverlays = useTranslations('BluePrint.overlays')

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

    // 3D: click toggles wall inspector (2D uses double-click)
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
      setItemsLoading((prev) => prev + 1)
    })

    blueprint3d.model.scene.itemLoadedCallbacks.add((item) => {
      setItemsLoading((prev) => prev - 1)
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.success(tItems('loadedSuccess', { name: itemName }), { id: toastId })
      }
    })

    blueprint3d.model.scene.itemLoadErrorCallbacks.add(() => {
      setItemsLoading((prev) => prev - 1)
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.error(tItems('loadError', { name: itemName }), { id: toastId })
      }
    })

    // Default: 2713 S 224th basement project
    const loadInitialFloorplan = async () => {
      try {
        const res = await fetch(`${DEFAULT_PROJECT_PATH}?t=${Date.now()}`, {
          cache: 'no-store'
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const project = parseProjectJson(await res.text()) as VdesignProject
        blueprint3d.model.loadSerialized(toSerializedRoom(project))
        setCurrentBlueprint({
          id: '2713-s-224th-basement',
          name: project.meta?.name || '2713 S 224th — Basement',
          roomType: RoomType.BEDROOM
        })
        setWallSchedule(project.wallSchedule || [])
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
        })
      } catch (error) {
        console.error('[Blueprint3DAppBase] Error loading default project:', error)
        blueprint3d.model.loadSerialized(JSON.stringify(DefaultFloorplan))
      }
    }

    loadInitialFloorplan().then(() => {
      if (recoveryOfferedRef.current) return
      const snap = readRecoverySnapshot()
      if (!snap?.project) return
      recoveryOfferedRef.current = true
      const when = snap.meta?.savedAt
        ? new Date(snap.meta.savedAt).toLocaleString()
        : 'earlier'
      toast.message(`Recovery snapshot from ${when}`, {
        description: 'Restore unsaved edits from this browser?',
        duration: 12000,
        action: {
          label: 'Restore',
          onClick: () => {
            const project = snap.project
            blueprint3d.model.loadSerialized(toSerializedRoom(project))
            setWallSchedule(project.wallSchedule || [])
            const underlay = normalizeUnderlay(project.underlay)
            underlayConfigRef.current = underlay
            setUnderlayState(underlay)
            const areas = normalizeAreas(project.areas)
            areasRef.current = areas
            if (snap.meta?.name) {
              setCurrentBlueprint((prev) =>
                prev
                  ? { ...prev, name: snap.meta?.name || prev.name, id: snap.meta?.id || prev.id }
                  : {
                      id: snap.meta?.id || `recovery-${Date.now()}`,
                      name: snap.meta?.name || 'Recovered plan',
                      roomType: RoomType.BEDROOM
                    }
              )
            }
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
            })
            toast.success('Plan restored from recovery snapshot')
          }
        }
      })
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
      wallSchedule,
      meta: {
        name: currentBlueprint?.name
      }
    }
    return { layoutData, thumbnailBase64 }
  }, [currentBlueprint?.name, generateTopDownThumbnail, wallSchedule])

  const persistRecovery = useCallback(() => {
    const payload = buildSavePayload()
    if (!payload) return
    writeRecoverySnapshot(payload.layoutData, {
      name: currentBlueprint?.name,
      id: currentBlueprint?.id
    })
    setRecoverySavedAt(Date.now())
  }, [buildSavePayload, currentBlueprint?.id, currentBlueprint?.name])

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
      setWallSchedule((prev) =>
        prev.map((entry) =>
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
      )
    }
    void persistPlanNow()
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

  // Debounced recovery autosave — survives refresh/crash in localStorage
  useEffect(() => {
    if (!blueprint3dRef.current) return
    const timer = window.setTimeout(() => {
      persistRecovery()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [persistRecovery, wallSchedule, underlayState, selectedWall, viewMode])

  // Save: upsert existing or show dialog
  const handleSave = useCallback(async () => {
    if (currentBlueprint) {
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
        toast.success(t('saveSuccess'), { id: toastId })
      } catch (error) {
        console.error('Failed to update floorplan:', error)
        toast.error(t('saveError'), { id: toastId })
        // Still offer a file the user can keep
        downloadProjectJson(payload.layoutData, `${currentBlueprint.name}-recovery.json`)
      }
    } else {
      setSaveDialogOpen(true)
    }
  }, [buildSavePayload, currentBlueprint, t])

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
        toast.success(t('saveSuccess'), { id: toastId })
      } catch (error) {
        console.error('Failed to save floorplan:', error)
        toast.error(t('saveError'), { id: toastId })
      }
    },
    [buildSavePayload, t]
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
        blueprint3dRef.current?.floorplanner?.reset()
        blueprint3dRef.current?.floorplanner?.setShowWallNumbers(true)
        if (nextUnderlay) {
          blueprint3dRef.current?.floorplanner?.setUnderlay({ ...nextUnderlay })
        } else {
          blueprint3dRef.current?.floorplanner?.setUnderlay(null)
        }
        applyAreas(nextAreas)
      })
    },
    [applyAreas, buildOverlayList]
  )

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
    [handleLoadFloorplan, tSeed]
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
  }, [])

  const handleFloorplannerDone = useCallback(() => {
    setViewMode('3d')
    if (blueprint3dRef.current) {
      blueprint3dRef.current.model.floorplan.update()
    }
  }, [])

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
      setViewMode('3d')
    },
    [tItems]
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
              onSettingsClick={() => setSettingsOpen(true)}
              projectName={currentBlueprint?.name}
              onHelpClick={() => setHelpOpen(true)}
              autosaveLabel={
                recoverySavedAt
                  ? `Autosaved ${new Date(recoverySavedAt).toLocaleTimeString()}`
                  : null
              }
            />
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
              <TopNavBar
                viewMode={viewMode}
                onViewModeChange={handleViewChange}
                showViewToggle
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
            {selectedWall && !isFullscreen && (
              <WallPropertiesPanel
                wall={selectedWall}
                wallNumber={selectedWallNumber}
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
                onDelete={handleDeleteWall}
                canUndo={canUndo}
                onUndo={handleUndo}
              />
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

          {viewMode === '3d' && selectedWall && !isFullscreen && (
            <WallPropertiesPanel
              wall={selectedWall}
              wallNumber={selectedWallNumber}
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
              onDelete={handleDeleteWall}
              canUndo={canUndo}
              onUndo={handleUndo}
            />
          )}

          {selectedItem && !textureType && !isFullscreen && (
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
        onClose={() => setActiveTab('edit')}
        onItemSelect={handleItemSelect}
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
            ? 'Use the left menu for move / draw / delete. Double-click a wall to edit properties. Type a length while drawing, then Enter.'
            : 'Orbit with left drag, pan with right drag, zoom with scroll. Click a wall to edit properties.'}
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
