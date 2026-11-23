import { Configuration, configWallThickness, configWallHeight } from '../core/configuration'
import { Utils } from '../core/utils'
import { EventEmitter } from '../core/events'
import type { Item } from '../items/item'
import type { Corner } from './corner'
import type { HalfEdge } from './half_edge'

/** The default wall texture. */
const defaultWallTexture = {
  url: 'https://cdn-images.lumenfeng.com/models-cover/wallmap.png',
  stretch: true,
  scale: 0
}

export type WallType = 'generic' | 'concrete' | 'wood' | 'steel' | 'partition'
export type WallExposure = 'interior' | 'exterior'

/** Plan-view stroke color from material + exposure. */
export function wallDisplayColor(wallType: WallType, exposure: WallExposure): string {
  const key = `${wallType}:${exposure}` as const
  const colors: Record<string, string> = {
    'concrete:exterior': '#5c6570',
    'concrete:interior': '#9aa3ad',
    'wood:exterior': '#7a5230',
    'wood:interior': '#c4a574',
    'steel:exterior': '#3d4f5f',
    'steel:interior': '#7d8f9e',
    'partition:exterior': '#a89070',
    'partition:interior': '#d4c4a8',
    'generic:exterior': '#8b929a',
    'generic:interior': '#c5cad0'
  }
  return colors[key] || colors['generic:interior']
}

/**
 * A Wall is the basic element to create Rooms.
 *
 * Walls consists of two half edges.
 */
export class Wall {
  /** The unique id of each wall. */
  public id: string

  /** Front is the plane from start to end. */
  public frontEdge: HalfEdge | null = null

  /** Back is the plane from end to start. */
  public backEdge: HalfEdge | null = null

  /** */
  public orphan = false

  /** Items attached to this wall */
  public items: Item[] = []

  /** */
  public onItems: Item[] = []

  /** The front-side texture. */
  public frontTexture = defaultWallTexture

  /** The back-side texture. */
  public backTexture = defaultWallTexture

  /** Wall thickness. */
  public thickness = Configuration.getNumericValue(configWallThickness)

  /** Wall height. */
  public height = Configuration.getNumericValue(configWallHeight)

  /** Construction / material type */
  public wallType: WallType = 'generic'

  /** Interior vs exterior */
  public exposure: WallExposure = 'exterior'

  /** Display name, e.g. "basement #11 west, exterior wall" */
  public name = ''

  /** Actions to be applied after movement. */
  private moved_callbacks = new EventEmitter<void>()

  /** Actions to be applied on removal. */
  private deleted_callbacks = new EventEmitter<Wall>()

  /** Actions to be applied explicitly. */
  private action_callbacks = new EventEmitter<unknown>()

  /**
   * Constructs a new wall.
   * @param start Start corner.
   * @param end End corner.
   */
  constructor(private start: Corner, private end: Corner) {
    this.id = this.getUuid()

    this.start.attachStart(this)
    this.end.attachEnd(this)
  }

  private getUuid(): string {
    return [this.start.id, this.end.id].join()
  }

  public resetFrontBack() {
    this.frontEdge = null
    this.backEdge = null
    this.orphan = false
  }

  public snapToAxis(tolerance: number): void {
    // order here is important, but unfortunately arbitrary
    this.start.snapToAxis(tolerance)
    this.end.snapToAxis(tolerance)
  }

  public fireOnMove(func: () => void): void {
    this.moved_callbacks.add(func)
  }

  public fireOnDelete(func: (wall: Wall) => void): void {
    this.deleted_callbacks.add(func)
  }

  public dontFireOnDelete(func: (wall: Wall) => void): void {
    this.deleted_callbacks.remove(func)
  }

  public fireOnAction(func: (action: unknown) => void): void {
    this.action_callbacks.add(func)
  }

  public fireAction(action: unknown): void {
    this.action_callbacks.fire(action)
  }

  public relativeMove(dx: number, dy: number): void {
    // Skip mid-move corner merge so both ends translate by the same delta
    this.start.relativeMove(dx, dy, false)
    this.end.relativeMove(dx, dy, false)
    this.fireMoved()
  }

  /**
   * Translate this wall only. Shared corners stay put (new corners are
   * created for this wall), so disconnected neighbors are not dragged.
   */
  public relativeMoveIndependent(dx: number, dy: number): void {
    const fp = this.start.getFloorplan()
    const shiftCorner = (which: 'start' | 'end') => {
      const corner = which === 'start' ? this.start : this.end
      const nx = corner.x + dx
      const ny = corner.y + dy
      if (corner.wallCount() <= 1) {
        corner.move(nx, ny, false)
        return
      }
      const fresh = fp.newCorner(nx, ny)
      if (which === 'start') this.setStart(fresh)
      else this.setEnd(fresh)
    }
    shiftCorner('start')
    shiftCorner('end')
    this.fireMoved()
  }

  /** Northernmost end (then westernmost) — "top" of wall on plan. */
  public getTopPoint(): { x: number; y: number } {
    const sx = this.getStartX()
    const sy = this.getStartY()
    const ex = this.getEndX()
    const ey = this.getEndY()
    if (sy < ey - 1e-6) return { x: sx, y: sy }
    if (ey < sy - 1e-6) return { x: ex, y: ey }
    return sx <= ex ? { x: sx, y: sy } : { x: ex, y: ey }
  }

  /** Point along this wall, `inchesFromTop` from the top end toward the other end. */
  public pointFromTop(inchesFromTop: number): { x: number; y: number } {
    const top = this.getTopPoint()
    const sx = this.getStartX()
    const sy = this.getStartY()
    const ex = this.getEndX()
    const ey = this.getEndY()
    const bottom =
      Math.abs(top.x - sx) < 1e-6 && Math.abs(top.y - sy) < 1e-6
        ? { x: ex, y: ey }
        : { x: sx, y: sy }
    const len = this.getLength()
    if (len < 1e-6) return { ...top }
    const dist = Math.max(0, Math.min(len, inchesFromTop * 2.54))
    const t = dist / len
    return {
      x: top.x + (bottom.x - top.x) * t,
      y: top.y + (bottom.y - top.y) * t
    }
  }

  /**
   * Place this wall so its nearer end sits on `host` at `inchesFromTop`
   * from the host's top. Does not drag host corners (independent translate).
   */
  public placeAgainstWall(host: Wall, inchesFromTop: number): void {
    const P = host.pointFromTop(inchesFromTop)
    const dStart =
      (this.getStartX() - P.x) ** 2 + (this.getStartY() - P.y) ** 2
    const dEnd = (this.getEndX() - P.x) ** 2 + (this.getEndY() - P.y) ** 2
    const ax = dStart <= dEnd ? this.getStartX() : this.getEndX()
    const ay = dStart <= dEnd ? this.getStartY() : this.getEndY()
    this.relativeMoveIndependent(P.x - ax, P.y - ay)
  }

  public fireMoved(): void {
    this.moved_callbacks.fire()
  }

  public fireRedraw(): void {
    if (this.frontEdge) {
      this.frontEdge.redrawCallbacks.fire()
    }
    if (this.backEdge) {
      this.backEdge.redrawCallbacks.fire()
    }
  }

  public getStart(): Corner {
    return this.start
  }

  public getEnd(): Corner {
    return this.end
  }

  public getStartX(): number {
    return this.start.getX()
  }

  public getEndX(): number {
    return this.end.getX()
  }

  public getStartY(): number {
    return this.start.getY()
  }

  public getEndY(): number {
    return this.end.getY()
  }

  /** Centerline length in cm. */
  public getLength(): number {
    const dx = this.getEndX() - this.getStartX()
    const dy = this.getEndY() - this.getStartY()
    return Math.sqrt(dx * dx + dy * dy)
  }

  /** Plan-view color from type + exposure. */
  public getDisplayColor(): string {
    return wallDisplayColor(this.wallType, this.exposure)
  }

  /**
   * Set centerline length in cm, keeping the start corner fixed and
   * moving the end along the current wall direction.
   */
  public setLength(lengthCm: number): void {
    if (!(lengthCm > 0)) return
    const sx = this.getStartX()
    const sy = this.getStartY()
    let dx = this.getEndX() - sx
    let dy = this.getEndY() - sy
    let dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1e-6) {
      dx = 1
      dy = 0
      dist = 1
    }
    const scale = lengthCm / dist
    this.end.move(sx + dx * scale, sy + dy * scale)
    this.fireMoved()
  }

  public remove(): void {
    this.start.detachWall(this)
    this.end.detachWall(this)
    this.deleted_callbacks.fire(this)

    // Clear items arrays to ensure no stale references
    this.items = []
    this.onItems = []
  }

  public setStart(corner: Corner): void {
    this.start.detachWall(this)
    corner.attachStart(this)
    this.start = corner
    this.fireMoved()
  }

  public setEnd(corner: Corner): void {
    this.end.detachWall(this)
    corner.attachEnd(this)
    this.end = corner
    this.fireMoved()
  }

  public distanceFrom(x: number, y: number): number {
    return Utils.pointDistanceFromLine(
      x,
      y,
      this.getStartX(),
      this.getStartY(),
      this.getEndX(),
      this.getEndY()
    )
  }

  /** Return the corner opposite of the one provided.
   * @param corner The given corner.
   * @returns The opposite corner.
   */
  // @ts-ignore - oppositeCorner is declared but not used, keeping for future use
  private oppositeCorner(corner: Corner): Corner | undefined {
    if (this.start === corner) {
      return this.end
    } else if (this.end === corner) {
      return this.start
    } else {
      console.log('Wall does not connect to corner')
      return undefined
    }
  }
}
