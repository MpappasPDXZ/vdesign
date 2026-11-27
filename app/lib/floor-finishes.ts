import * as THREE from 'three'
import { Utils } from '@blueprint3d/core/utils'
import type { Blueprint3d } from '@blueprint3d/blueprint3d'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { FloorFinishSpec } from '@/types/project'

const OVERLAY_GROUP = '__floorFinishOverlays'

/** Drop any rectCm floor-finish meshes (e.g. backyard sod) from the shared 3D scene. */
export function clearFloorFinishOverlays(blueprint3d: Blueprint3d | null | undefined): void {
  const three = blueprint3d?.three as
    | { scene?: { getScene?: () => THREE.Scene } }
    | undefined
  const scene = three?.scene?.getScene?.()
  if (!scene) return
  const group = scene.getObjectByName(OVERLAY_GROUP) as THREE.Group | undefined
  if (!group) return
  scene.remove(group)
  group.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) {
      m.geometry?.dispose()
      const mat = m.material
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else mat?.dispose()
    }
  })
}

function areaFloorInvisible(area: AreaLabel): boolean {
  return area.area_floor_invisible === true || area.area_floor_invisible === 1
}

/**
 * CW rectangle hole in plan cm from centered rectCm (x/z center, width/depth).
 * Inset slightly so the hole stays strictly inside the room contour (shared
 * edges with exterior walls make triangulateShape keep fill).
 */
function rectCmToHole(rect: {
  x: number
  z: number
  width: number
  depth: number
}): { x: number; y: number }[] {
  const inset = 4 // cm
  const hx = Math.max(8, rect.width / 2 - inset)
  const hz = Math.max(8, rect.depth / 2 - inset)
  return [
    { x: rect.x - hx, y: rect.z - hz },
    { x: rect.x - hx, y: rect.z + hz },
    { x: rect.x + hx, y: rect.z + hz },
    { x: rect.x + hx, y: rect.z - hz }
  ]
}

/**
 * Apply `area_floor_invisible`:
 * - Room with only invisible areas → hide entire slab (pure void pocket)
 * - Room mixed with loft/etc. → keep slab, cut `rectCm` holes for voids
 * - Default → floor visible
 */
export function applyAreaFloorVisibility(
  blueprint3d: Blueprint3d,
  areas: AreaLabel[] | undefined
): number {
  const rooms = blueprint3d.model.floorplan.getRooms()
  if (!rooms.length) return 0

  let n = 0
  for (const room of rooms) {
    const inRoom = (areas || []).filter(
      (a) =>
        Number.isFinite(a.xCm) &&
        Number.isFinite(a.yCm) &&
        Utils.pointInPolygon(a.xCm, a.yCm, room.interiorCorners)
    )
    const invisible = inRoom.filter(areaFloorInvisible)
    const visible = inRoom.filter((a) => !areaFloorInvisible(a))

    const pureVoid = invisible.length > 0 && visible.length === 0
    const holes =
      !pureVoid && invisible.length > 0
        ? invisible
            .filter((a) => a.rectCm && a.rectCm.width > 0 && a.rectCm.depth > 0)
            .map((a) => rectCmToHole(a.rectCm!))
        : []

    if (room.openBelow !== pureVoid) n += 1
    room.setOpenBelow(pureVoid)
    room.setFloorHoles(holes)
    if (holes.length) n += 1
  }
  return n
}

/**
 * Apply project floorFinishes:
 * 1. Room texture — when the area label sits inside a closed wall cycle
 * 2. Explicit rectCm overlay — for open bays (gym/recovery open to hall) that never form a room
 * 3. `area_floor_invisible` — hide slab for open-to-below / stair voids
 *
 * Room detection (`findRooms`) only returns smallest closed cycles. An opening without a
 * door/wall means no gym room → rubber never applied. Overlays fix that without fake doors.
 *
 * Always clears prior overlays first so backyard sod cannot linger after a level switch.
 */
export function applyFloorFinishes(
  blueprint3d: Blueprint3d,
  finishes: FloorFinishSpec[] | undefined,
  areas: AreaLabel[] | undefined
): number {
  const three = blueprint3d.three as
    | { scene?: { getScene?: () => THREE.Scene }; renderer?: THREE.WebGLRenderer }
    | undefined
  const scene = three?.scene?.getScene?.()

  // Always wipe previous level's overlays (even when finishes is empty).
  if (scene) clearFloorFinishOverlays(blueprint3d)

  const rooms = blueprint3d.model.floorplan.getRooms()
  let applied = applyAreaFloorVisibility(blueprint3d, areas)

  if (!finishes?.length) return applied

  // --- closed rooms (existing path) — skip invisible open-below rooms ---
  // Finishes with rectCm are sub-region overlays only (bath inside a mega-room,
  // furnace pocket, etc.). Applying them via setTexture paints the whole closed
  // cycle and overwrites loft/bedroom carpet — so skip room texture when rectCm
  // is present; syncFinishOverlays handles those.
  if (areas?.length && rooms.length) {
    for (const finish of finishes) {
      const area = areas.find((a) => a.name.toLowerCase() === finish.area.toLowerCase())
      if (!area || !Number.isFinite(area.xCm) || !Number.isFinite(area.yCm)) continue
      if (areaFloorInvisible(area)) continue
      const rect = finish.rectCm
      if (rect && rect.width > 0 && rect.depth > 0) continue

      const room = rooms.find((r) =>
        Utils.pointInPolygon(area.xCm, area.yCm, r.interiorCorners)
      )
      if (!room || room.openBelow) continue

      room.setTexture(
        finish.url,
        false,
        finish.scale > 0 ? finish.scale : 120,
        finish.rotationDeg
      )
      applied += 1
    }
  }

  // --- open-bay overlays (rectCm) ---
  if (scene) {
    applied += syncFinishOverlays(scene, finishes, three?.renderer)
  }

  return applied
}

function syncFinishOverlays(
  scene: THREE.Scene,
  finishes: FloorFinishSpec[],
  renderer?: THREE.WebGLRenderer
): number {
  let group = scene.getObjectByName(OVERLAY_GROUP) as THREE.Group | undefined
  if (group) {
    scene.remove(group)
    group.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.geometry?.dispose()
        const mat = m.material
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
      }
    })
  }

  group = new THREE.Group()
  group.name = OVERLAY_GROUP

  let n = 0
  const loader = new THREE.TextureLoader()
  // Overlapping rect patches (shower/bath inside a bedroom-sized rect) must be
  // deterministic: LARGER rects first, SMALLER last so the specific patch wins.
  // Rank nudges renderOrder + Y so coplanar quads don't depend on array order.
  const rectFinishes = finishes
    .filter((f) => f.rectCm && f.rectCm.width > 0 && f.rectCm.depth > 0)
    .map((f, idx) => ({ f, idx }))
    .sort((a, b) => {
      const aa = a.f.rectCm!.width * a.f.rectCm!.depth
      const bb = b.f.rectCm!.width * b.f.rectCm!.depth
      return bb - aa || a.idx - b.idx
    })
  const rankCount = Math.max(1, rectFinishes.length)
  for (let rank = 0; rank < rectFinishes.length; rank++) {
    const finish = rectFinishes[rank].f
    const r = finish.rectCm!

    const tex = loader.load(finish.url)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    const scale = finish.scale > 0 ? finish.scale : 120
    tex.repeat.set(r.width / scale, r.depth / scale)
    if (finish.rotationDeg != null && Number.isFinite(finish.rotationDeg) && finish.rotationDeg !== 0) {
      tex.center.set(0.5, 0.5)
      tex.rotation = (finish.rotationDeg * Math.PI) / 180
    }
    if (renderer) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    }
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter

    const geom = new THREE.PlaneGeometry(r.width, r.depth)
    // Stronger polygonOffset than room floors (factor -1) so rubber/tile win
    // over turf room meshes when orbiting — room floors were eating overlays.
    const isMat = /mat|clay|plate/i.test(finish.area)
    const isTurf = /turf|sod|grass/i.test(finish.area) || /turf/i.test(finish.url || '')
    const mat = new THREE.MeshPhongMaterial({
      map: tex,
      side: THREE.DoubleSide,
      color: 0xffffff,
      specular: 0x111111,
      shininess: 3,
      polygonOffset: true,
      polygonOffsetFactor: isTurf ? -1 : -4,
      polygonOffsetUnits: isTurf ? -2 : -8
    })
    const mesh = new THREE.Mesh(geom, mat)
    // PlaneGeometry is XY; lay flat. Non-turf finishes sit above room floors +
    // turf overlays so gym rubber / tile / LVP are what you actually see.
    mesh.rotation.x = -Math.PI / 2
    // +rank*0.01 cm (<= ~0.2 cm total) keeps smaller patches above larger ones, below mats (0.55).
    const baseY = isMat ? 0.55 : isTurf ? 0.08 : 0.28
    mesh.position.set(r.x, isMat ? baseY : baseY + rank * 0.01, r.z)
    mesh.receiveShadow = true
    mesh.castShadow = false
    mesh.renderOrder = (isMat ? 5 : isTurf ? 2 : 4) + rank / (rankCount + 1)
    mesh.name = `floorFinish:${finish.area}`
    group.add(mesh)
    n += 1
  }

  if (n > 0) scene.add(group)
  return n
}
