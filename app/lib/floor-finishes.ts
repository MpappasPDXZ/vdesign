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

/**
 * Apply project floorFinishes:
 * 1. Room texture — when the area label sits inside a closed wall cycle
 * 2. Explicit rectCm overlay — for open bays (gym/recovery open to hall) that never form a room
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

  if (!finishes?.length) return 0

  const rooms = blueprint3d.model.floorplan.getRooms()
  let applied = 0

  // --- closed rooms (existing path) ---
  if (areas?.length && rooms.length) {
    for (const finish of finishes) {
      const area = areas.find((a) => a.name.toLowerCase() === finish.area.toLowerCase())
      if (!area || !Number.isFinite(area.xCm) || !Number.isFinite(area.yCm)) continue

      const room = rooms.find((r) =>
        Utils.pointInPolygon(area.xCm, area.yCm, r.interiorCorners)
      )
      if (!room) continue

      room.setTexture(finish.url, false, finish.scale > 0 ? finish.scale : 120)
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
  for (const finish of finishes) {
    const r = finish.rectCm
    if (!r || !(r.width > 0) || !(r.depth > 0)) continue

    const tex = loader.load(finish.url)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    const scale = finish.scale > 0 ? finish.scale : 120
    tex.repeat.set(r.width / scale, r.depth / scale)
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
    mesh.position.set(r.x, isMat ? 0.55 : isTurf ? 0.08 : 0.28, r.z)
    mesh.receiveShadow = true
    mesh.castShadow = false
    mesh.renderOrder = isMat ? 5 : isTurf ? 2 : 4
    mesh.name = `floorFinish:${finish.area}`
    group.add(mesh)
    n += 1
  }

  if (n > 0) scene.add(group)
  return n
}
