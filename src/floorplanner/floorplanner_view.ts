import { Floorplan } from '../model/floorplan'
import { Wall } from '../model/wall'
import { Corner } from '../model/corner'
import { Room } from '../model/room'
import { HalfEdge } from '../model/half_edge'
import { Dimensioning } from '../core/dimensioning'
import { Utils } from '../core/utils'
import type { Floorplanner } from './floorplanner'
import type { UnderlayConfig } from './underlay'
import type { AreaLabel } from './area_label'
import type { ItemFootprint } from './item_footprint'
import {
  DEFAULT_LOT_SETBACKS,
  resolveSetbackLines,
  type PropertyBoundsCm,
  type SetbackSpec
} from './setback'

const footprintMinLabelPx = 8
const footprintMaxLabelPx = 12

/** */
export const floorplannerModes = {
  MOVE: 0,
  DRAW: 1,
  DELETE: 2
}

// grid parameters
const gridSpacing = 20 // pixels
const gridWidth = 1

// wall stroke base sizes (colors come from theme)
const wallWidth = 5
const wallWidthHover = 7

const deleteColor = '#ff0000'

// corner config
const cornerRadius = 0
const cornerRadiusHover = 7

type PlanTheme = {
  background: string | null
  gridColor: string
  roomColor: string
  wallColor: string
  wallColorHover: string
  wallColorSelected: string
  wallColorConnectHost: string
  wallColorAreaForm: string
  edgeColor: string
  edgeColorHover: string
  cornerColor: string
  cornerColorHover: string
  dimLabelFill: string
  dimLabelStroke: string
  areaLabelFill: string
  areaLabelStroke: string
  wallNumberFill: string
  wallNumberStroke: string
  wallNumberText: string
  entranceStroke: string
  entranceFill: string
  /** Structures / fixtures (default footprint ink). */
  footprintFill: string
  footprintStroke: string
  footprintLabelFill: string
  /** Trees / shrubs — keep a distinct green. */
  plantFootprintFill: string
  plantFootprintStroke: string
  plantFootprintLabelFill: string
  /** Blueprint measuring aids */
  measureGridColor: string
  setbackStroke: string
  setbackLabelFill: string
  scaleBarFill: string
  showUnderlay: boolean
}

const normalTheme: PlanTheme = {
  background: null,
  gridColor: '#f1f1f1',
  roomColor: '#f9f9f9',
  wallColor: '#dddddd',
  wallColorHover: '#008cba',
  wallColorSelected: '#1d4ed8',
  wallColorConnectHost: '#ea580c',
  wallColorAreaForm: '#0d9488',
  edgeColor: '#888888',
  edgeColorHover: '#008cba',
  cornerColor: '#cccccc',
  cornerColorHover: '#008cba',
  dimLabelFill: '#000000',
  dimLabelStroke: '#ffffff',
  areaLabelFill: '#0f172a',
  areaLabelStroke: 'rgba(255,255,255,0.9)',
  wallNumberFill: '#1d4ed8',
  wallNumberStroke: '#ffffff',
  wallNumberText: '#ffffff',
  entranceStroke: '#0f766e',
  entranceFill: '#0f766e',
  footprintFill: 'rgba(37, 99, 235, 0.16)',
  footprintStroke: 'rgba(29, 78, 216, 0.9)',
  footprintLabelFill: '#1e3a8a',
  plantFootprintFill: 'rgba(15, 118, 110, 0.18)',
  plantFootprintStroke: 'rgba(15, 118, 110, 0.9)',
  plantFootprintLabelFill: '#134e4a',
  measureGridColor: 'rgba(148, 163, 184, 0.35)',
  setbackStroke: '#64748b',
  setbackLabelFill: '#475569',
  scaleBarFill: '#1e293b',
  showUnderlay: true
}

/**
 * Printable construction sheet: black ink on white paper.
 * (Keeps blueprint *behavior* — dims first, no underlay — without navy/cyan.)
 */
const blueprintTheme: PlanTheme = {
  background: '#ffffff',
  gridColor: '#e5e7eb',
  roomColor: '#f8fafc',
  wallColor: '#111827',
  wallColorHover: '#1d4ed8',
  wallColorSelected: '#b45309',
  wallColorConnectHost: '#c2410c',
  wallColorAreaForm: '#0f766e',
  edgeColor: '#374151',
  edgeColorHover: '#1d4ed8',
  cornerColor: '#111827',
  cornerColorHover: '#1d4ed8',
  dimLabelFill: '#111827',
  dimLabelStroke: '#ffffff',
  areaLabelFill: '#111827',
  areaLabelStroke: 'rgba(255,255,255,0.92)',
  wallNumberFill: '#111827',
  wallNumberStroke: '#ffffff',
  wallNumberText: '#ffffff',
  entranceStroke: '#0f766e',
  entranceFill: '#0f766e',
  // Structure blue — same weight as the plant green, cooler ink for fixtures/furniture.
  footprintFill: 'rgba(37, 99, 235, 0.14)',
  footprintStroke: '#1d4ed8',
  footprintLabelFill: '#1e3a8a',
  plantFootprintFill: 'rgba(15, 118, 110, 0.14)',
  plantFootprintStroke: '#0f766e',
  plantFootprintLabelFill: '#134e4a',
  measureGridColor: 'rgba(203, 213, 225, 0.85)',
  setbackStroke: '#475569',
  setbackLabelFill: '#334155',
  scaleBarFill: '#111827',
  showUnderlay: false
}

/**
 * The View to be used by a Floorplanner to render in/interact with.
 */
export class FloorplannerView {
  /** The canvas element. */
  private canvasElement: HTMLCanvasElement

  /** The 2D context. */
  private context: CanvasRenderingContext2D

  /** Resize handler reference for cleanup */
  private resizeHandler: () => void

  /** Blueprint underlay (optional) */
  private underlay: UnderlayConfig | null = null
  private underlayImage: HTMLImageElement | null = null
  private underlayLoaded = false

  /** Named area labels (turf, mechanical, etc.) */
  private areaLabels: AreaLabel[] = []

  /** Municipal setbacks (null = auto-default when property fences exist). */
  private setbackSpecs: SetbackSpec[] | null = null

  /** Show W1, W2, … badges on wall midpoints */
  private showWallNumbers = true

  /** Dimension-first printable plan (black ink on white). */
  private blueprintMode = false

  /** Live footprints for non-wall scene items (2D overlay). */
  private itemFootprintProvider: (() => ItemFootprint[]) | null = null

  /** Green footprints (landscaping / movable). Blueprint toolbar can hide these. */
  private showLandscapingMovable = true

  private get theme(): PlanTheme {
    return this.blueprintMode ? blueprintTheme : normalTheme
  }

  /** */
  constructor(
    private floorplan: Floorplan,
    private viewmodel: Floorplanner,
    private canvas: string
  ) {
    this.canvasElement = document.getElementById(canvas) as HTMLCanvasElement
    this.context = this.canvasElement.getContext('2d') as CanvasRenderingContext2D

    // Bind resize handler for later cleanup
    this.resizeHandler = () => {
      this.handleWindowResize()
    }
    window.addEventListener('resize', this.resizeHandler)
    this.handleWindowResize()
  }

  /** Set or clear the blueprint underlay image. */
  public setUnderlay(config: UnderlayConfig | null): void {
    this.underlay = config
    this.underlayImage = null
    this.underlayLoaded = false
    if (!config?.url) {
      this.draw()
      return
    }
    const img = new Image()
    img.onload = () => {
      this.underlayImage = img
      this.underlayLoaded = true
      this.draw()
    }
    img.onerror = () => {
      console.warn('Failed to load underlay:', config.url)
      this.underlayImage = null
      this.underlayLoaded = false
      this.draw()
    }
    img.src = config.url
  }

  public getUnderlay(): UnderlayConfig | null {
    return this.underlay
  }

  public setUnderlayOpacity(opacity: number): void {
    if (!this.underlay) return
    this.underlay = { ...this.underlay, opacity: Math.max(0, Math.min(1, opacity)) }
    this.draw()
  }

  /** Update underlay fields. Reloads image only when url changes. */
  public updateUnderlay(partial: Partial<UnderlayConfig>): void {
    if (!this.underlay && !partial.url) return
    const next: UnderlayConfig = {
      url: partial.url ?? this.underlay?.url ?? '',
      opacity: partial.opacity ?? this.underlay?.opacity ?? 0.4,
      xCm: partial.xCm ?? this.underlay?.xCm ?? 0,
      yCm: partial.yCm ?? this.underlay?.yCm ?? 0,
      widthCm: partial.widthCm ?? this.underlay?.widthCm ?? 100,
      heightCm: partial.heightCm ?? this.underlay?.heightCm ?? 100
    }
    if (partial.opacity != null) {
      next.opacity = Math.max(0, Math.min(1, next.opacity))
    }
    const urlChanged = !this.underlay || this.underlay.url !== next.url
    this.underlay = next
    if (urlChanged) {
      this.setUnderlay(next)
      return
    }
    this.draw()
  }

  public setAreaLabels(labels: AreaLabel[]): void {
    this.areaLabels = labels || []
    this.draw()
  }

  /** Municipal setbacks for blueprint dashed lines (null → default lot setbacks when fences exist). */
  public setSetbacks(specs: SetbackSpec[] | null): void {
    this.setbackSpecs = specs
    this.draw()
  }

  public setShowWallNumbers(show: boolean): void {
    this.showWallNumbers = show
    this.draw()
  }

  /** Provide non-wall item footprints each redraw (or null to clear). */
  public setItemFootprintProvider(provider: (() => ItemFootprint[]) | null): void {
    this.itemFootprintProvider = provider
    this.draw()
  }

  /** Toggle green landscaping / movable footprints (blueprint overlay). */
  public setShowLandscapingMovable(show: boolean): void {
    if (this.showLandscapingMovable === show) return
    this.showLandscapingMovable = show
    this.draw()
  }

  public getShowLandscapingMovable(): boolean {
    return this.showLandscapingMovable
  }

  /** Cleanup method to remove event listeners */
  public destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  }

  /** */
  public handleWindowResize() {
    const canvasElement = document.getElementById(this.canvas) as HTMLCanvasElement
    // Check if canvas element exists before accessing parentElement
    if (!canvasElement) {
      console.warn('Canvas element not found:', this.canvas)
      return
    }
    const parent = canvasElement.parentElement
    if (parent) {
      const parentHeight = parent.clientHeight
      const parentWidth = parent.clientWidth
      canvasElement.style.height = parentHeight + 'px'
      canvasElement.style.width = parentWidth + 'px'
      this.canvasElement.height = parentHeight
      this.canvasElement.width = parentWidth
    }
    this.draw()
  }

  /** Toggle printable blueprint presentation (white paper, black ink). */
  public setBlueprintMode(enabled: boolean): void {
    if (this.blueprintMode === enabled) return
    this.blueprintMode = enabled
    this.draw()
  }

  public getBlueprintMode(): boolean {
    return this.blueprintMode
  }

  /** */
  public draw() {
    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    const { background } = this.theme
    if (background) {
      this.context.fillStyle = background
      this.context.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height)
    }

    this.drawUnderlay()
    this.drawGrid()

    this.floorplan.getRooms().forEach((room) => {
      this.drawRoom(room)
    })

    this.floorplan.getWalls().forEach((wall) => {
      this.drawWall(wall)
    })

    this.floorplan.getCorners().forEach((corner) => {
      this.drawCorner(corner)
    })

    if (this.viewmodel.mode == floorplannerModes.DRAW) {
      this.drawTarget(this.viewmodel.targetX, this.viewmodel.targetY, this.viewmodel.lastNode)
    }

    this.floorplan.getWalls().forEach((wall) => {
      this.drawWallLabels(wall)
    })

    // Entrances after wall strokes so gaps/glyphs sit on top of the centerline
    this.floorplan.getWalls().forEach((wall) => {
      this.drawWallEntrances(wall)
    })

    this.drawItemFootprints()

    // Blueprint mode is dimension-first — wall # badges clutter the print look.
    if (this.showWallNumbers && !this.blueprintMode) {
      this.drawWallNumbers()
    }

    this.drawAreaLabels()

    if (this.blueprintMode) {
      this.drawSetbacks()
      // Live UI uses React floating bar; canvas paint is for screenshots / PDF.
      if (this.paintScaleBarOnCanvas) this.drawScaleBar()
    }
  }

  /** Rotated footprints + clipped center labels for floor items. */
  private drawItemFootprints(): void {
    if (!this.itemFootprintProvider) return
    const footprints = this.itemFootprintProvider()
    if (!footprints?.length) return

    const ppc = this.viewmodel.pixelsPerCm || 0.5
    // Small fixtures last so they aren't covered by larger pads/furniture.
    const ordered = footprints
      .filter((fp) => fp.widthCm > 0 && fp.depthCm > 0)
      .slice()
      .sort((a, b) => b.widthCm * b.depthCm - a.widthCm * a.depthCm)

    for (const fp of ordered) {
      // Legacy: old 'furniture' kind was hidden on blueprint; movable is now 'plant' (green).
      if (this.blueprintMode && fp.kind === 'furniture') continue
      if (!this.showLandscapingMovable && fp.kind === 'plant') continue

      const cx = this.viewmodel.convertX(fp.xCm)
      const cy = this.viewmodel.convertY(fp.zCm)
      const halfW = (fp.widthCm / 2) * ppc
      const halfD = (fp.depthCm / 2) * ppc
      // Skip sub-pixel crumbs; keep anything readable when zoomed.
      if (halfW * 2 < 3 && halfD * 2 < 3) continue

      this.context.save()
      this.context.translate(cx, cy)
      // Canvas Y-down: negate Three.js Y rotation so local +X/+Z match the plan.
      this.context.rotate(-fp.rotationY)

      const theme = this.theme
      const plant = fp.kind === 'plant'
      const fill = plant ? theme.plantFootprintFill : theme.footprintFill
      const stroke = plant ? theme.plantFootprintStroke : theme.footprintStroke
      const labelFill = plant ? theme.plantFootprintLabelFill : theme.footprintLabelFill
      this.context.beginPath()
      this.context.rect(-halfW, -halfD, halfW * 2, halfD * 2)
      this.context.fillStyle = fill
      this.context.fill()
      const picked = fp.ref != null && fp.ref === this.viewmodel.selectedPlanItem
      this.context.lineWidth = picked ? 3 : this.blueprintMode ? 1.6 : 1.25
      this.context.strokeStyle = picked ? '#f97316' : stroke
      this.context.stroke()

      const label = (fp.label || '').trim()
      if (label) {
        this.drawFootprintLabel(label, halfW, halfD, labelFill)
      }
      // Blueprint zoom: length × width on the fixture when it has enough pixels.
      if (this.blueprintMode) {
        this.drawFootprintDimensions(fp.widthCm, fp.depthCm, halfW, halfD, labelFill)
      }
      this.context.restore()
    }
  }

  /**
   * Fixture L×W inside the footprint when zoomed in far enough (blueprint only).
   * Caller has already translated/rotated into footprint local space.
   */
  private drawFootprintDimensions(
    widthCm: number,
    depthCm: number,
    halfW: number,
    halfD: number,
    labelFill: string
  ): void {
    const minSide = Math.min(halfW, halfD) * 2
    if (minSide < 28) return
    const text = `${Dimensioning.cmToMeasure(widthCm)} × ${Dimensioning.cmToMeasure(depthCm)}`
    const fontPx = Math.min(11, Math.max(8, Math.floor(minSide * 0.22)))
    this.context.font = `${fontPx}px Arial`
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'
    if (this.context.measureText(text).width > Math.max(halfW, halfD) * 2 - 6) return
    this.context.fillStyle = labelFill
    // Sit near the bottom of the box so the name can stay centered.
    const y = halfD > 14 ? halfD * 0.55 : 0
    this.context.globalAlpha = 0.9
    this.context.fillText(text, 0, y)
    this.context.globalAlpha = 1
  }

  /**
   * Centered label inside the current footprint (caller has translated/rotated).
   * Runs along the longer footprint axis so narrow items (bike, etc.) stay readable.
   * Shrinks font then ellipsizes so text never overruns the box.
   */
  private drawFootprintLabel(label: string, halfW: number, halfD: number, labelFill: string): void {
    const pad = 4
    const alongDepth = halfD > halfW
    const maxAlong = Math.max(0, (alongDepth ? halfD : halfW) * 2 - pad * 2)
    const maxAcross = Math.max(0, (alongDepth ? halfW : halfD) * 2 - pad * 2)
    if (maxAlong < 10 || maxAcross < footprintMinLabelPx) return

    let fontPx = Math.min(
      footprintMaxLabelPx,
      Math.floor(maxAcross * 0.55),
      Math.floor(maxAlong / 5)
    )
    fontPx = Math.max(footprintMinLabelPx, fontPx)

    this.context.font = `${fontPx}px Arial`
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'

    let text = this.ellipsizeToWidth(label, maxAlong)
    while (fontPx > footprintMinLabelPx && this.context.measureText(text).width > maxAlong) {
      fontPx -= 1
      this.context.font = `${fontPx}px Arial`
      text = this.ellipsizeToWidth(label, maxAlong)
    }
    if (!text || this.context.measureText(text).width > maxAlong) return

    // Clip to footprint so any residual ink stays inside.
    this.context.save()
    this.context.beginPath()
    this.context.rect(-halfW, -halfD, halfW * 2, halfD * 2)
    this.context.clip()

    // Align baseline with the long axis; flip so text prefers left→right on screen.
    const m = this.context.getTransform()
    if (alongDepth) {
      // Canvas Y = local Z here; ±90° puts text +X onto ±local Z.
      this.context.rotate(m.b >= 0 ? Math.PI / 2 : -Math.PI / 2)
    } else if (m.a < 0) {
      this.context.rotate(Math.PI)
    }

    this.context.fillStyle = labelFill
    this.context.fillText(text, 0, 0)
    this.context.restore()
  }

  private ellipsizeToWidth(text: string, maxW: number): string {
    if (this.context.measureText(text).width <= maxW) return text
    const ellipsis = '…'
    if (this.context.measureText(ellipsis).width > maxW) return ''
    let lo = 0
    let hi = text.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      const candidate = text.slice(0, mid).trimEnd() + ellipsis
      if (this.context.measureText(candidate).width <= maxW) lo = mid
      else hi = mid - 1
    }
    if (lo <= 0) return ellipsis
    return text.slice(0, lo).trimEnd() + ellipsis
  }

  /** Number walls in array order (matches floorplan.json wallSchedule). */
  private drawWallNumbers(): void {
    const walls = this.floorplan.getWalls()
    const r = this.viewmodel.wallNumberBadgeRadiusPx()
    const fontPx = Math.max(8, Math.round(r * 0.92))
    const stroke = Math.max(1.5, Math.min(2.5, r * 0.14))
    this.context.save()
    walls.forEach((wall, index) => {
      const mx = (wall.getStartX() + wall.getEndX()) / 2
      const my = (wall.getStartY() + wall.getEndY()) / 2
      const x = this.viewmodel.convertX(mx)
      const y = this.viewmodel.convertY(my)
      const n = String(wall.num > 0 ? wall.num : index + 1)
      // Widen circle slightly for 2–3 digit labels so text stays inside the ring.
      const badgeR = n.length > 1 ? r + (n.length - 1) * (fontPx * 0.22) : r
      const theme = this.theme
      this.context.beginPath()
      this.context.arc(x, y, badgeR, 0, Math.PI * 2)
      this.context.fillStyle = theme.wallNumberFill
      this.context.fill()
      this.context.strokeStyle = theme.wallNumberStroke
      this.context.lineWidth = stroke
      this.context.stroke()
      this.context.fillStyle = theme.wallNumberText
      this.context.font = `bold ${fontPx}px Arial`
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'
      this.context.fillText(n, x, y + 0.5)
    })
    this.context.restore()
  }

  private drawAreaLabels(): void {
    if (!this.areaLabels.length) return
    const theme = this.theme
    this.context.save()
    this.context.font = 'bold 13px Arial'
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'
    for (const label of this.areaLabels) {
      const x = this.viewmodel.convertX(label.xCm)
      const y = this.viewmodel.convertY(label.yCm)
      this.context.strokeStyle = theme.areaLabelStroke
      this.context.lineWidth = 4
      this.context.strokeText(label.name, x, y)
      this.context.fillStyle = theme.areaLabelFill
      this.context.fillText(label.name, x, y)
    }
    this.context.restore()
  }

  private drawUnderlay(): void {
    if (!this.theme.showUnderlay) return
    if (!this.underlay || !this.underlayLoaded || !this.underlayImage) return

    const x = this.viewmodel.convertX(this.underlay.xCm)
    const y = this.viewmodel.convertY(this.underlay.yCm)
    const w =
      this.viewmodel.convertX(this.underlay.xCm + this.underlay.widthCm) -
      this.viewmodel.convertX(this.underlay.xCm)
    const h =
      this.viewmodel.convertY(this.underlay.yCm + this.underlay.heightCm) -
      this.viewmodel.convertY(this.underlay.yCm)

    this.context.save()
    this.context.globalAlpha = this.underlay.opacity
    this.context.drawImage(this.underlayImage, x, y, w, h)
    this.context.restore()
  }

  /** */
  private drawWallLabels(wall: Wall) {
    // Prefer half-edge length when available; always fall back to wall span
    // so perimeter fences still get annotated.
    if (wall.backEdge && wall.frontEdge) {
      if (wall.backEdge.interiorDistance() < wall.frontEdge.interiorDistance()) {
        this.drawEdgeLabel(wall.backEdge)
      } else {
        this.drawEdgeLabel(wall.frontEdge)
      }
      return
    }
    if (wall.backEdge) {
      this.drawEdgeLabel(wall.backEdge)
      return
    }
    if (wall.frontEdge) {
      this.drawEdgeLabel(wall.frontEdge)
      return
    }
    this.drawWallLengthLabel(wall)
  }

  /** Pixel stroke width for a wall body (matches thickness visually). */
  private wallStrokeWidth(wall: Wall): number {
    return Math.max(
      wallWidth,
      Math.min(14, (wall.thickness / 2.54) * (this.viewmodel.pixelsPerCm || 0.5) * 0.35)
    )
  }

  /** */
  private drawWall(wall: Wall) {
    const theme = this.theme
    const hover = wall === this.viewmodel.activeWall
    const selected = wall === this.viewmodel.selectedWall
    const connectHost = wall === this.viewmodel.connectHostWall
    const areaForm = this.viewmodel.areaFormWalls.includes(wall)
    let color = this.blueprintMode
      ? theme.wallColor
      : wall.getDisplayColor() || theme.wallColor
    const thickPx = this.wallStrokeWidth(wall)
    let width = thickPx
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
      width = Math.max(thickPx, wallWidthHover)
    } else if (areaForm) {
      color = theme.wallColorAreaForm
      width = Math.max(thickPx, wallWidthHover) + 1
    } else if (selected) {
      color = theme.wallColorSelected
      width = Math.max(thickPx, wallWidthHover) + 1
    } else if (connectHost) {
      color = theme.wallColorConnectHost
      width = Math.max(thickPx, wallWidthHover) + 1
    } else if (hover) {
      color = theme.wallColorHover
      width = Math.max(thickPx, wallWidthHover)
    }
    // Square caps close L/T outer corners (butt caps leave an open 45° notch).
    // Leave gaps where wall-hosted entrances sit so Load latest shows openings in 2D.
    const openings = this.wallEntranceSpans(wall)
    if (openings.length === 0) {
      this.drawLine(
        this.viewmodel.convertX(wall.getStartX()),
        this.viewmodel.convertY(wall.getStartY()),
        this.viewmodel.convertX(wall.getEndX()),
        this.viewmodel.convertY(wall.getEndY()),
        width,
        color,
        'square'
      )
    } else {
      this.drawWallSegmentsWithGaps(wall, openings, width, color)
    }
    // Do not also stroke half-edge face outlines — that double-draws every wall
    // as a grey "ghost" offset by thickness/2 (reads as duplicates everywhere).
  }

  /** Along-wall spans [t0,t1] in 0..1 for each InWall item on this wall. */
  private wallEntranceSpans(wall: Wall): { t0: number; t1: number }[] {
    const sx = wall.getStartX()
    const sy = wall.getStartY()
    const ex = wall.getEndX()
    const ey = wall.getEndY()
    const len = Math.hypot(ex - sx, ey - sy)
    if (len < 1e-6 || !wall.items?.length) return []
    const dx = ex - sx
    const dy = ey - sy
    const spans: { t0: number; t1: number }[] = []
    for (const item of wall.items) {
      const halfW = typeof item.getWidth === 'function' ? item.getWidth() / 2 : 40
      const px = item.position.x
      const pz = item.position.z
      const t = ((px - sx) * dx + (pz - sy) * dy) / (len * len)
      const along = t * len
      const t0 = Math.max(0, (along - halfW) / len)
      const t1 = Math.min(1, (along + halfW) / len)
      if (t1 > t0) spans.push({ t0, t1 })
    }
    spans.sort((a, b) => a.t0 - b.t0)
    return spans
  }

  private drawWallSegmentsWithGaps(
    wall: Wall,
    spans: { t0: number; t1: number }[],
    width: number,
    color: string
  ): void {
    const sx = wall.getStartX()
    const sy = wall.getStartY()
    const ex = wall.getEndX()
    const ey = wall.getEndY()
    let cursor = 0
    const drawSeg = (a: number, b: number) => {
      if (b - a < 1e-4) return
      this.drawLine(
        this.viewmodel.convertX(sx + (ex - sx) * a),
        this.viewmodel.convertY(sy + (ey - sy) * a),
        this.viewmodel.convertX(sx + (ex - sx) * b),
        this.viewmodel.convertY(sy + (ey - sy) * b),
        width,
        color,
        'square'
      )
    }
    for (const span of spans) {
      drawSeg(cursor, span.t0)
      cursor = Math.max(cursor, span.t1)
    }
    drawSeg(cursor, 1)
  }

  /** Door/stairs glyph + badge on each wall-hosted entrance (2D). */
  private drawWallEntrances(wall: Wall): void {
    if (!wall.items?.length) return
    const sx = wall.getStartX()
    const sy = wall.getStartY()
    const ex = wall.getEndX()
    const ey = wall.getEndY()
    const len = Math.hypot(ex - sx, ey - sy)
    if (len < 1e-6) return
    const ux = (ex - sx) / len
    const uy = (ey - sy) / len
    // Perpendicular unit (plan)
    const px = -uy
    const py = ux

    this.context.save()
    wall.items.forEach((item) => {
      const cx = this.viewmodel.convertX(item.position.x)
      const cy = this.viewmodel.convertY(item.position.z)
      const halfW = typeof item.getWidth === 'function' ? item.getWidth() / 2 : 40
      // Tick marks at opening ends
      const ax = this.viewmodel.convertX(item.position.x - ux * halfW)
      const ay = this.viewmodel.convertY(item.position.z - uy * halfW)
      const bx = this.viewmodel.convertX(item.position.x + ux * halfW)
      const by = this.viewmodel.convertY(item.position.z + uy * halfW)
      const tick = 5
      const nx = px * tick
      const ny = py * tick
      const theme = this.theme
      this.context.strokeStyle = theme.entranceStroke
      this.context.lineWidth = 2
      this.context.beginPath()
      this.context.moveTo(ax - nx, ay - ny)
      this.context.lineTo(ax + nx, ay + ny)
      this.context.moveTo(bx - nx, by - ny)
      this.context.lineTo(bx + nx, by + ny)
      // Swing arc hint
      this.context.moveTo(ax, ay)
      this.context.quadraticCurveTo(cx + nx * 2.5, cy + ny * 2.5, bx, by)
      this.context.stroke()

      // Badge — S for stairs opening, E for door
      const label = item.metadata?.entranceKind === 'stairs' ? 'S' : 'E'
      const r = 9
      this.context.beginPath()
      this.context.arc(cx, cy, r, 0, Math.PI * 2)
      this.context.fillStyle = theme.entranceFill
      this.context.fill()
      const entrancePicked = item === this.viewmodel.selectedEntrance
      this.context.strokeStyle = entrancePicked ? '#f97316' : theme.wallNumberStroke
      this.context.lineWidth = entrancePicked ? 3 : 1.5
      this.context.stroke()
      this.context.fillStyle = theme.wallNumberText
      this.context.font = 'bold 10px Arial'
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'
      this.context.fillText(label, cx, cy + 0.5)
    })
    this.context.restore()
  }

  /**
   * Dimension label for a wall that has room half-edges.
   * Always use centerline length (Wall.getLength) so the label matches Wall
   * Editor Apply. interiorDistance() is the clear span between interior
   * corners and reads short once rooms close (e.g. after deleting walls and
   * enclosing a zone) — that was showing 7'6" on a 7'10" wall.
   */
  private drawEdgeLabel(edge: HalfEdge) {
    const wall = edge.wall
    const length = wall.getLength()
    // Anchor on the wall centerline, then offset so E/W (and N/S edge)
    // labels aren't clipped off the canvas.
    this.drawDimensionAnnotation(
      wall.getStartX(),
      wall.getStartY(),
      wall.getEndX(),
      wall.getEndY(),
      length
    )
  }

  /** Wall length when the wall has no room half-edge. */
  private drawWallLengthLabel(wall: Wall): void {
    const sx = wall.getStartX()
    const sy = wall.getStartY()
    const ex = wall.getEndX()
    const ey = wall.getEndY()
    const length = Math.hypot(ex - sx, ey - sy)
    this.drawDimensionAnnotation(sx, sy, ex, ey, length)
  }

  /**
   * Zoom LOD: only label walls long enough on screen for the text to fit.
   * Zooming in raises pixelsPerCm → more (shorter) walls cross the threshold.
   */
  private shouldShowDimension(lengthCm: number, text: string, fontSize: number): boolean {
    if (!(lengthCm > 1)) return false
    const ppc = this.viewmodel.pixelsPerCm || 0.5
    const wallPx = lengthCm * ppc
    this.context.font = `bold ${fontSize}px Arial`
    const textPx = this.context.measureText(text).width
    if (this.blueprintMode) {
      // Aggressive when zoomed: short room walls (5′ / 7′) should still label.
      // Need the wall longer on screen than the string by a small gutter.
      return wallPx >= Math.max(22, textPx + 10)
    }
    return lengthCm >= 60 && wallPx >= textPx * 0.85
  }

  /**
   * Dimension string along a segment, offset toward the plan center so
   * east/west perimeter labels stay on-canvas and readable.
   */
  private drawDimensionAnnotation(
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    lengthCm: number
  ): void {
    const dx = ex - sx
    const dy = ey - sy
    const len = Math.hypot(dx, dy)
    if (len < 1e-6) return

    const theme = this.theme
    const text = Dimensioning.cmToMeasure(lengthCm)
    const fontSize = this.blueprintMode ? 13 : 12
    if (!this.shouldShowDimension(lengthCm, text, fontSize)) return

    const midX = (sx + ex) / 2
    const midY = (sy + ey) / 2
    // Unit along wall; perpendicular (left of along).
    const ux = dx / len
    const uy = dy / len
    let nx = -uy
    let ny = ux

    // Prefer the side toward the plan center (keeps E/W dims inside the lot).
    const center = this.floorplan.getCenter()
    const toCenterX = center.x - midX
    const toCenterY = center.z - midY
    if (nx * toCenterX + ny * toCenterY < 0) {
      nx = -nx
      ny = -ny
    }

    const ppc = this.viewmodel.pixelsPerCm || 0.5
    const offsetPx = this.blueprintMode ? 16 : 22
    const offsetCm = offsetPx / ppc
    const labelX = midX + nx * offsetCm
    const labelY = midY + ny * offsetCm

    const px = this.viewmodel.convertX(labelX)
    const py = this.viewmodel.convertY(labelY)
    const ax = this.viewmodel.convertX(sx + nx * offsetCm)
    const ay = this.viewmodel.convertY(sy + ny * offsetCm)
    const bx = this.viewmodel.convertX(ex + nx * offsetCm)
    const by = this.viewmodel.convertY(ey + ny * offsetCm)

    let angle = Math.atan2(by - ay, bx - ax)
    // Keep text upright (never upside-down).
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      angle += Math.PI
    }

    if (this.blueprintMode) {
      // Thin dim line + end ticks (classic print style).
      const tick = 5
      const tnx = -Math.sin(Math.atan2(by - ay, bx - ax)) * tick
      const tny = Math.cos(Math.atan2(by - ay, bx - ax)) * tick
      this.context.save()
      this.context.strokeStyle = theme.dimLabelFill
      this.context.globalAlpha = 0.55
      this.context.lineWidth = 1
      this.context.beginPath()
      this.context.moveTo(ax, ay)
      this.context.lineTo(bx, by)
      this.context.moveTo(ax - tnx, ay - tny)
      this.context.lineTo(ax + tnx, ay + tny)
      this.context.moveTo(bx - tnx, by - tny)
      this.context.lineTo(bx + tnx, by + tny)
      this.context.stroke()
      this.context.restore()
    }

    this.context.save()
    this.context.translate(px, py)
    this.context.rotate(angle)
    this.context.font = `bold ${fontSize}px Arial`
    this.context.fillStyle = theme.dimLabelFill
    this.context.textBaseline = 'middle'
    this.context.textAlign = 'center'
    this.context.strokeStyle = theme.dimLabelStroke
    this.context.lineWidth = this.blueprintMode ? 5 : 4
    this.context.strokeText(text, 0, 0)
    this.context.fillText(text, 0, 0)
    this.context.restore()
  }

  /** */
  private drawRoom(room: Room) {
    this.drawPolygon(
      Utils.map(room.corners, (corner: Corner) => {
        return this.viewmodel.convertX(corner.x)
      }),
      Utils.map(room.corners, (corner: Corner) => {
        return this.viewmodel.convertY(corner.y)
      }),
      true,
      this.theme.roomColor
    )
  }

  /**
   * Fill wall junctions so outer L-corners don't show an empty diamond.
   * Drawn as a square the size of the thickest meeting wall stroke.
   */
  private drawCornerJunctionFill(corner: Corner): void {
    const theme = this.theme
    const walls = corner.getWalls()
    if (walls.length < 2) return
    let maxW = 0
    let fillColor = theme.wallColor
    for (const wall of walls) {
      const w = this.wallStrokeWidth(wall)
      if (w >= maxW) {
        maxW = w
        fillColor = this.blueprintMode
          ? theme.wallColor
          : wall.getDisplayColor() || theme.wallColor
      }
    }
    if (maxW <= 0) return
    const cx = this.viewmodel.convertX(corner.x)
    const cy = this.viewmodel.convertY(corner.y)
    const r = maxW / 2
    this.context.fillStyle = fillColor
    this.context.fillRect(cx - r, cy - r, maxW, maxW)
  }

  /** */
  private drawCorner(corner: Corner) {
    this.drawCornerJunctionFill(corner)

    const theme = this.theme
    const hover = corner === this.viewmodel.activeCorner
    let color = theme.cornerColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = theme.cornerColorHover
    }
    const radius = hover ? cornerRadiusHover : cornerRadius
    if (radius <= 0) return
    this.drawCircle(
      this.viewmodel.convertX(corner.x),
      this.viewmodel.convertY(corner.y),
      radius,
      color
    )
  }

  /** */
  private drawTarget(x: number, y: number, lastNode: Corner | null) {
    const theme = this.theme
    this.drawCircle(
      this.viewmodel.convertX(x),
      this.viewmodel.convertY(y),
      cornerRadiusHover,
      theme.cornerColorHover
    )
    if (this.viewmodel.lastNode) {
      this.drawLine(
        this.viewmodel.convertX(lastNode!.x),
        this.viewmodel.convertY(lastNode!.y),
        this.viewmodel.convertX(x),
        this.viewmodel.convertY(y),
        wallWidthHover,
        theme.wallColorHover
      )
    }
  }

  /** */
  private drawLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    width: number,
    color: string,
    lineCap: CanvasLineCap = 'butt'
  ) {
    // width is an integer
    // color is a hex string, i.e. #ff0000
    this.context.beginPath()
    this.context.moveTo(startX, startY)
    this.context.lineTo(endX, endY)
    this.context.lineWidth = width
    this.context.strokeStyle = color
    this.context.lineCap = lineCap
    this.context.lineJoin = 'miter'
    this.context.stroke()
    // Restore default so grid/edges stay butt-capped
    this.context.lineCap = 'butt'
  }

  /** */
  private drawPolygon(
    xArr: number[],
    yArr: number[],
    fill?: boolean,
    fillColor?: string | null,
    stroke?: boolean,
    strokeColor?: string,
    strokeWidth?: number
  ) {
    // fillColor is a hex string, i.e. #ff0000
    fill = fill || false
    stroke = stroke || false
    this.context.beginPath()
    this.context.moveTo(xArr[0], yArr[0])
    for (let i = 1; i < xArr.length; i++) {
      this.context.lineTo(xArr[i], yArr[i])
    }
    this.context.closePath()
    if (fill && fillColor) {
      this.context.fillStyle = fillColor
      this.context.fill()
    }
    if (stroke && strokeColor) {
      this.context.lineWidth = strokeWidth!
      this.context.strokeStyle = strokeColor
      this.context.stroke()
    }
  }

  /** */
  private drawCircle(centerX: number, centerY: number, radius: number, fillColor: string) {
    this.context.beginPath()
    this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)
    this.context.fillStyle = fillColor
    this.context.fill()
  }

  /** returns n where -gridSize/2 < n <= gridSize/2  */
  private calculateGridOffset(n: number): number {
    if (n >= 0) {
      return ((n + gridSpacing / 2.0) % gridSpacing) - gridSpacing / 2.0
    } else {
      return ((n - gridSpacing / 2.0) % gridSpacing) + gridSpacing / 2.0
    }
  }

  /** */
  private drawGrid() {
    if (this.blueprintMode) {
      this.drawMeasureGrid()
      return
    }
    const gridColor = this.theme.gridColor
    const offsetX = this.calculateGridOffset(-this.viewmodel.originX)
    const offsetY = this.calculateGridOffset(-this.viewmodel.originY)
    const width = this.canvasElement.width
    const height = this.canvasElement.height
    for (let x = 0; x <= width / gridSpacing; x++) {
      this.drawLine(
        gridSpacing * x + offsetX,
        0,
        gridSpacing * x + offsetX,
        height,
        gridWidth,
        gridColor
      )
    }
    for (let y = 0; y <= height / gridSpacing; y++) {
      this.drawLine(
        0,
        gridSpacing * y + offsetY,
        width,
        gridSpacing * y + offsetY,
        gridWidth,
        gridColor
      )
    }
  }

  /** Very light 5′ world-aligned dotted grid for measuring on blueprints. */
  private drawMeasureGrid(): void {
    const ppc = this.viewmodel.pixelsPerCm || 0.5
    const stepCm = 5 * 30.48
    const stepPx = stepCm * ppc
    if (stepPx < 6) return

    const width = this.canvasElement.width
    const height = this.canvasElement.height
    const originWorldX = this.viewmodel.originX / ppc
    const originWorldY = this.viewmodel.originY / ppc
    const startXCm = Math.floor(originWorldX / stepCm) * stepCm
    const startYCm = Math.floor(originWorldY / stepCm) * stepCm
    const endXCm = originWorldX + width / ppc
    const endYCm = originWorldY + height / ppc

    this.context.save()
    this.context.strokeStyle = this.theme.measureGridColor
    this.context.lineWidth = 1
    this.context.setLineDash([2, 6])
    this.context.beginPath()
    for (let xCm = startXCm; xCm <= endXCm + stepCm; xCm += stepCm) {
      const x = this.viewmodel.convertX(xCm)
      this.context.moveTo(x, 0)
      this.context.lineTo(x, height)
    }
    for (let yCm = startYCm; yCm <= endYCm + stepCm; yCm += stepCm) {
      const y = this.viewmodel.convertY(yCm)
      this.context.moveTo(0, y)
      this.context.lineTo(width, y)
    }
    this.context.stroke()
    this.context.restore()
  }

  /** Property AABB — prefer fence / PL walls when present. */
  private propertyBoundsCm(): PropertyBoundsCm | null {
    const fenceWalls = this.floorplan.getWalls().filter(
      (w) =>
        w.wallType === 'fence' ||
        /property fence|property line|\bPL\b/i.test(w.name || '')
    )
    const walls = fenceWalls.length >= 3 ? fenceWalls : this.floorplan.getWalls()
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const w of walls) {
      for (const c of [w.getStart(), w.getEnd()]) {
        if (!c) continue
        minX = Math.min(minX, c.x)
        maxX = Math.max(maxX, c.x)
        minY = Math.min(minY, c.y)
        maxY = Math.max(maxY, c.y)
      }
    }
    if (!(maxX > minX) || !(maxY > minY)) return null
    return { minX, maxX, minY, maxY }
  }

  private hasPropertyFence(): boolean {
    return this.floorplan.getWalls().some(
      (w) =>
        w.wallType === 'fence' ||
        /property fence|property line|\bPL\b/i.test(w.name || '')
    )
  }

  /** Dashed municipal setbacks with edge labels (blueprint only). */
  private drawSetbacks(): void {
    const bounds = this.propertyBoundsCm()
    if (!bounds) return
    const specs =
      this.setbackSpecs && this.setbackSpecs.length
        ? this.setbackSpecs
        : this.hasPropertyFence()
          ? DEFAULT_LOT_SETBACKS
          : null
    if (!specs) return

    const lines = resolveSetbackLines(bounds, specs)
    const theme = this.theme
    for (const line of lines) {
      const x1 = this.viewmodel.convertX(line.x1Cm)
      const y1 = this.viewmodel.convertY(line.y1Cm)
      const x2 = this.viewmodel.convertX(line.x2Cm)
      const y2 = this.viewmodel.convertY(line.y2Cm)

      this.context.save()
      this.context.strokeStyle = theme.setbackStroke
      this.context.lineWidth = 1.75
      this.context.setLineDash([8, 5])
      this.context.beginPath()
      this.context.moveTo(x1, y1)
      this.context.lineTo(x2, y2)
      this.context.stroke()

      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
      this.context.setLineDash([])
      this.context.fillStyle = theme.setbackLabelFill
      this.context.font = 'bold 11px Arial'
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'
      this.context.save()
      this.context.translate(mx, my)
      if (!horizontal) this.context.rotate(-Math.PI / 2)
      this.context.fillText(line.label, 0, -10)
      this.context.restore()
      this.context.restore()
    }
  }

  /**
   * When false, skip painting the canvas scale (React overlay owns the live UI).
   * Print/PDF capture turns this on so the bar is baked into the PNG.
   */
  private paintScaleBarOnCanvas = false

  /** Enable canvas scale for capturePlanPng; live Blueprint uses the floating React bar. */
  public setPaintScaleBarOnCanvas(enabled: boolean): void {
    this.paintScaleBarOnCanvas = enabled
  }

  /**
   * Graphic scale for print/PDF — always 5′ / 10′, SE corner (screen-space).
   */
  private drawScaleBar(): void {
    const ppc = this.viewmodel.pixelsPerCm || 0.5
    const barFt = 10
    const barPx = Math.max(48, barFt * 30.48 * ppc)
    const halfPx = barPx / 2

    // Match FloorplannerControls: bottom-5 (20px) + right-3 (12px)
    const marginRight = 12
    const marginBottom = 20
    const boxPadX = 10
    const boxPadY = 8
    const barH = 8
    const labelH = 12
    const boxW = barPx + boxPadX * 2
    const boxH = barH + labelH + boxPadY * 2
    const boxX = this.canvasElement.width - marginRight - boxW
    const boxY = this.canvasElement.height - marginBottom - boxH
    const x0 = boxX + boxPadX
    const y0 = boxY + boxPadY + barH
    const fill = this.theme.scaleBarFill

    this.context.save()
    this.context.fillStyle = 'rgba(255,255,255,0.95)'
    this.context.strokeStyle = 'rgba(15,23,42,0.12)'
    this.context.lineWidth = 1
    this.context.beginPath()
    this.context.roundRect(boxX, boxY, boxW, boxH, 8)
    this.context.fill()
    this.context.stroke()

    // Alternating 5′ blocks
    this.context.fillStyle = fill
    this.context.fillRect(x0, y0 - barH, halfPx, barH)
    this.context.strokeStyle = fill
    this.context.lineWidth = 1.25
    this.context.strokeRect(x0, y0 - barH, barPx, barH)
    this.context.beginPath()
    this.context.moveTo(x0 + halfPx, y0 - barH)
    this.context.lineTo(x0 + halfPx, y0)
    this.context.stroke()

    this.context.fillStyle = fill
    this.context.font = '10px Arial'
    this.context.textBaseline = 'top'
    this.context.textAlign = 'left'
    this.context.fillText('0′', x0, y0 + 2)
    this.context.textAlign = 'center'
    this.context.fillText('5′', x0 + halfPx, y0 + 2)
    this.context.textAlign = 'right'
    this.context.fillText('10′', x0 + barPx, y0 + 2)
    this.context.restore()
  }
}
