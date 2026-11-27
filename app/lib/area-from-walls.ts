import type { AreaLabel, AreaRectCm } from '@blueprint3d/floorplanner/area_label'
import type { Wall } from '@blueprint3d/model/wall'

export interface WallBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Axis-aligned bounds of wall endpoints (plan cm). */
export function boundsFromWalls(walls: Wall[]): WallBounds | null {
  if (!walls.length) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const w of walls) {
    const xs = [w.getStartX(), w.getEndX()]
    const ys = [w.getStartY(), w.getEndY()]
    minX = Math.min(minX, ...xs)
    maxX = Math.max(maxX, ...xs)
    minY = Math.min(minY, ...ys)
    maxY = Math.max(maxY, ...ys)
  }
  if (!Number.isFinite(minX) || maxX - minX < 1 || maxY - minY < 1) return null
  return { minX, maxX, minY, maxY }
}

export function rectCmFromBounds(b: WallBounds): AreaRectCm {
  return {
    x: (b.minX + b.maxX) / 2,
    z: (b.minY + b.maxY) / 2,
    width: b.maxX - b.minX,
    depth: b.maxY - b.minY
  }
}

/**
 * True when the selected walls form one simple cycle (each corner degree 2,
 * walk returns to start using every wall once).
 */
export function wallsFormClosedLoop(walls: Wall[]): boolean {
  if (walls.length < 3) return false
  const byCorner = new Map<object, Wall[]>()
  const add = (corner: object, wall: Wall) => {
    const list = byCorner.get(corner) || []
    list.push(wall)
    byCorner.set(corner, list)
  }
  for (const w of walls) {
    add(w.getStart(), w)
    add(w.getEnd(), w)
  }
  for (const list of byCorner.values()) {
    if (list.length !== 2) return false
  }
  const start = walls[0]
  let prevCorner = start.getStart()
  let curr = start
  const seen = new Set<Wall>()
  for (let i = 0; i < walls.length; i++) {
    if (seen.has(curr)) return false
    seen.add(curr)
    const nextCorner = curr.getStart() === prevCorner ? curr.getEnd() : curr.getStart()
    const candidates = (byCorner.get(nextCorner) || []).filter((w) => w !== curr)
    if (candidates.length !== 1) return false
    prevCorner = nextCorner
    curr = candidates[0]
  }
  return curr === start && seen.size === walls.length
}

export function areaLabelFromWalls(
  walls: Wall[],
  name: string,
  floorVisible: boolean
): AreaLabel | null {
  const b = boundsFromWalls(walls)
  if (!b) return null
  const rectCm = rectCmFromBounds(b)
  const label: AreaLabel = {
    name: name.trim() || 'Area',
    xCm: rectCm.x,
    yCm: rectCm.z,
    rectCm
  }
  if (!floorVisible) label.area_floor_invisible = true
  return label
}

/** Upsert by name (case-insensitive). */
export function upsertArea(areas: AreaLabel[], next: AreaLabel): AreaLabel[] {
  const key = next.name.toLowerCase()
  const idx = areas.findIndex((a) => a.name.toLowerCase() === key)
  if (idx < 0) return [...areas, next]
  const copy = areas.slice()
  copy[idx] = { ...areas[idx], ...next }
  return copy
}
