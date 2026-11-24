import * as THREE from 'three'
import type { Room } from '../model/room'

const SHINGLE_URL = '/models/textures/shingle-rustic-black.png'

export class Floor {
  public readonly room: Room
  private readonly scene: THREE.Scene
  private readonly renderer: THREE.WebGLRenderer
  private floorPlane: THREE.Mesh | null = null
  private roofGroup: THREE.Group | null = null
  private static shingleTexture: THREE.Texture | null = null

  constructor(scene: THREE.Scene, room: Room, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.room = room
    this.renderer = renderer
    this.init()
  }

  private init(): void {
    this.room.fireOnFloorChange(this.redraw.bind(this))
    this.floorPlane = this.buildFloor()
    this.roofGroup = this.buildRoof()
  }

  private redraw(): void {
    this.removeFromScene()
    this.floorPlane = this.buildFloor()
    this.roofGroup = this.buildRoof()
    this.addToScene()
  }

  /**
   * Elevated decks (fence rails with baseHeight) use explicit floor/cover items.
   * A room mesh at y≈0 under the posts reads as a bogus black “mid floor.”
   */
  private isElevatedDeckRoom(): boolean {
    return this.roomWallStats().baseMax > 50
  }

  private buildFloor(): THREE.Mesh | null {
    if (this.isElevatedDeckRoom()) return null
    const textureSettings = this.room.getTexture()
    // setup texture
    const textureLoader = new THREE.TextureLoader()
    const floorTexture = textureLoader.load(textureSettings.url)
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping
    floorTexture.repeat.set(1, 1)
    floorTexture.colorSpace = THREE.SRGBColorSpace
    // Apply anisotropic filtering for sharper textures at angles
    floorTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    floorTexture.minFilter = THREE.LinearMipmapLinearFilter
    floorTexture.magFilter = THREE.LinearFilter
    const floorMaterialTop = new THREE.MeshPhongMaterial({
      map: floorTexture,
      // ShapeGeometry normals stay +Z; after rotation.x=+π/2 that is world −Y, so
      // BackSide is the upward face the camera sees. (FrontSide = invisible floors.)
      side: THREE.BackSide,
      color: 0xffffff,
      specular: 0x111111,
      shininess: 3,
      // Mild bias over wall feet only — keep weaker than floorFinish overlays
      // (factor -4) so gym rubber / tile are not buried under room turf meshes.
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })

    const textureScale = textureSettings.scale
    // http://stackoverflow.com/questions/19182298/how-to-texture-a-three-js-mesh-created-with-shapegeometry
    // scale down coords to fit 0 -> 1, then rescale

    const points: THREE.Vector2[] = []
    this.room.interiorCorners.forEach((corner) => {
      points.push(new THREE.Vector2(corner.x / textureScale, corner.y / textureScale))
    })
    const shape = new THREE.Shape(points)

    const geometry = new THREE.ShapeGeometry(shape)
    const floor = new THREE.Mesh(geometry, floorMaterialTop)

    // ShapeGeometry is in XY; +PI/2 puts +Z local → world up. FrontSide then faces upward.
    floor.rotation.set(Math.PI / 2, 0, 0)
    // Hair above y=0 so wall base fillers (sunk) and thin carpet bottoms don't share a plane
    floor.position.y = 0.05
    floor.scale.set(textureScale, textureScale, textureScale)
    floor.receiveShadow = true
    floor.castShadow = false
    floor.renderOrder = 1
    return floor
  }

  private ensureShingle(): THREE.Texture {
    if (Floor.shingleTexture) return Floor.shingleTexture
    const loader = new THREE.TextureLoader()
    Floor.shingleTexture = loader.load(SHINGLE_URL, () => {
      ;(this.scene as any).needsUpdate = true
    })
    Floor.shingleTexture.colorSpace = THREE.SRGBColorSpace
    Floor.shingleTexture.wrapS = THREE.RepeatWrapping
    Floor.shingleTexture.wrapT = THREE.RepeatWrapping
    Floor.shingleTexture.repeat.set(4, 4)
    Floor.shingleTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    return Floor.shingleTexture
  }

  private roomWallStats(): {
    max: number
    avg: number
    tallFrac: number
    fenceFrac: number
    /** Max wall.baseHeight — elevated deck rails sit above grade */
    baseMax: number
  } {
    const walls = new Set<ReturnType<Room['corners'][number]['getWalls']>[number]>()
    for (const c of this.room.corners) {
      for (const w of c.getWalls()) walls.add(w)
    }
    if (walls.size === 0) {
      return { max: 250, avg: 250, tallFrac: 0, fenceFrac: 0, baseMax: 0 }
    }
    let max = 0
    let sum = 0
    let tall = 0
    let fence = 0
    let baseMax = 0
    for (const w of walls) {
      const h = w.height || 0
      max = Math.max(max, h)
      sum += h
      baseMax = Math.max(baseMax, w.baseHeight || 0)
      if (w.wallType === 'fence') fence++
      if (h >= 400 && w.wallType !== 'fence') tall++
    }
    const n = walls.size
    return { max, avg: sum / n, tallFrac: tall / n, fenceFrac: fence / n, baseMax }
  }

  private roomBBox(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const c of this.room.interiorCorners) {
      minX = Math.min(minX, c.x)
      maxX = Math.max(maxX, c.x)
      minZ = Math.min(minZ, c.y)
      maxZ = Math.max(maxZ, c.y)
    }
    return { minX, maxX, minZ, maxZ }
  }

  /**
   * Simple pitched/gable roof for tall house rooms; flat canopy for deck-height rooms.
   * Skips tiny leftover polys (< 4′ on a side) and yard loops.
   */
  private buildRoof(): THREE.Group | null {
    const bbox = this.roomBBox()
    const width = bbox.maxX - bbox.minX
    const depth = bbox.maxZ - bbox.minZ
    if (!Number.isFinite(width) || width < 80 || depth < 80) return null

    const area = width * depth
    const stats = this.roomWallStats()
    const floorUrl = this.room.getTexture()?.url || ''
    const outdoorFloor = /turf|grass|field/i.test(floorUrl)
    // Yard loop (fences + house) must never get a roof
    if (outdoorFloor || (stats.fenceFrac > 0.25 && area > 1_200_000)) return null

    const group = new THREE.Group()
    const shingle = this.ensureShingle()
    const mat = new THREE.MeshLambertMaterial({
      map: shingle,
      color: 0xffffff,
      side: THREE.DoubleSide,
      emissive: 0x111111,
      emissiveIntensity: 0.15
    })

    // Deck / low rooms: flat canopy (shared house wall can be tall — use fenceFrac).
    // Elevated decks (Omarail on posts) already have an explicit cover item — do NOT
    // invent a black slab at 42″ that floats under the real deck floor.
    if (stats.fenceFrac >= 0.35 && area < 900_000) {
      if (stats.baseMax > 50) return null
      const railH = 106.68 // 42″ Omarail stand-in
      const y = railH + 12
      const geo = new THREE.BoxGeometry(width + 20, 6, depth + 20)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set((bbox.minX + bbox.maxX) / 2, y, (bbox.minZ + bbox.maxZ) / 2)
      group.add(mesh)
      return group
    }

    // House mass only when most walls are tall (and not a fence-heavy deck pocket)
    if (stats.tallFrac < 0.55 || stats.avg < 500 || stats.fenceFrac >= 0.35) return null

    const wallH = stats.max
    // House mass: side-gabled roof along the longer plan axis + 6/12-ish rise
    const cx = (bbox.minX + bbox.maxX) / 2
    const cz = (bbox.minZ + bbox.maxZ) / 2
    const eaveY = wallH
    // 6/12 ≈ rise/run 0.5; use half-depth as run stand-in
    const rise = Math.min(280, Math.max(160, Math.min(width, depth) * 0.28))
    const ridgeY = eaveY + rise
    const overhang = 30

    const alongX = width >= depth
    const halfAlong = (alongX ? width : depth) / 2 + overhang
    const halfAcross = (alongX ? depth : width) / 2 + overhang

    const meshFromTris = (positions: number[]) => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geo.computeVertexNormals()
      const uvs: number[] = []
      for (let i = 0; i < positions.length / 3; i++) uvs.push((i % 3) * 0.5, i % 2)
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
      return new THREE.Mesh(geo, mat)
    }

    // Two roof planes meeting at ridge
    const makeSlope = (acrossSign: number) => {
      const positions: number[] = []
      const push = (x: number, y: number, z: number) => positions.push(x, y, z)
      if (alongX) {
        push(cx - halfAlong, ridgeY, cz)
        push(cx + halfAlong, ridgeY, cz)
        push(cx + halfAlong, eaveY, cz + acrossSign * halfAcross)
        push(cx - halfAlong, ridgeY, cz)
        push(cx + halfAlong, eaveY, cz + acrossSign * halfAcross)
        push(cx - halfAlong, eaveY, cz + acrossSign * halfAcross)
      } else {
        push(cx, ridgeY, cz - halfAlong)
        push(cx, ridgeY, cz + halfAlong)
        push(cx + acrossSign * halfAcross, eaveY, cz + halfAlong)
        push(cx, ridgeY, cz - halfAlong)
        push(cx + acrossSign * halfAcross, eaveY, cz + halfAlong)
        push(cx + acrossSign * halfAcross, eaveY, cz - halfAlong)
      }
      return meshFromTris(positions)
    }

    group.add(makeSlope(1))
    group.add(makeSlope(-1))

    // Prominent central cross-gable on the rear (yard / minZ) — elevation silhouette
    if (alongX && depth > 150) {
      const gableW = Math.min(width * 0.35, 420)
      const gableD = Math.min(depth * 0.55 + 40, halfAcross + 60)
      const gableRise = rise * 1.05
      const gx0 = cx - gableW / 2
      const gx1 = cx + gableW / 2
      const gzFace = bbox.minZ - overhang - 15
      const peakY = eaveY + gableRise
      group.add(
        meshFromTris([
          // left slope
          cx, peakY, gzFace,
          gx0, eaveY, gzFace,
          gx0, eaveY, gzFace + gableD,
          cx, peakY, gzFace,
          gx0, eaveY, gzFace + gableD,
          cx, eaveY + gableRise * 0.25, gzFace + gableD,
          // right slope
          cx, peakY, gzFace,
          gx1, eaveY, gzFace,
          gx1, eaveY, gzFace + gableD,
          cx, peakY, gzFace,
          gx1, eaveY, gzFace + gableD,
          cx, eaveY + gableRise * 0.25, gzFace + gableD
        ])
      )
      // Gable end wall fill (light) so the peak reads in rear view
      const gableEnd = new THREE.Mesh(
        new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.Float32BufferAttribute(
            [gx0, eaveY, gzFace, gx1, eaveY, gzFace, cx, peakY, gzFace],
            3
          )
        ),
        new THREE.MeshLambertMaterial({
          color: 0xe8e4dc,
          side: THREE.DoubleSide,
          emissive: 0xffffff,
          emissiveIntensity: 0.08
        })
      )
      ;(gableEnd.geometry as THREE.BufferGeometry).computeVertexNormals()
      group.add(gableEnd)
    }

    // Lower east wing roof (garage/utility mass on elevation far-right)
    if (alongX && width > 600) {
      const wingW = Math.min(width * 0.22, 280)
      const wingX0 = bbox.maxX - wingW
      const wingX1 = bbox.maxX + overhang * 0.5
      const wingCz = cz + halfAcross * 0.15
      const wingEave = eaveY - Math.min(180, wallH * 0.2)
      const wingRise = rise * 0.55
      const wingRidge = wingEave + wingRise
      const wingAcross = halfAcross * 0.7
      group.add(
        meshFromTris([
          wingX0, wingRidge, wingCz,
          wingX1, wingRidge, wingCz,
          wingX1, wingEave, wingCz + wingAcross,
          wingX0, wingRidge, wingCz,
          wingX1, wingEave, wingCz + wingAcross,
          wingX0, wingEave, wingCz + wingAcross,
          wingX0, wingRidge, wingCz,
          wingX1, wingRidge, wingCz,
          wingX1, wingEave, wingCz - wingAcross,
          wingX0, wingRidge, wingCz,
          wingX1, wingEave, wingCz - wingAcross,
          wingX0, wingEave, wingCz - wingAcross
        ])
      )
    }

    return group
  }

  public addToScene(): void {
    if (this.floorPlane) {
      this.scene.add(this.floorPlane)
    }
    if (this.roofGroup) {
      this.scene.add(this.roofGroup)
    }
    // hack so we can do intersect testing
    this.scene.add(this.room.floorPlane)
  }

  public removeFromScene(): void {
    if (this.floorPlane) {
      this.scene.remove(this.floorPlane)
    }
    if (this.roofGroup) {
      this.scene.remove(this.roofGroup)
      this.roofGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
      })
      this.roofGroup = null
    }
    this.scene.remove(this.room.floorPlane)
  }
}
