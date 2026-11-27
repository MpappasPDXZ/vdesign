import { Utils } from '../core/utils'
import type { AreaLabel } from '../floorplanner/area_label'
import type { Room } from '../model/room'

function inRect(x: number, z: number, area: AreaLabel): boolean {
  const r = area.rectCm
  if (!r || !(r.width > 0) || !(r.depth > 0)) return false
  const hw = r.width / 2
  const hd = r.depth / 2
  return x >= r.x - hw && x <= r.x + hw && z >= r.z - hd && z <= r.z + hd
}

function dist2(x: number, z: number, area: AreaLabel): number {
  const dx = x - area.xCm
  const dz = z - area.yCm
  return dx * dx + dz * dz
}

/**
 * Resolve which named area owns plan point (x, z).
 * Prefers rectCm hits, then room cycle + nearest label in that room.
 */
export function areaNameAt(
  x: number,
  z: number,
  areas: AreaLabel[],
  rooms: Room[]
): string | null {
  if (!areas.length) return null

  for (const area of areas) {
    if (inRect(x, z, area)) return area.name
  }

  const room = rooms.find((r) =>
    Utils.pointInPolygon(x, z, r.interiorCorners)
  )
  if (!room) {
    // Outside closed rooms — nearest label within 4m
    let best: AreaLabel | null = null
    let bestD = 400 * 400
    for (const area of areas) {
      if (!Number.isFinite(area.xCm) || !Number.isFinite(area.yCm)) continue
      const d = dist2(x, z, area)
      if (d < bestD) {
        bestD = d
        best = area
      }
    }
    return best?.name ?? null
  }

  const inRoom = areas.filter(
    (a) =>
      Number.isFinite(a.xCm) &&
      Number.isFinite(a.yCm) &&
      Utils.pointInPolygon(a.xCm, a.yCm, room.interiorCorners)
  )
  if (inRoom.length === 0) return null
  if (inRoom.length === 1) return inRoom[0].name

  let best = inRoom[0]
  let bestD = dist2(x, z, best)
  for (let i = 1; i < inRoom.length; i++) {
    const d = dist2(x, z, inRoom[i])
    if (d < bestD) {
      bestD = d
      best = inRoom[i]
    }
  }
  return best.name
}

/** True when every area label inside this room is currently hidden. */
export function roomFullyHidden(
  room: Room,
  areas: AreaLabel[],
  hidden: Set<string>
): boolean {
  if (!hidden.size) return false
  const inRoom = areas.filter(
    (a) =>
      Number.isFinite(a.xCm) &&
      Number.isFinite(a.yCm) &&
      Utils.pointInPolygon(a.xCm, a.yCm, room.interiorCorners)
  )
  if (inRoom.length === 0) return false
  return inRoom.every((a) => hidden.has(a.name))
}
