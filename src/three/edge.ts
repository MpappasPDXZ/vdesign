import * as THREE from 'three'
import { Utils } from '../core/utils'
import type { HalfEdge } from '../model/half_edge'
import type { Controls } from './controls'

/**
 * Three.js r152+ `ShapeGeometry` ignores `shape.holes` (always an 8-vert quad).
 * Build a flat XY mesh with `ShapeUtils.triangulateShape` so wall openings cut through.
 */
function shapeGeometryWithHoles(shape: THREE.Shape): THREE.BufferGeometry {
  const contour = shape.getPoints()
  const holes = shape.holes.map((h) => h.getPoints())
  const faces = THREE.ShapeUtils.triangulateShape(contour, holes)
  const verts = contour.concat(...holes)
  const positions: number[] = []
  for (const face of faces) {
    for (const idx of face) {
      const v = verts[idx]
      positions.push(v.x, v.y, 0)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

export class Edge {
  private readonly scene: THREE.Scene
  private readonly edge: HalfEdge
  private readonly controls: Controls
  private readonly renderer: THREE.WebGLRenderer
  private readonly wall
  private readonly front: boolean
  private planes: THREE.Mesh[] = []
  private basePlanes: THREE.Mesh[] = [] // always visible
  private texture: THREE.Texture | null = null
  private currentTextureUrl: string = ''
  private foundationTexture: THREE.Texture | null = null
  private readonly textureLoader = new THREE.TextureLoader()
  private readonly lightMap: THREE.Texture
  // Brightened colors for Three.js r181
  private readonly fillerColor = 0xffffff
  private readonly sideColor = 0xeeeeee
  private readonly baseColor = 0xffffff
  /** Walk-out foundation band height (9′) for tall exterior house walls */
  private static readonly FOUNDATION_H_CM = 274.32
  private static readonly FOUNDATION_TEX = '/models/textures/concrete-foundation.png'

  public visible = false

  // Store bound function references for proper callback removal
  private readonly boundRedraw: () => void
  private readonly boundUpdateVisibility: () => void

  constructor(scene: THREE.Scene, edge: HalfEdge, controls: Controls, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.edge = edge
    this.controls = controls
    this.renderer = renderer
    this.wall = edge.wall
    this.front = edge.front
    this.lightMap = this.textureLoader.load('https://cdn-images.lumenfeng.com/models-cover/walllightmap.png')
    this.lightMap.colorSpace = THREE.SRGBColorSpace

    // Bind functions once and store references
    this.boundRedraw = this.redraw.bind(this)
    this.boundUpdateVisibility = this.updateVisibility.bind(this)

    this.init()
  }

  public remove(): void {
    this.edge.redrawCallbacks.remove(this.boundRedraw)
    this.controls.cameraMovedCallbacks.remove(this.boundUpdateVisibility)
    this.removeFromScene()
  }

  private init(): void {
    this.edge.redrawCallbacks.add(this.boundRedraw)
    this.controls.cameraMovedCallbacks.add(this.boundUpdateVisibility)
    this.updateTexture()
    this.updatePlanes()
    this.addToScene()
  }

  private redraw(): void {
    this.removeFromScene()
    this.updateTexture()
    this.updatePlanes()
    this.addToScene()
  }

  private removeFromScene(): void {
    this.planes.forEach((plane) => {
      this.scene.remove(plane)
    })
    this.basePlanes.forEach((plane) => {
      this.scene.remove(plane)
    })
    this.planes = []
    this.basePlanes = []
  }

  private addToScene(): void {
    this.planes.forEach((plane) => {
      this.scene.add(plane)
    })
    this.basePlanes.forEach((plane) => {
      this.scene.add(plane)
    })
    this.updateVisibility()
  }

  private updateVisibility(): void {
    // finds the normal from the specified edge
    const start = this.edge.interiorStart()
    const end = this.edge.interiorEnd()
    const x = end.x - start.x
    const y = end.y - start.y
    // rotate 90 degrees CCW
    const normal = new THREE.Vector3(-y, 0, x)
    normal.normalize()

    // setup camera
    const position = this.controls.object.position.clone()
    const focus = new THREE.Vector3((start.x + end.x) / 2.0, 0, (start.y + end.y) / 2.0)
    const direction = position.sub(focus).normalize()

    // find dot
    const dot = normal.dot(direction)

    // update visible
    this.visible = dot >= 0

    // show or hide plans
    this.planes.forEach((plane) => {
      plane.visible = this.visible
    })

    this.updateObjectVisibility()
  }

  private updateObjectVisibility(): void {
    this.wall.items.forEach((item: any) => {
      item.updateEdgeVisibility(this.visible, this.front)
    })
    this.wall.onItems.forEach((item: any) => {
      item.updateEdgeVisibility(this.visible, this.front)
    })
  }

  private updateTexture(callback?: () => void): void {
    // callback is fired when texture loads
    const cb =
      callback ||
      (() => {
        ;(this.scene as any).needsUpdate = true
      })
    const textureData = this.edge.getTexture()
    const stretch = textureData.stretch
    const url = textureData.url
    const scale = textureData.scale

    // Only reload texture if URL has changed
    if (url !== this.currentTextureUrl) {
      this.currentTextureUrl = url
      const loader = new THREE.TextureLoader()
      this.texture = loader.load(url, cb)
      this.texture.colorSpace = THREE.SRGBColorSpace
      // Apply anisotropic filtering for sharper textures at angles
      this.texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
      this.texture.minFilter = THREE.LinearMipmapLinearFilter
      this.texture.magFilter = THREE.LinearFilter
    }

    // Always update texture parameters (stretch, scale, etc.)
    if (this.texture) {
      if (!stretch) {
        const height = this.wall.height
        const width = this.edge.interiorDistance()
        this.texture.wrapT = THREE.RepeatWrapping
        this.texture.wrapS = THREE.RepeatWrapping
        this.texture.repeat.set(width / scale, height / scale)
        this.texture.needsUpdate = true
      }
    }
  }

  private updatePlanes(): void {
    // Fence walls: open black-metal rails/pickets (once per wall, on front edge only)
    if (this.wall.wallType === 'fence') {
      if (this.front) {
        this.planes.push(...this.buildFenceMeshes())
      }
      return
    }

    // Switched to MeshLambertMaterial for proper lighting interaction
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      map: this.texture,
      // Lower emissive so lap / brick maps stay readable outdoors
      emissive: 0xffffff,
      emissiveIntensity: 0.12
    })

    const fillerMaterial = new THREE.MeshBasicMaterial({
      color: this.fillerColor,
      side: THREE.DoubleSide,
      toneMapped: false
    })

    const tallExterior =
      this.wall.exposure === 'exterior' &&
      this.wall.wallType !== 'fence' &&
      (this.wall.height || 0) >= Edge.FOUNDATION_H_CM * 1.5

    if (tallExterior) {
      this.ensureFoundationTexture()
      const foundationMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.FrontSide,
        map: this.foundationTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.1
      })
      const fh = Edge.FOUNDATION_H_CM
      // Yard-facing + room-facing: concrete band then siding (both faces textured)
      for (const side of [
        {
          start: this.edge.exteriorStart(),
          end: this.edge.exteriorEnd(),
          transform: this.edge.exteriorTransform,
          inv: this.edge.invExteriorTransform
        },
        {
          start: this.edge.interiorStart(),
          end: this.edge.interiorEnd(),
          transform: this.edge.interiorTransform,
          inv: this.edge.invInteriorTransform
        }
      ] as const) {
        this.planes.push(
          this.makeWall(side.start, side.end, side.transform, side.inv, foundationMaterial, 0, fh)
        )
        this.planes.push(
          this.makeWall(
            side.start,
            side.end,
            side.transform,
            side.inv,
            wallMaterial,
            fh,
            this.wall.height
          )
        )
      }
    } else {
      // Both faces get the wall texture (exterior was previously solid white)
      this.planes.push(
        this.makeWall(
          this.edge.exteriorStart(),
          this.edge.exteriorEnd(),
          this.edge.exteriorTransform,
          this.edge.invExteriorTransform,
          wallMaterial
        )
      )
      this.planes.push(
        this.makeWall(
          this.edge.interiorStart(),
          this.edge.interiorEnd(),
          this.edge.interiorTransform,
          this.edge.invInteriorTransform,
          wallMaterial
        )
      )
    }

    // bottom — sink below y=0 so white wall feet don't z-fight the floor
    // (coplanar basePlanes + room floors = "white breakthrough" when orbiting)
    this.basePlanes.push(this.buildFiller(this.edge, -0.35, THREE.BackSide, this.baseColor))

    // top
    this.planes.push(
      this.buildFiller(this.edge, this.wall.height, THREE.DoubleSide, this.fillerColor)
    )

    // sides
    this.planes.push(
      this.buildSideFillter(
        this.edge.interiorStart(),
        this.edge.exteriorStart(),
        this.wall.height,
        this.sideColor
      )
    )

    this.planes.push(
      this.buildSideFillter(
        this.edge.interiorEnd(),
        this.edge.exteriorEnd(),
        this.wall.height,
        this.sideColor
      )
    )
  }

  /**
   * Black metal fence along the wall centerline: end posts, rails, pickets.
   * Keeps room topology (still a Wall) but reads as open fencing in 3D.
   * `wall.baseHeight` lifts deck/landing rails onto the walking surface.
   */
  private buildFenceMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = []
    const railH = Math.max(30, this.wall.height || 182.88)
    const base = Math.max(0, this.wall.baseHeight || 0)
    const yBottom = base
    const yTop = base + railH
    const ax = this.wall.getStartX()
    const ay = this.wall.getStartY()
    const bx = this.wall.getEndX()
    const by = this.wall.getEndY()
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy)
    if (len < 1) return meshes

    const ux = dx / len
    const uy = dy / len
    const thickness = Math.max(2, Math.min(this.wall.thickness || 5.08, 8))
    const postW = Math.max(thickness * 1.4, 6)
    const railT = Math.max(thickness * 0.55, 2.5)
    const picketW = Math.max(thickness * 0.45, 2)
    const picketGap = 14 // open black-metal pickets

    // Gaps for doors/stairs so pickets don't block openings
    const gaps: Array<{ lo: number; hi: number }> = []
    this.wall.items.forEach((item: any) => {
      const pos = item.position
      if (!pos) return
      const along = (pos.x - ax) * ux + (pos.z - ay) * uy
      const halfW = Math.max(item.halfSize?.x || 20, 20)
      gaps.push({ lo: along - halfW, hi: along + halfW })
    })
    const inGap = (d: number) => gaps.some((g) => d >= g.lo && d <= g.hi)

    const metal = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.85,
      roughness: 0.35,
      emissive: 0x050505,
      emissiveIntensity: 0.05
    })

    const boxAt = (
      cx: number,
      cz: number,
      y0: number,
      y1: number,
      along: number,
      across: number
    ) => {
      const geo = new THREE.BoxGeometry(along, y1 - y0, across)
      const mesh = new THREE.Mesh(geo, metal)
      mesh.position.set(cx, (y0 + y1) / 2, cz)
      // Align box X with fence run (plan x/z = wall x/y)
      mesh.rotation.y = -Math.atan2(uy, ux)
      meshes.push(mesh)
    }

    // End posts (skip if an opening eats that end)
    if (!inGap(0)) boxAt(ax, ay, yBottom, yTop, postW, postW)
    if (!inGap(len)) boxAt(bx, by, yBottom, yTop, postW, postW)

    // Intermediate posts ~ every 8′
    const postSpacing = 243.84
    for (let d = postSpacing; d < len - postW; d += postSpacing) {
      if (inGap(d)) continue
      boxAt(ax + ux * d, ay + uy * d, yBottom, yTop, postW, postW)
    }

    // Top + bottom rails in segments that skip openings
    const railBottom = yBottom + railH * 0.1
    const railTop = yBottom + railH * 0.94
    const segPoints = [0, ...gaps.flatMap((g) => [g.lo, g.hi]), len].sort((a, b) => a - b)
    for (let i = 0; i < segPoints.length - 1; i += 2) {
      const a = Math.max(0, segPoints[i])
      const b = Math.min(len, segPoints[i + 1])
      if (b - a < postW) continue
      const mx = ax + ux * ((a + b) / 2)
      const mz = ay + uy * ((a + b) / 2)
      const segLen = b - a - postW * 0.5
      if (segLen < 2) continue
      boxAt(mx, mz, railBottom - railT / 2, railBottom + railT / 2, segLen, railT)
      boxAt(mx, mz, railTop - railT / 2, railTop + railT / 2, segLen, railT)
    }

    // Vertical pickets span between the two rails only
    const picketBottom = railBottom + railT * 0.5
    const picketTop = railTop - railT * 0.5
    for (let d = picketGap; d < len - picketGap / 2; d += picketGap) {
      if (d < postW || d > len - postW) continue
      if (Math.abs(d % postSpacing) < postW * 0.6) continue
      if (inGap(d)) continue
      boxAt(ax + ux * d, ay + uy * d, picketBottom, picketTop, picketW, picketW)
    }

    return meshes
  }

  private ensureFoundationTexture(): void {
    if (this.foundationTexture) return
    this.foundationTexture = this.textureLoader.load(Edge.FOUNDATION_TEX, () => {
      ;(this.scene as any).needsUpdate = true
    })
    this.foundationTexture.colorSpace = THREE.SRGBColorSpace
    this.foundationTexture.wrapS = THREE.RepeatWrapping
    this.foundationTexture.wrapT = THREE.RepeatWrapping
    this.foundationTexture.repeat.set(2, 1)
    this.foundationTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
  }

  // start, end have x and y attributes (i.e. corners)
  private makeWall(
    start: { x: number; y: number },
    end: { x: number; y: number },
    transform: THREE.Matrix4,
    invTransform: THREE.Matrix4,
    material: THREE.Material,
    bottomY = 0,
    topY?: number
  ): THREE.Mesh {
    const wallTop = topY ?? this.wall.height
    const v1 = this.toVec3(start, bottomY)
    const v2 = this.toVec3(end, bottomY)
    const v3 = this.toVec3(end, wallTop)
    const v4 = this.toVec3(start, wallTop)

    const points = [v1.clone(), v2.clone(), v3.clone(), v4.clone()]

    points.forEach((p) => {
      p.applyMatrix4(transform)
    })

    const shape = new THREE.Shape([
      new THREE.Vector2(points[0].x, points[0].y),
      new THREE.Vector2(points[1].x, points[1].y),
      new THREE.Vector2(points[2].x, points[2].y),
      new THREE.Vector2(points[3].x, points[3].y)
    ])

    // add holes for each wall item that intersects this vertical band
    this.wall.items.forEach((item: any) => {
      const pos = item.position.clone()
      const halfSize = item.halfSize
      const itemBottom = pos.y - halfSize.y
      const itemTop = pos.y + halfSize.y
      if (itemTop < bottomY + 1 || itemBottom > wallTop - 1) return

      pos.applyMatrix4(transform)
      const min = halfSize.clone().multiplyScalar(-1)
      const max = halfSize.clone()
      min.add(pos)
      max.add(pos)
      // Clip hole to this band in transformed Y
      const bandMinY = Math.min(points[0].y, points[1].y, points[2].y, points[3].y)
      const bandMaxY = Math.max(points[0].y, points[1].y, points[2].y, points[3].y)
      min.y = Math.max(min.y, bandMinY + 0.5)
      max.y = Math.min(max.y, bandMaxY - 0.5)
      if (max.y <= min.y + 1) return

      const holePoints = [
        new THREE.Vector2(min.x, min.y),
        new THREE.Vector2(max.x, min.y),
        new THREE.Vector2(max.x, max.y),
        new THREE.Vector2(min.x, max.y)
      ]

      shape.holes.push(new THREE.Path(holePoints))
    })

    // Three r152+ ShapeGeometry silently drops holes (always 8 verts). Triangulate ourselves.
    const geometry = shapeGeometryWithHoles(shape)

    // Transform vertices
    geometry.applyMatrix4(invTransform)

    // make UVs
    const totalDistance = Utils.distance(v1.x, v1.z, v2.x, v2.z)
    const bandHeight = Math.max(1, wallTop - bottomY)

    // Get position attribute
    const positionAttribute = geometry.getAttribute('position')
    const uvs: number[] = []

    // Calculate UVs based on vertex positions
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i)
      const y = positionAttribute.getY(i)
      const z = positionAttribute.getZ(i)

      const vertex = new THREE.Vector3(x, y, z)
      const u = Utils.distance(v1.x, v1.z, vertex.x, vertex.z) / totalDistance
      const v = (vertex.y - bottomY) / bandHeight

      uvs.push(u, v)
    }

    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))

    // Compute vertex normals for proper lighting
    geometry.computeVertexNormals()

    // Normalize all normals to ensure consistent shading
    const normalAttribute = geometry.getAttribute('normal')
    for (let i = 0; i < normalAttribute.count; i++) {
      const normal = new THREE.Vector3(
        normalAttribute.getX(i),
        normalAttribute.getY(i),
        normalAttribute.getZ(i)
      )
      normal.normalize()
      normalAttribute.setXYZ(i, normal.x, normal.y, normal.z)
    }
    normalAttribute.needsUpdate = true

    const mesh = new THREE.Mesh(geometry, material)

    return mesh
  }

  private buildSideFillter(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    height: number,
    color: number
  ): THREE.Mesh {
    const points = [
      this.toVec3(p1),
      this.toVec3(p2),
      this.toVec3(p2, height),
      this.toVec3(p1, height)
    ]

    const geometry = new THREE.BufferGeometry()

    const positions = new Float32Array([
      points[0].x,
      points[0].y,
      points[0].z,
      points[1].x,
      points[1].y,
      points[1].z,
      points[2].x,
      points[2].y,
      points[2].z,
      points[0].x,
      points[0].y,
      points[0].z,
      points[2].x,
      points[2].y,
      points[2].z,
      points[3].x,
      points[3].y,
      points[3].z
    ])

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.computeVertexNormals()

    const fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      toneMapped: false
    })

    const filler = new THREE.Mesh(geometry, fillerMaterial)
    return filler
  }

  private buildFiller(edge: HalfEdge, height: number, side: THREE.Side, color: number): THREE.Mesh {
    const points = [
      this.toVec2(edge.exteriorStart()),
      this.toVec2(edge.exteriorEnd()),
      this.toVec2(edge.interiorEnd()),
      this.toVec2(edge.interiorStart())
    ]

    const fillerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: side,
      toneMapped: false
    })

    const shape = new THREE.Shape(points)
    const geometry = new THREE.ShapeGeometry(shape)

    const filler = new THREE.Mesh(geometry, fillerMaterial)
    filler.rotation.set(Math.PI / 2, 0, 0)
    filler.position.y = height
    return filler
  }

  private toVec2(pos: { x: number; y: number }): THREE.Vector2 {
    return new THREE.Vector2(pos.x, pos.y)
  }

  private toVec3(pos: { x: number; y: number }, height?: number): THREE.Vector3 {
    const h = height ?? 0
    return new THREE.Vector3(pos.x, h, pos.y)
  }
}
