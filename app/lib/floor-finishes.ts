import * as THREE from 'three'
import { Utils } from '@blueprint3d/core/utils'
import type { Blueprint3d } from '@blueprint3d/blueprint3d'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { FloorFinishSpec } from '@/types/project'

const OVERLAY_GROUP = '__floorFinishOverlays'

/**
 * Apply project floorFinishes:
 * 1. Room texture — when the area label sits inside a closed wall cycle
 * 2. Explicit rectCm overlay — for open bays (gym/recovery open to hall) that never form a room
 *
 * Room detection (`findRooms`) only returns smallest closed cycles. An opening without a
 * door/wall means no gym room → rubber never applied. Overlays fix that without fake doors.
 */
export function applyFloorFinishes(
  blueprint3d: Blueprint3d,
  finishes: FloorFinishSpec[] | undefined,
  areas: AreaLabel[] | undefined
): number {
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
  const three = blueprint3d.three as
    | { scene?: { getScene?: () => THREE.Scene }; renderer?: THREE.WebGLRenderer }
    | undefined
  const scene = three?.scene?.getScene?.()
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
    const mat = new THREE.MeshPhongMaterial({
      map: tex,
      side: THREE.DoubleSide,
      color: 0xffffff,
      specular: 0x111111,
      shininess: 3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2
    })
    const mesh = new THREE.Mesh(geom, mat)
    // PlaneGeometry is XY; lay flat. Slightly above room floors / wall feet.
    // Mats/clay sit above base turf so they win z-order.
    const isMat = /mat|clay|plate/i.test(finish.area)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(r.x, isMat ? 0.35 : 0.12, r.z)
    mesh.receiveShadow = true
    mesh.castShadow = false
    mesh.renderOrder = isMat ? 3 : 2
    mesh.name = `floorFinish:${finish.area}`
    group.add(mesh)
    n += 1
  }

  if (n > 0) scene.add(group)
  return n
}
