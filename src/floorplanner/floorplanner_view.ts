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

const footprintFill = 'rgba(92, 92, 98, 0.22)'
const footprintStroke = 'rgba(71, 71, 77, 0.85)'
const footprintLabelFill = '#1e293b'
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
const gridColor = '#f1f1f1'

// room config
const roomColor = '#f9f9f9'

// wall config
const wallWidth = 5
const wallWidthHover = 7
const wallColor = '#dddddd'
const wallColorHover = '#008cba'
/** Connect host while Wall Editor is open (distinct from selected blue). */
const wallColorConnectHost = '#ea580c'
const edgeColor = '#888888'
const edgeColorHover = '#008cba'
const edgeWidth = 1

const deleteColor = '#ff0000'

// corner config
const cornerRadius = 0
const cornerRadiusHover = 7
const cornerColor = '#cccccc'
const cornerColorHover = '#008cba'

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

  /** Show W1, W2, … badges on wall midpoints */
  private showWallNumbers = true

  /** Live footprints for non-wall scene items (2D overlay). */
  private itemFootprintProvider: (() => ItemFootprint[]) | null = null

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

  public setShowWallNumbers(show: boolean): void {
    this.showWallNumbers = show
    this.draw()
  }

  /** Provide non-wall item footprints each redraw (or null to clear). */
  public setItemFootprintProvider(provider: (() => ItemFootprint[]) | null): void {
    this.itemFootprintProvider = provider
    this.draw()
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

  /** */
  public draw() {
    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)

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

    if (this.showWallNumbers) {
      this.drawWallNumbers()
    }

    this.drawAreaLabels()
  }

  /** Rotated footprints + clipped center labels for floor items. */
  private drawItemFootprints(): void {
    if (!this.itemFootprintProvider) return
    const footprints = this.itemFootprintProvider()
    if (!footprints?.length) return

    const ppc = this.viewmodel.pixelsPerCm || 0.5
    for (const fp of footprints) {
      if (!(fp.widthCm > 0) || !(fp.depthCm > 0)) continue
      const cx = this.viewmodel.convertX(fp.xCm)
      const cy = this.viewmodel.convertY(fp.zCm)
      const halfW = (fp.widthCm / 2) * ppc
      const halfD = (fp.depthCm / 2) * ppc

      this.context.save()
      this.context.translate(cx, cy)
      // Canvas Y-down: negate Three.js Y rotation so local +X/+Z match the plan.
      this.context.rotate(-fp.rotationY)

      this.context.beginPath()
      this.context.rect(-halfW, -halfD, halfW * 2, halfD * 2)
      this.context.fillStyle = footprintFill
      this.context.fill()
      this.context.lineWidth = 1.25
      this.context.strokeStyle = footprintStroke
      this.context.stroke()

      const label = (fp.label || '').trim()
      if (label) {
        this.drawFootprintLabel(label, halfW, halfD)
      }
      this.context.restore()
    }
  }

  /**
   * Centered label inside the current footprint (caller has translated/rotated).
   * Runs along the longer footprint axis so narrow items (bike, etc.) stay readable.
   * Shrinks font then ellipsizes so text never overruns the box.
   */
  private drawFootprintLabel(label: string, halfW: number, halfD: number): void {
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

    this.context.fillStyle = footprintLabelFill
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
    this.context.save()
    walls.forEach((wall, index) => {
      const mx = (wall.getStartX() + wall.getEndX()) / 2
      const my = (wall.getStartY() + wall.getEndY()) / 2
      const x = this.viewmodel.convertX(mx)
      const y = this.viewmodel.convertY(my)
      const n = String(index + 1)
      const r = 11
      this.context.beginPath()
      this.context.arc(x, y, r, 0, Math.PI * 2)
      this.context.fillStyle = '#1d4ed8'
      this.context.fill()
      this.context.strokeStyle = '#ffffff'
      this.context.lineWidth = 2
      this.context.stroke()
      this.context.fillStyle = '#ffffff'
      this.context.font = 'bold 11px Arial'
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'
      this.context.fillText(n, x, y + 0.5)
    })
    this.context.restore()
  }

  private drawAreaLabels(): void {
    if (!this.areaLabels.length) return
    this.context.save()
    this.context.font = 'bold 13px Arial'
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'
    for (const label of this.areaLabels) {
      const x = this.viewmodel.convertX(label.xCm)
      const y = this.viewmodel.convertY(label.yCm)
      this.context.strokeStyle = 'rgba(255,255,255,0.9)'
      this.context.lineWidth = 4
      this.context.strokeText(label.name, x, y)
      this.context.fillStyle = '#0f172a'
      this.context.fillText(label.name, x, y)
    }
    this.context.restore()
  }

  private drawUnderlay(): void {
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
    // we'll just draw the shorter label... idk
    if (wall.backEdge && wall.frontEdge) {
      if (wall.backEdge.interiorDistance < wall.frontEdge.interiorDistance) {
        this.drawEdgeLabel(wall.backEdge)
      } else {
        this.drawEdgeLabel(wall.frontEdge)
      }
    } else if (wall.backEdge) {
      this.drawEdgeLabel(wall.backEdge)
    } else if (wall.frontEdge) {
      this.drawEdgeLabel(wall.frontEdge)
    }
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
    const hover = wall === this.viewmodel.activeWall
    const selected = wall === this.viewmodel.selectedWall
    const connectHost = wall === this.viewmodel.connectHostWall
    let color = wall.getDisplayColor() || wallColor
    const thickPx = this.wallStrokeWidth(wall)
    let width = thickPx
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
      width = Math.max(thickPx, wallWidthHover)
    } else if (selected) {
      color = '#1d4ed8'
      width = Math.max(thickPx, wallWidthHover) + 1
    } else if (connectHost) {
      color = wallColorConnectHost
      width = Math.max(thickPx, wallWidthHover) + 1
    } else if (hover) {
      color = wallColorHover
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
    if (!hover && wall.frontEdge) {
      this.drawEdge(wall.frontEdge, hover)
    }
    if (!hover && wall.backEdge) {
      this.drawEdge(wall.backEdge, hover)
    }
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
      this.context.strokeStyle = '#0f766e'
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
      this.context.fillStyle = '#0f766e'
      this.context.fill()
      this.context.strokeStyle = '#ffffff'
      this.context.lineWidth = 1.5
      this.context.stroke()
      this.context.fillStyle = '#ffffff'
      this.context.font = 'bold 10px Arial'
      this.context.textAlign = 'center'
      this.context.textBaseline = 'middle'
      this.context.fillText(label, cx, cy + 0.5)
    })
    this.context.restore()
  }

  /** */
  private drawEdgeLabel(edge: HalfEdge) {
    const pos = edge.interiorCenter()
    const length = edge.interiorDistance()
    if (length < 60) {
      // dont draw labels on walls this short
      return
    }
    this.context.font = 'normal 12px Arial'
    this.context.fillStyle = '#000000'
    this.context.textBaseline = 'middle'
    this.context.textAlign = 'center'
    this.context.strokeStyle = '#ffffff'
    this.context.lineWidth = 4

    this.context.strokeText(
      Dimensioning.cmToMeasure(length),
      this.viewmodel.convertX(pos.x),
      this.viewmodel.convertY(pos.y)
    )
    this.context.fillText(
      Dimensioning.cmToMeasure(length),
      this.viewmodel.convertX(pos.x),
      this.viewmodel.convertY(pos.y)
    )
  }

  /** */
  private drawEdge(edge: HalfEdge, hover: boolean) {
    let color = edgeColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = edgeColorHover
    }
    const corners = edge.corners()

    this.drawPolygon(
      Utils.map(corners, (corner) => {
        return this.viewmodel.convertX(corner.x)
      }),
      Utils.map(corners, (corner) => {
        return this.viewmodel.convertY(corner.y)
      }),
      false,
      null,
      true,
      color,
      edgeWidth
    )
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
      roomColor
    )
  }

  /**
   * Fill wall junctions so outer L-corners don't show an empty diamond.
   * Drawn as a square the size of the thickest meeting wall stroke.
   */
  private drawCornerJunctionFill(corner: Corner): void {
    const walls = corner.getWalls()
    if (walls.length < 2) return
    let maxW = 0
    let fillColor = wallColor
    for (const wall of walls) {
      const w = this.wallStrokeWidth(wall)
      if (w >= maxW) {
        maxW = w
        fillColor = wall.getDisplayColor() || wallColor
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

    const hover = corner === this.viewmodel.activeCorner
    let color = cornerColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = cornerColorHover
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
    this.drawCircle(
      this.viewmodel.convertX(x),
      this.viewmodel.convertY(y),
      cornerRadiusHover,
      cornerColorHover
    )
    if (this.viewmodel.lastNode) {
      this.drawLine(
        this.viewmodel.convertX(lastNode!.x),
        this.viewmodel.convertY(lastNode!.y),
        this.viewmodel.convertX(x),
        this.viewmodel.convertY(y),
        wallWidthHover,
        wallColorHover
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
}
