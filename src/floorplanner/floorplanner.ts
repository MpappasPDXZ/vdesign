import { Floorplan } from '../model/floorplan'
import { Wall } from '../model/wall'
import { Corner } from '../model/corner'
import { FloorplannerView, floorplannerModes } from './floorplanner_view'
import type { UnderlayConfig } from './underlay'
import type { AreaLabel } from './area_label'
import type { ItemFootprint } from './item_footprint'
import type { SetbackSpec } from './setback'
import { EventEmitter } from '../core/events'
import type { Item } from '../items/item'

/** Edit-mode plan click target: wall-hosted entrance badge or a floor item footprint. */
export interface PlanHit {
  kind: 'entrance' | 'item'
  item: Item
}

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

  /** Fired when a wall-hosted entrance (E/S badge) is clicked in Edit (MOVE) mode, or `null` to close. */
  public entranceSelectedCallbacks = new EventEmitter<Item | null>()

  /** Fired when a floor item footprint (furniture/fixture) is clicked in Edit (MOVE) mode, or `null`. */
  public planItemSelectedCallbacks = new EventEmitter<Item | null>()

  /** Entrance badge highlighted on the plan (drawn by the view). */
  public selectedEntrance: Item | null = null

  /** Floor item highlighted on the plan (drawn by the view). */
  public selectedPlanItem: Item | null = null

  /** Hit-test supplied by Blueprint3d (scene items live outside the floorplan model). */
  private planHitTester:
    | ((xCm: number, zCm: number, badgeRadiusCm: number) => PlanHit | null)
    | null = null

  /** Wire entrance/furniture hit-testing (Edit mode single click). */
  public setPlanHitTester(
    tester: ((xCm: number, zCm: number, badgeRadiusCm: number) => PlanHit | null) | null
  ): void {
    this.planHitTester = tester
  }

  /** Clear entrance + furniture plan selection (no events if already clear). */
  public clearPlanSelection(fire = true): void {
    const hadEntrance = this.selectedEntrance != null
    const hadItem = this.selectedPlanItem != null
    this.selectedEntrance = null
    this.selectedPlanItem = null
    if (fire && hadEntrance) this.entranceSelectedCallbacks.fire(null)
    if (fire && hadItem) this.planItemSelectedCallbacks.fire(null)
    if (hadEntrance || hadItem) this.view.draw()
  }

  /**
   * Connect host while Wall Editor is open — drawn orange so the join
   * target is obvious next to the blue selected wall.
   */
  public connectHostWall: Wall | null = null

  /** Walls selected while forming an area (floor visible toggle). */
  public areaFormWalls: Wall[] = []

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
    this.canvasElement.addEventListener(
      'wheel',
      (event: WheelEvent) => {
        this.onWheel(event)
      },
      { passive: false }
    )

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.keyCode == 27) {
        this.escapeKey()
      }
    })

    floorplan.roomLoadedCallbacks.add(() => {
      this.reset()
    })
  }

  /**
   * Wall # badge radius in screen px — grows with zoom so labels stay readable
   * when zoomed in. Hit-test should use the same value (+ small pad).
   * Scaled to 65% of the original (35% smaller) so close zoom doesn't dominate.
   */
  public wallNumberBadgeRadiusPx(): number {
    const t = Math.min(2.4, Math.max(1, this.pixelsPerCm / 0.5))
    return 13 * t * 0.65
  }

  /** Pinch/scroll zoom toward the cursor (dims LOD updates on redraw). */
  private onWheel(event: WheelEvent): void {
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    this.zoomBy(factor, event.clientX, event.clientY)
  }

  /**
   * Zoom plan view. Optional client coords keep that screen point fixed
   * (wheel); otherwise zooms about the canvas center (toolbar buttons).
   */
  public zoomBy(factor: number, clientX?: number, clientY?: number): void {
    const rect = this.canvasElement.getBoundingClientRect()
    if (rect.width < 10 || rect.height < 10) return
    const sx = clientX != null ? clientX - rect.left : rect.width / 2
    const sy = clientY != null ? clientY - rect.top : rect.height / 2
    const worldX = (sx + this.originX) * this.cmPerPixel
    const worldY = (sy + this.originY) * this.cmPerPixel

    const next = Math.max(0.04, Math.min(this.pixelsPerCm * factor, 12))
    if (Math.abs(next - this.pixelsPerCm) < 1e-6) return
    this.pixelsPerCm = next
    this.cmPerPixel = 1.0 / this.pixelsPerCm
    this.wallWidth = 10.0 * this.pixelsPerCm

    this.originX = worldX / this.cmPerPixel - sx
    this.originY = worldY / this.cmPerPixel - sy
    this.view.draw()
  }

  public zoomIn(step = 1.08): void {
    this.zoomBy(step)
  }

  public zoomOut(step = 1.08): void {
    this.zoomBy(1 / step)
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
      // MOVE: # badge hit-test (avoids parallel-wall miss-hits).
      // DELETE: body hit so delete works with numbers off.
      // Short walls (<12"): midpoint sits inside the corner hit radius — if
      // corner wins, Delete calls removeAll() and MOVE can't open the editor.
      // Prefer badge/wall over corner whenever the cursor is on a wall target.
      // Match drawn badge (grows with zoom; 2-digit labels widen the ring a bit)
      const badgeRadiusCm = (this.wallNumberBadgeRadiusPx() * 1.25 + 2) * this.cmPerPixel
      const hoverWallBadge = this.floorplan.overlappedWallBadge(
        this.mouseX,
        this.mouseY,
        badgeRadiusCm
      )
      const hoverWallBody = this.floorplan.overlappedWall(this.mouseX, this.mouseY)
      const hoverCornerRaw = this.floorplan.overlappedCorner(this.mouseX, this.mouseY)

      let hoverWall: Wall | null = null
      let hoverCorner: Corner | null = null

      if (this.mode == floorplannerModes.MOVE) {
        if (hoverWallBadge) {
          hoverWall = hoverWallBadge
        } else if (hoverWallBody && hoverWallBody.getLength() < 12 * 2.54) {
          // Short wall: body hit beats tip corner (badge midpoint is inside corner radius)
          hoverWall = hoverWallBody
        } else {
          hoverCorner = hoverCornerRaw
        }
      } else {
        // DELETE: one wall, not corner.removeAll(), when aiming at a wall
        hoverWall = hoverWallBadge || hoverWallBody
        if (!hoverWall) hoverCorner = hoverCornerRaw
      }

      let draw = false
      if (hoverCorner != this.activeCorner) {
        this.activeCorner = hoverCorner
        draw = true
      }
      if (hoverWall != this.activeWall) {
        this.activeWall = hoverWall
        draw = true
      }
      // Keep corner/wall mutually exclusive for downstream handlers
      if (this.activeWall) this.activeCorner = null
      else if (this.activeCorner) this.activeWall = null
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

    // drawing — reuse an existing tip when the click is on it so we don't
    // newCorner+merge and accidentally split a long neighbor wall instead.
    if (this.mode == floorplannerModes.DRAW && canvasClick) {
      const existing = this.floorplan.overlappedCorner(
        this.targetX,
        this.targetY,
        snapTolerance
      )
      const corner = existing ?? this.floorplan.newCorner(this.targetX, this.targetY)
      if (this.lastNode != null && this.lastNode !== corner) {
        this.floorplan.newWall(this.lastNode, corner)
      }
      if (!existing && corner.mergeWithIntersected() && this.lastNode != null) {
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
        // Wall # badge wins over entrance/furniture; selections are mutually exclusive.
        this.clearPlanSelection()
        this.selectedWall = wall
        this.wallSelectedCallbacks.fire(wall)
        this.view.draw()
      } else if (!this.activeCorner) {
        const badgeRadiusCm = (9 + 3) * this.cmPerPixel
        const hit = this.planHitTester
          ? this.planHitTester(this.mouseX, this.mouseY, badgeRadiusCm)
          : null
        if (hit) {
          if (this.selectedWall) {
            this.selectedWall = null
            this.wallSelectedCallbacks.fire(null)
          }
          if (hit.kind === 'entrance') {
            if (this.selectedPlanItem) {
              this.selectedPlanItem = null
              this.planItemSelectedCallbacks.fire(null)
            }
            this.selectedEntrance = hit.item
            this.entranceSelectedCallbacks.fire(hit.item)
          } else {
            if (this.selectedEntrance) {
              this.selectedEntrance = null
              this.entranceSelectedCallbacks.fire(null)
            }
            this.selectedPlanItem = hit.item
            this.planItemSelectedCallbacks.fire(hit.item)
          }
          this.view.draw()
        } else {
          this.clearPlanSelection()
          if (this.selectedWall) {
            this.selectedWall = null
            this.wallSelectedCallbacks.fire(null)
            this.view.draw()
          }
        }
      }
    }
  }

  public selectWall(wall: Wall | null): void {
    if (wall) this.clearPlanSelection()
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

  /** Highlight walls chosen for Areas & floor (teal). */
  public setAreaFormWalls(walls: Wall[]): void {
    this.areaFormWalls = walls.slice()
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

  /**
   * Fit the full drawing in the canvas: scale so bounds fit with margin,
   * then pan so the plan centroid is centered.
   */
  public resetOrigin(): void {
    const canvasW = this.canvasElement.clientWidth
    const canvasH = this.canvasElement.clientHeight
    if (canvasW < 10 || canvasH < 10) return

    const size = this.floorplan.getSize()
    const center = this.floorplan.getCenter()
    const spanX = Math.max(size.x, 100)
    const spanZ = Math.max(size.z, 100)
    // ~15% margin so the whole drawing is visible (zoomed out, not clipped)
    const pad = 0.85
    const fitPpc = Math.min((canvasW * pad) / spanX, (canvasH * pad) / spanZ)
    this.pixelsPerCm = Math.max(0.05, Math.min(fitPpc, 2))
    this.cmPerPixel = 1.0 / this.pixelsPerCm
    this.wallWidth = 10.0 * this.pixelsPerCm

    this.originX = center.x * this.pixelsPerCm - canvasW / 2
    this.originY = center.z * this.pixelsPerCm - canvasH / 2
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

  /** Municipal setbacks for blueprint dashed lines (null → defaults when fences exist). */
  public setSetbacks(specs: SetbackSpec[] | null): void {
    this.view.setSetbacks(specs)
  }

  public setShowWallNumbers(show: boolean): void {
    this.view.setShowWallNumbers(show)
  }

  /** Show/hide green landscaping + movable footprints. */
  public setShowLandscapingMovable(show: boolean): void {
    this.view.setShowLandscapingMovable(show)
  }

  public getShowLandscapingMovable(): boolean {
    return this.view.getShowLandscapingMovable()
  }

  /** Printable blueprint presentation on the 2D canvas. */
  public setBlueprintMode(enabled: boolean): void {
    this.view.setBlueprintMode(enabled)
  }

  public getBlueprintMode(): boolean {
    return this.view.getBlueprintMode()
  }

  /** Bake 5′/10′ scale into canvas (screenshots / PDF). Live Blueprint uses React overlay. */
  public setPaintScaleBarOnCanvas(enabled: boolean): void {
    this.view.setPaintScaleBarOnCanvas(enabled)
  }

  /**
   * Snapshot the 2D plan as a PNG data URL for PDF/print.
   * Temporarily uses printable blueprint theme + fit-to-plan, then restores view.
   */
  public capturePlanPng(options?: { blueprint?: boolean }): string {
    const useBlueprint = options?.blueprint !== false
    const wasBlueprint = this.view.getBlueprintMode()
    const saved = {
      originX: this.originX,
      originY: this.originY,
      pixelsPerCm: this.pixelsPerCm,
      cmPerPixel: this.cmPerPixel,
      wallWidth: this.wallWidth
    }
    try {
      if (useBlueprint) this.view.setBlueprintMode(true)
      this.view.setPaintScaleBarOnCanvas(true)
      this.resetOrigin()
      this.view.draw()
      return this.canvasElement.toDataURL('image/png')
    } finally {
      this.originX = saved.originX
      this.originY = saved.originY
      this.pixelsPerCm = saved.pixelsPerCm
      this.cmPerPixel = saved.cmPerPixel
      this.wallWidth = saved.wallWidth
      this.view.setPaintScaleBarOnCanvas(false)
      if (useBlueprint) this.view.setBlueprintMode(wasBlueprint)
      this.view.draw()
    }
  }

  /** Live non-wall item footprints for the 2D overlay. */
  public setItemFootprintProvider(provider: (() => ItemFootprint[]) | null): void {
    this.view.setItemFootprintProvider(provider)
  }
}
