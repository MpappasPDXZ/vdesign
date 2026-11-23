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

    if (this.showWallNumbers) {
      this.drawWallNumbers()
    }

    this.drawAreaLabels()
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

  /** */
  private drawWall(wall: Wall) {
    const hover = wall === this.viewmodel.activeWall
    const selected = wall === this.viewmodel.selectedWall
    let color = wall.getDisplayColor() || wallColor
    // Scale stroke with thickness so Apply thickness is visible without reload
    const thickPx = Math.max(
      wallWidth,
      Math.min(14, (wall.thickness / 2.54) * (this.viewmodel.pixelsPerCm || 0.5) * 0.35)
    )
    let width = thickPx
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
      width = Math.max(thickPx, wallWidthHover)
    } else if (selected) {
      color = '#1d4ed8'
      width = Math.max(thickPx, wallWidthHover) + 1
    } else if (hover) {
      color = wallColorHover
      width = Math.max(thickPx, wallWidthHover)
    }
    this.drawLine(
      this.viewmodel.convertX(wall.getStartX()),
      this.viewmodel.convertY(wall.getStartY()),
      this.viewmodel.convertX(wall.getEndX()),
      this.viewmodel.convertY(wall.getEndY()),
      width,
      color
    )
    if (!hover && wall.frontEdge) {
      this.drawEdge(wall.frontEdge, hover)
    }
    if (!hover && wall.backEdge) {
      this.drawEdge(wall.backEdge, hover)
    }
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

  /** */
  private drawCorner(corner: Corner) {
    const hover = corner === this.viewmodel.activeCorner
    let color = cornerColor
    if (hover && this.viewmodel.mode == floorplannerModes.DELETE) {
      color = deleteColor
    } else if (hover) {
      color = cornerColorHover
    }
    this.drawCircle(
      this.viewmodel.convertX(corner.x),
      this.viewmodel.convertY(corner.y),
      hover ? cornerRadiusHover : cornerRadius,
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
    color: string
  ) {
    // width is an integer
    // color is a hex string, i.e. #ff0000
    this.context.beginPath()
    this.context.moveTo(startX, startY)
    this.context.lineTo(endX, endY)
    this.context.lineWidth = width
    this.context.strokeStyle = color
    this.context.stroke()
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
