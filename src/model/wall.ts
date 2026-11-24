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

export type WallType =
  | 'generic'
  | 'concrete'
  | 'wood'
  | 'steel'
  | 'partition'
  /** Black metal (or painted) fence — thin open rails/pickets in 3D */
  | 'fence'
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
    'generic:interior': '#c5cad0',
    // Black metal fence (same both exposures)
    'fence:exterior': '#1a1a1a',
    'fence:interior': '#2a2a2a'
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

  /**
   * Bottom of the wall mesh above grade (cm). Deck/landing rails use this so
   * fence pickets sit on the deck walking surface instead of at y=0.
   */
  public baseHeight = 0

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

  /** Walls that share a start or end corner with this wall. */
  public getAttachedWalls(): Wall[] {
    const set = new Set<Wall>()
    for (const c of [this.start, this.end]) {
      for (const w of c.getWalls()) if (w !== this) set.add(w)
    }
    return Array.from(set)
  }

  /**
   * Congruent companions: walls joined at a simple 2-wall corner (chain),
   * not at a 3+ junction (predecessor / host / perimeter stay put).
   * @param excludeEnd skip this end (the end landing on a host when placing)
   */
  public getCongruentCompanions(excludeEnd?: 'start' | 'end'): Wall[] {
    const out: Wall[] = []
    const ends: Array<'start' | 'end'> =
      excludeEnd === 'start' ? ['end'] : excludeEnd === 'end' ? ['start'] : ['start', 'end']
    for (const which of ends) {
      const corner = which === 'start' ? this.start : this.end
      // Exactly two walls = continuation of this segment; 3+ is a structural junction
      if (corner.wallCount() !== 2) continue
      for (const w of corner.getWalls()) {
        if (w !== this) out.push(w)
      }
    }
    return out
  }

  /**
   * Translate a wall group rigidly. Corners shared with walls outside the
   * group are split first so predecessors / host / perimeter are not dragged.
   */
  public moveWallGroup(group: Set<Wall>, dx: number, dy: number): void {
    if (!(Math.abs(dx) > 1e-9 || Math.abs(dy) > 1e-9)) return
    const fp = this.start.getFloorplan()
    for (const w of [...group]) {
      for (const which of ['start', 'end'] as const) {
        const corner = which === 'start' ? w.getStart() : w.getEnd()
        const hasOutsider = corner.getWalls().some((ow) => !group.has(ow))
        if (!hasOutsider) continue
        const fresh = fp.newCorner(corner.x, corner.y)
        for (const gw of [...corner.getWalls()]) {
          if (!group.has(gw)) continue
          if (gw.getStart() === corner) gw.setStart(fresh)
          else if (gw.getEnd() === corner) gw.setEnd(fresh)
        }
      }
    }
    const corners = new Set<ReturnType<Wall['getStart']>>()
    for (const w of group) {
      corners.add(w.getStart())
      corners.add(w.getEnd())
    }
    for (const c of corners) c.relativeMove(dx, dy, false)
    for (const w of group) w.fireMoved()
  }

  /**
   * Translate this wall. When `bringAttached`, also moves congruent companions
   * (simple chain neighbors like W3 with W2) — never junction neighbors (W1/W10).
   */
  public relativeMoveWithAttached(dx: number, dy: number, bringAttached: boolean): void {
    if (!bringAttached) {
      this.relativeMoveIndependent(dx, dy)
      return
    }
    const group = new Set<Wall>([this, ...this.getCongruentCompanions()])
    this.moveWallGroup(group, dx, dy)
  }

  /**
   * Dominant plan axis: east-west (faces N/S) or north-south (faces E/W).
   */
  public getAxis(): 'east-west' | 'north-south' {
    const dx = Math.abs(this.getEndX() - this.getStartX())
    const dy = Math.abs(this.getEndY() - this.getStartY())
    return dx >= dy ? 'east-west' : 'north-south'
  }

  /**
   * Snap wall to pure E–W or N–S, keeping center and length.
   * east-west → faces North & South; north-south → faces East & West.
   */
  public setAxis(axis: 'east-west' | 'north-south'): void {
    const len = this.getLength()
    if (!(len > 0)) return
    const cx = (this.getStartX() + this.getEndX()) / 2
    const cy = (this.getStartY() + this.getEndY()) / 2
    const half = len / 2
    let x0: number
    let y0: number
    let x1: number
    let y1: number
    if (axis === 'east-west') {
      // Prefer keeping western end as start
      x0 = cx - half
      y0 = cy
      x1 = cx + half
      y1 = cy
    } else {
      // Prefer northern end as start (top)
      x0 = cx
      y0 = cy - half
      x1 = cx
      y1 = cy + half
    }
    const fp = this.start.getFloorplan()
    const assign = (which: 'start' | 'end', x: number, y: number) => {
      const corner = which === 'start' ? this.start : this.end
      if (corner.wallCount() <= 1) {
        corner.move(x, y, false)
        return
      }
      const fresh = fp.newCorner(x, y)
      if (which === 'start') this.setStart(fresh)
      else this.setEnd(fresh)
    }
    assign('start', x0, y0)
    assign('end', x1, y1)
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

  /** Opposite of top — southernmost (then easternmost). */
  public getBottomPoint(): { x: number; y: number } {
    const top = this.getTopPoint()
    const sx = this.getStartX()
    const sy = this.getStartY()
    const ex = this.getEndX()
    const ey = this.getEndY()
    if (Math.abs(top.x - sx) < 1e-6 && Math.abs(top.y - sy) < 1e-6) {
      return { x: ex, y: ey }
    }
    return { x: sx, y: sy }
  }

  /**
   * Point along this wall measured from `fromEnd` toward the other end.
   * Use bottom + positive inches instead of negative from top.
   */
  public pointFromEnd(
    fromEnd: 'top' | 'bottom',
    inchesFromEnd: number
  ): { x: number; y: number } {
    const origin = fromEnd === 'top' ? this.getTopPoint() : this.getBottomPoint()
    const other = fromEnd === 'top' ? this.getBottomPoint() : this.getTopPoint()
    const len = this.getLength()
    if (len < 1e-6) return { ...origin }
    const dist = Math.max(0, Math.min(len, inchesFromEnd * 2.54))
    const t = dist / len
    return {
      x: origin.x + (other.x - origin.x) * t,
      y: origin.y + (other.y - origin.y) * t
    }
  }

  /** @deprecated Prefer pointFromEnd('top', inches) */
  public pointFromTop(inchesFromTop: number): { x: number; y: number } {
    return this.pointFromEnd('top', inchesFromTop)
  }

  /**
   * Lay this wall start→finish: start at (ax,ay), finish `len` toward `dir`.
   * If `attachStart` is set, start is joined to that corner (true topology).
   *
   * Free ends never drag neighbors: shared corners are split so Apply on wall N
   * cannot move wall N+1 / chain mates (papercut: host/neighbors sacred).
   */
  public setSpanFrom(
    ax: number,
    ay: number,
    dir: 'N' | 'E' | 'S' | 'W',
    bringAttached = false,
    attachStart: Corner | null = null,
    lengthCm?: number
  ): void {
    const len = lengthCm != null && lengthCm > 0 ? lengthCm : this.getLength()
    if (!(len > 0)) return
    let bx = ax
    let by = ay
    switch (dir) {
      case 'N':
        by = ay - len
        break
      case 'S':
        by = ay + len
        break
      case 'E':
        bx = ax + len
        break
      case 'W':
        bx = ax - len
        break
    }
    const oldMx = (this.getStartX() + this.getEndX()) / 2
    const oldMy = (this.getStartY() + this.getEndY()) / 2
    // Opt-in only: translate free-end chain neighbors as a group
    const companions = bringAttached ? this.getCongruentCompanions('start') : []
    const fp = this.start.getFloorplan()
    const nearly = (x0: number, y0: number, x1: number, y1: number) =>
      Math.abs(x0 - x1) < 1e-4 && Math.abs(y0 - y1) < 1e-4

    /** Move this wall’s tip only. If already at target, keep the corner (preserve host join).
     * If shared and must move, split — never drag neighbors (W12 Apply must not move W13). */
    const setCornerIndependent = (which: 'start' | 'end', x: number, y: number) => {
      const corner = which === 'start' ? this.start : this.end
      if (nearly(corner.x, corner.y, x, y)) return
      if (corner.wallCount() <= 1) {
        corner.move(x, y, false)
        return
      }
      const fresh = fp.newCorner(x, y)
      if (which === 'start') this.setStart(fresh)
      else this.setEnd(fresh)
    }

    if (attachStart) {
      // Never let start and end become the same corner (zero-length collapse).
      if (this.end === attachStart) {
        const freeEnd = fp.newCorner(bx, by)
        this.setEnd(freeEnd)
        if (this.start !== attachStart) this.setStart(attachStart)
      } else if (this.start !== attachStart) {
        this.setStart(attachStart)
        setCornerIndependent('end', bx, by)
      } else {
        // Already on host tip — only reposition free end (split if chained)
        setCornerIndependent('end', bx, by)
      }
    } else {
      setCornerIndependent('start', ax, ay)
      setCornerIndependent('end', bx, by)
    }

    if (companions.length) {
      const dx = (ax + bx) / 2 - oldMx
      const dy = (ay + by) / 2 - oldMy
      for (const w of companions) {
        if (w === this) continue
        w.relativeMoveIndependent(dx, dy)
      }
    }
    this.fireMoved()
  }

  /** Host corner at top or bottom tip, if any. */
  public cornerAtEnd(fromEnd: 'top' | 'bottom'): Corner {
    const tip = fromEnd === 'top' ? this.getTopPoint() : this.getBottomPoint()
    const sx = this.getStartX()
    const sy = this.getStartY()
    if (Math.abs(sx - tip.x) < 1e-4 && Math.abs(sy - tip.y) < 1e-4) return this.start
    return this.end
  }

  /**
   * Place this wall so its start joins `host` at `inchesFromEnd` from the
   * host's top/bottom (east/west or south tip), then runs start→finish in `extendDir`.
   * At 0" from an end, shares the host corner (real connection, not just overlapping).
   */
  public placeAgainstWall(
    host: Wall,
    inchesFromEnd: number,
    bringAttached = false,
    fromEnd: 'top' | 'bottom' = 'top',
    extendDir: 'N' | 'E' | 'S' | 'W' = 'E',
    lengthCm?: number
  ): void {
    const P = host.pointFromEnd(fromEnd, inchesFromEnd)
    const tip = fromEnd === 'top' ? host.getTopPoint() : host.getBottomPoint()
    const atTip =
      Math.abs(P.x - tip.x) < 1e-4 && Math.abs(P.y - tip.y) < 1e-4
    const attach = atTip ? host.cornerAtEnd(fromEnd) : null
    this.setSpanFrom(P.x, P.y, extendDir, bringAttached, attach, lengthCm)
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
   * Set centerline length in cm.
   * Prefer keeping a shared join fixed and moving the free tip — so editing a
   * stub (W3 on W2) never drags the host. When both ends are shared (or both
   * free), keep top/west fixed and grow toward bottom/east; companions on the
   * moving tip translate rigidly so they stay axis-aligned.
   */
  public setLength(lengthCm: number): void {
    if (!(lengthCm > 0)) return
    const top = this.getTopPoint()
    const bot = this.getBottomPoint()
    const startShared = this.start.wallCount() > 1
    const endShared = this.end.wallCount() > 1
    // One join + one free tip → pin the join (never drag the host).
    let fixed: Corner
    let movable: Corner
    let dirX: number
    let dirY: number
    if (startShared !== endShared) {
      fixed = startShared ? this.start : this.end
      movable = startShared ? this.end : this.start
      dirX = movable.x - fixed.x
      dirY = movable.y - fixed.y
    } else {
      const fixIsStart =
        Math.abs(this.getStartX() - top.x) < 1e-6 && Math.abs(this.getStartY() - top.y) < 1e-6
      fixed = fixIsStart ? this.start : this.end
      movable = fixIsStart ? this.end : this.start
      dirX = bot.x - top.x
      dirY = bot.y - top.y
    }

    let dist = Math.sqrt(dirX * dirX + dirY * dirY)
    if (dist < 1e-6) {
      if (this.getAxis() === 'north-south') {
        dirX = 0
        dirY = 1
      } else {
        dirX = 1
        dirY = 0
      }
      dist = 1
    }
    const ux = dirX / dist
    const uy = dirY / dist
    const nx = fixed.x + ux * lengthCm
    const ny = fixed.y + uy * lengthCm
    const mdx = nx - movable.x
    const mdy = ny - movable.y
    if (Math.abs(mdx) < 1e-9 && Math.abs(mdy) < 1e-9) return

    // Other walls on the moving tip — shift their free ends by the same delta
    const companions: Wall[] = []
    if (movable.wallCount() > 1) {
      for (const w of movable.getWalls()) {
        if (w !== this) companions.push(w)
      }
    }

    movable.move(nx, ny, false)
    for (const w of companions) {
      const other = w.getStart() === movable ? w.getEnd() : w.getStart()
      // Only auto-shift free tips (or simple chain). Avoid dragging a 3+ junction.
      if (other.wallCount() <= 2) {
        other.relativeMove(mdx, mdy, false)
      }
      w.fireMoved()
    }
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
