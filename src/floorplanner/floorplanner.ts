import { Floorplan } from '../model/floorplan'
import { Wall } from '../model/wall'
import { Corner } from '../model/corner'
import { FloorplannerView, floorplannerModes } from './floorplanner_view'
import type { UnderlayConfig } from './underlay'
import type { AreaLabel } from './area_label'
import { EventEmitter } from '../core/events'

type FloorplannerMode = (typeof floorplannerModes)[keyof typeof floorplannerModes]

/** how much will we move a corner to make a wall axis aligned (cm) */
const snapTolerance = 25

/**
 * The Floorplanner implements an interactive tool for creation of floorplans.
 */
export class Floorplanner {
  /** */
  public mode: FloorplannerMode = floorplannerModes.MOVE

  /** */
  public activeWall: Wall | null = null

  /** */
  public activeCorner: Corner | null = null

  /** */
  public originX = 0

  /** */
  public originY = 0

  /** drawing state */
  public targetX = 0

  /** drawing state */
  public targetY = 0

  /** drawing state */
  public lastNode: Corner | null = null

  /** */
  // @ts-ignore - wallWidth is declared but not used, keeping for future use
  private wallWidth: number

  /** */
  private modeResetCallbacks: Array<(mode: FloorplannerMode) => void> = []

  /** Fired when Wall Editor should open (`wall`) or close (`null`). */
  public wallSelectedCallbacks = new EventEmitter<Wall | null>()

  /** Currently selected wall for property editing */
  public selectedWall: Wall | null = null

  /**
   * Connect host while Wall Editor is open — drawn orange so the join
   * target is obvious next to the blue selected wall.
   */
  public connectHostWall: Wall | null = null

  /** */
  private canvasElement: HTMLCanvasElement

  /** */
  private view: FloorplannerView

  /** */
  private mouseDown = false

  /** */
  private mouseMoved = false

  /** in ThreeJS coords */
  private mouseX = 0

  /** in ThreeJS coords */
  private mouseY = 0

  /** in ThreeJS coords */
  private rawMouseX = 0

  /** in ThreeJS coords */
  private rawMouseY = 0

  /** mouse position at last click */
  private lastX = 0

  /** mouse position at last click */
  private lastY = 0

  /** */
  private cmPerPixel: number

  /** */
  public pixelsPerCm: number

  /** Add a callback for mode reset */
  public addModeResetCallback(callback: (mode: FloorplannerMode) => void): void {
    this.modeResetCallbacks.push(callback)
  }

  /** Provides jQuery-style Callbacks API for backward compatibility */
  public get modeResetCallbacksAPI(): {
    add: (callback: (mode: FloorplannerMode) => void) => void
  } {
    return {
      add: (callback: (mode: FloorplannerMode) => void) => this.addModeResetCallback(callback)
    }
  }

  /** */
  constructor(
    canvas: string,
    private floorplan: Floorplan
  ) {
    this.canvasElement = document.getElementById(canvas) as HTMLCanvasElement

    this.view = new FloorplannerView(this.floorplan, this, canvas)

    const cmPerFoot = 30.48
    const pixelsPerFoot = 15.0
    this.cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot)
    this.pixelsPerCm = 1.0 / this.cmPerPixel

    this.wallWidth = 10.0 * this.pixelsPerCm

    // Initialization:

    this.setMode(floorplannerModes.MOVE)

    this.canvasElement.addEventListener('mousedown', () => {
      this.mousedown()
    })
    this.canvasElement.addEventListener('mousemove', (event: MouseEvent) => {
      this.mousemove(event)
    })
    this.canvasElement.addEventListener('mouseup', () => {
      this.mouseup()
    })
    this.canvasElement.addEventListener('mouseleave', () => {
      this.mouseleave()
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.keyCode == 27) {
        this.escapeKey()
      }
    })

    floorplan.roomLoadedCallbacks.add(() => {
      this.reset()
    })
  }

  /** */
  private escapeKey(): void {
    this.setMode(floorplannerModes.MOVE)
  }

  /** */
  private updateTarget(): void {
    if (this.mode == floorplannerModes.DRAW && this.lastNode) {
      if (Math.abs(this.mouseX - this.lastNode.x) < snapTolerance) {
        this.targetX = this.lastNode.x
      } else {
        this.targetX = this.mouseX
      }
      if (Math.abs(this.mouseY - this.lastNode.y) < snapTolerance) {
        this.targetY = this.lastNode.y
      } else {
        this.targetY = this.mouseY
      }
    } else {
      this.targetX = this.mouseX
      this.targetY = this.mouseY
    }

    this.view.draw()
  }

  /** */
  private mousedown(): void {
    this.mouseDown = true
    this.mouseMoved = false
    this.lastX = this.rawMouseX
    this.lastY = this.rawMouseY

    // delete
    if (this.mode == floorplannerModes.DELETE) {
      if (this.activeCorner) {
        this.activeCorner.removeAll()
      } else if (this.activeWall) {
        this.activeWall.remove()
      } else {
        this.setMode(floorplannerModes.MOVE)
      }
    }
  }

  /** */
  private mousemove(event: MouseEvent): void {
    // update mouse
    this.rawMouseX = event.clientX
    this.rawMouseY = event.clientY

    // Treat only real drags as movement (browser fires mousemove on clicks)
    if (
      this.mouseDown &&
      (Math.abs(this.rawMouseX - this.lastX) > 3 || Math.abs(this.rawMouseY - this.lastY) > 3)
    ) {
      this.mouseMoved = true
    }

    const rect = this.canvasElement.getBoundingClientRect()
    this.mouseX = (event.clientX - rect.left) * this.cmPerPixel + this.originX * this.cmPerPixel
    this.mouseY = (event.clientY - rect.top) * this.cmPerPixel + this.originY * this.cmPerPixel

    // update target (snapped position of actual mouse)
    if (
      this.mode == floorplannerModes.DRAW ||
      (this.mode == floorplannerModes.MOVE && this.mouseDown)
    ) {
      this.updateTarget()
    }

    // update object target
    if (this.mode != floorplannerModes.DRAW && !this.mouseDown) {
      const hoverCorner: Corner | null = this.floorplan.overlappedCorner(this.mouseX, this.mouseY)
      // MOVE: only the numbered mid-span badge (avoids parallel-wall miss-hits).
      // DELETE: still allow body hit so delete remains usable with numbers off.
      const badgeRadiusCm = 14 * this.cmPerPixel
      const hoverWall: Wall | null =
        this.mode == floorplannerModes.MOVE
          ? this.floorplan.overlappedWallBadge(this.mouseX, this.mouseY, badgeRadiusCm)
          : this.floorplan.overlappedWall(this.mouseX, this.mouseY)
      let draw = false
      if (hoverCorner != this.activeCorner) {
        this.activeCorner = hoverCorner
        draw = true
      }
      // corner takes precendence
      if (this.activeCorner == null) {
        if (hoverWall != this.activeWall) {
          this.activeWall = hoverWall
          draw = true
        }
      } else {
        this.activeWall = null
      }
      if (draw) {
        this.view.draw()
      }
    }

    // panning
    if (this.mouseDown && !this.activeCorner && !this.activeWall) {
      this.originX += this.lastX - this.rawMouseX
      this.originY += this.lastY - this.rawMouseY
      this.lastX = this.rawMouseX
      this.lastY = this.rawMouseY
      this.view.draw()
    }

    // dragging
    if (this.mode == floorplannerModes.MOVE && this.mouseDown) {
      if (this.activeCorner) {
        this.activeCorner.move(this.mouseX, this.mouseY)
        this.activeCorner.snapToAxis(snapTolerance)
      } else if (this.activeWall) {
        this.activeWall.relativeMove(
          (this.rawMouseX - this.lastX) * this.cmPerPixel,
          (this.rawMouseY - this.lastY) * this.cmPerPixel
        )
        this.activeWall.snapToAxis(snapTolerance)
        this.lastX = this.rawMouseX
        this.lastY = this.rawMouseY
      }
      this.view.draw()
    }
  }

  /** */
  private mouseup(): void {
    // Only treat as a canvas click if mousedown started on the canvas.
    // Otherwise dragging/selecting text in the wall edit panel and releasing
    // over the plan closes the inspector.
    const canvasClick = this.mouseDown && !this.mouseMoved
    this.mouseDown = false

    // drawing
    if (this.mode == floorplannerModes.DRAW && canvasClick) {
      const corner = this.floorplan.newCorner(this.targetX, this.targetY)
      if (this.lastNode != null) {
        this.floorplan.newWall(this.lastNode, corner)
      }
      if (corner.mergeWithIntersected() && this.lastNode != null) {
        this.setMode(floorplannerModes.MOVE)
      }
      this.lastNode = corner
    }

    // # badge click opens Wall Editor (MOVE, no drag). Never toggle-close on
    // the same badge — double-click would open then instantly close.
    // Close: empty canvas click, or X in the panel.
    if (this.mode == floorplannerModes.MOVE && canvasClick) {
      const wall = this.activeWall
      if (wall) {
        this.selectedWall = wall
        this.wallSelectedCallbacks.fire(wall)
        this.view.draw()
      } else if (!this.activeCorner) {
        if (this.selectedWall) {
          this.selectedWall = null
          this.wallSelectedCallbacks.fire(null)
          this.view.draw()
        }
      }
    }
  }

  public selectWall(wall: Wall | null): void {
    this.selectedWall = wall
    if (!wall) this.connectHostWall = null
    this.wallSelectedCallbacks.fire(wall)
    this.view.draw()
  }

  /** Highlight the Connect host (orange). Pass null to clear. */
  public setConnectHostWall(wall: Wall | null): void {
    this.connectHostWall = wall
    this.view.draw()
  }

  /** Redraw the 2D canvas without resetting pan/zoom. */
  public redraw(): void {
    this.view.draw()
  }

  /** */
  private mouseleave(): void {
    this.mouseDown = false
    //scope.setMode(scope.modes.MOVE);
  }

  /** Resets the view - centers and resizes the floorplan */
  public reset(): void {
    this.resizeView()
    this.setMode(floorplannerModes.MOVE)
    this.resetOrigin()
    this.view.draw()
  }

  /** Resizes the view to fit the container */
  public resizeView(): void {
    this.view.handleWindowResize()
  }

  /** Sets the interaction mode */
  public setMode(mode: FloorplannerMode): void {
    this.lastNode = null
    this.mode = mode
    this.modeResetCallbacks.forEach((callback) => callback(mode))
    this.updateTarget()
  }

  /** Sets the origin so that floorplan is centered */
  public resetOrigin(): void {
    const centerX = this.canvasElement.clientWidth / 2.0
    const centerY = this.canvasElement.clientHeight / 2.0
    const centerFloorplan = this.floorplan.getCenter()
    this.originX = centerFloorplan.x * this.pixelsPerCm - centerX
    this.originY = centerFloorplan.z * this.pixelsPerCm - centerY
  }

  /** Convert from THREEjs coords to canvas coords. */
  public convertX(x: number): number {
    return (x - this.originX * this.cmPerPixel) * this.pixelsPerCm
  }

  /** Convert from THREEjs coords to canvas coords. */
  public convertY(y: number): number {
    return (y - this.originY * this.cmPerPixel) * this.pixelsPerCm
  }

  /**
   * While drawing, place the next corner at an exact length (cm) from lastNode
   * along the current mouse/target direction. Starts a new wall from that corner.
   * @returns true if a segment was committed
   */
  public commitDrawLength(lengthCm: number): boolean {
    if (this.mode !== floorplannerModes.DRAW || !this.lastNode || !(lengthCm > 0)) {
      return false
    }

    let dx = this.targetX - this.lastNode.x
    let dy = this.targetY - this.lastNode.y
    let dist = Math.sqrt(dx * dx + dy * dy)

    // Default to +X if the mouse hasn't moved away from the last node yet
    if (dist < 0.01) {
      dx = 1
      dy = 0
      dist = 1
    }

    const scale = lengthCm / dist
    const x = this.lastNode.x + dx * scale
    const y = this.lastNode.y + dy * scale

    const corner = this.floorplan.newCorner(x, y)
    this.floorplan.newWall(this.lastNode, corner)
    if (corner.mergeWithIntersected()) {
      this.setMode(floorplannerModes.MOVE)
      return true
    }
    this.lastNode = corner
    this.updateTarget()
    this.view.draw()
    return true
  }

  /** Whether typed length input can commit a wall segment. */
  public canCommitDrawLength(): boolean {
    return this.mode === floorplannerModes.DRAW && this.lastNode != null
  }

  public setUnderlay(config: UnderlayConfig | null): void {
    this.view.setUnderlay(config)
  }

  public getUnderlay(): UnderlayConfig | null {
    return this.view.getUnderlay()
  }

  public setUnderlayOpacity(opacity: number): void {
    this.view.setUnderlayOpacity(opacity)
  }

  public updateUnderlay(partial: Partial<UnderlayConfig>): void {
    this.view.updateUnderlay(partial)
  }

  public setAreaLabels(labels: AreaLabel[]): void {
    this.view.setAreaLabels(labels)
  }

  public setShowWallNumbers(show: boolean): void {
    this.view.setShowWallNumbers(show)
  }
}
