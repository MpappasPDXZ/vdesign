import * as THREE from 'three'
import { Dimensioning } from '../core/dimensioning'
import type { Main } from './main'

/**
 * Two-click 3D measuring tape.
 * Click A → click B → straight line + length label on the finished edge.
 * Next click starts a new measurement.
 */
export class MeasureTool {
  private enabled = false
  private readonly three: Main
  private readonly group = new THREE.Group()
  private readonly raycaster = new THREE.Raycaster()
  private readonly ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private readonly tmp = new THREE.Vector3()

  private pointA: THREE.Vector3 | null = null
  private pointB: THREE.Vector3 | null = null

  private markerA: THREE.Mesh
  private markerB: THREE.Mesh
  private line: THREE.Line
  private previewLine: THREE.Line
  private labelSprite: THREE.Sprite
  private labelCanvas: HTMLCanvasElement
  private labelCtx: CanvasRenderingContext2D
  private labelTexture: THREE.CanvasTexture

  constructor(three: Main) {
    this.three = three
    this.group.name = 'measure-tool'
    this.group.visible = false

    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      depthTest: false,
      transparent: true,
      opacity: 0.95
    })
    const markerGeo = new THREE.SphereGeometry(4, 12, 10)
    this.markerA = new THREE.Mesh(markerGeo, markerMat.clone())
    this.markerB = new THREE.Mesh(markerGeo, markerMat.clone())
    this.markerA.visible = false
    this.markerB.visible = false
    this.markerA.renderOrder = 999
    this.markerB.renderOrder = 999

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      depthTest: false,
      transparent: true,
      opacity: 0.95
    })
    this.line = new THREE.Line(new THREE.BufferGeometry(), lineMat)
    this.line.visible = false
    this.line.renderOrder = 998

    const previewMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      depthTest: false,
      transparent: true,
      opacity: 0.55
    })
    this.previewLine = new THREE.Line(new THREE.BufferGeometry(), previewMat)
    this.previewLine.visible = false
    this.previewLine.renderOrder = 997

    this.labelCanvas = document.createElement('canvas')
    this.labelCanvas.width = 512
    this.labelCanvas.height = 128
    this.labelCtx = this.labelCanvas.getContext('2d')!
    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas)
    this.labelTexture.minFilter = THREE.LinearFilter
    this.labelTexture.magFilter = THREE.LinearFilter
    const labelMat = new THREE.SpriteMaterial({
      map: this.labelTexture,
      depthTest: false,
      transparent: true
    })
    this.labelSprite = new THREE.Sprite(labelMat)
    this.labelSprite.scale.set(160, 40, 1)
    this.labelSprite.visible = false
    this.labelSprite.renderOrder = 1000

    this.group.add(this.markerA, this.markerB, this.line, this.previewLine, this.labelSprite)
    this.three.getScene().getScene().add(this.group)
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(on: boolean): void {
    if (this.enabled === on) return
    this.enabled = on
    this.group.visible = on
    if (!on) {
      this.clear()
      this.three.setCursorStyle('auto')
    } else {
      this.three.setCursorStyle('crosshair')
    }
    this.three.needsUpdate()
  }

  public clear(): void {
    this.pointA = null
    this.pointB = null
    this.markerA.visible = false
    this.markerB.visible = false
    this.line.visible = false
    this.previewLine.visible = false
    this.labelSprite.visible = false
    this.three.needsUpdate()
  }

  /** Element-local pixel coords (same as Controller.mouse). Returns true if consumed. */
  public handleClick(mousePx: THREE.Vector2): boolean {
    if (!this.enabled) return false
    const hit = this.pick(mousePx)
    if (!hit) return true

    if (!this.pointA || this.pointB) {
      // Start (or restart) measurement
      this.pointA = hit.clone()
      this.pointB = null
      this.markerA.position.copy(this.pointA)
      this.markerA.visible = true
      this.markerB.visible = false
      this.line.visible = false
      this.previewLine.visible = false
      this.labelSprite.visible = false
    } else {
      // Finish edge
      this.pointB = hit.clone()
      this.markerB.position.copy(this.pointB)
      this.markerB.visible = true
      this.previewLine.visible = false
      this.setSegment(this.line, this.pointA, this.pointB)
      this.line.visible = true
      const len = this.pointA.distanceTo(this.pointB)
      this.placeLabel(this.pointA, this.pointB, Dimensioning.cmToMeasure(len))
    }
    this.three.needsUpdate()
    return true
  }

  /** Rubber-band while waiting for second click. */
  public handleMove(mousePx: THREE.Vector2): void {
    if (!this.enabled || !this.pointA || this.pointB) return
    const hit = this.pick(mousePx)
    if (!hit) return
    this.setSegment(this.previewLine, this.pointA, hit)
    this.previewLine.visible = true
    this.three.needsUpdate()
  }

  private toNdc(mousePx: THREE.Vector2): THREE.Vector2 {
    const w = Math.max(this.three.elementWidth, 1)
    const h = Math.max(this.three.elementHeight, 1)
    return new THREE.Vector2((mousePx.x / w) * 2 - 1, -(mousePx.y / h) * 2 + 1)
  }

  private pick(mousePx: THREE.Vector2): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.toNdc(mousePx), this.three.getCamera())
    const scene = this.three.getScene().getScene()
    const meshes: THREE.Object3D[] = []
    scene.traverse((obj) => {
      if (obj === this.group || this.isMeasureChild(obj)) return
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !obj.visible) return
      const mat = mesh.material
      if (mat == null) return
      if (Array.isArray(mat) && (mat.length === 0 || mat.some((m) => m == null))) return
      meshes.push(obj)
    })
    try {
      const hits = this.raycaster.intersectObjects(meshes, false)
      if (hits.length > 0) return hits[0].point.clone()
    } catch {
      // ignore bad materials
    }

    // Fallback: ground plane y=0
    const out = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(this.ground, out)) return out
    return null
  }

  private isMeasureChild(obj: THREE.Object3D): boolean {
    let p: THREE.Object3D | null = obj
    while (p) {
      if (p === this.group) return true
      p = p.parent
    }
    return false
  }

  private setSegment(line: THREE.Line, a: THREE.Vector3, b: THREE.Vector3): void {
    const positions = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z])
    line.geometry.dispose()
    line.geometry = new THREE.BufferGeometry()
    line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  }

  private placeLabel(a: THREE.Vector3, b: THREE.Vector3, text: string): void {
    const mid = this.tmp.copy(a).add(b).multiplyScalar(0.5)
    // Nudge toward camera so it sits in front of the edge
    const cam = this.three.getCamera().position
    const toward = cam.clone().sub(mid).normalize().multiplyScalar(12)
    this.labelSprite.position.copy(mid).add(toward)

    const ctx = this.labelCtx
    const cw = this.labelCanvas.width
    const ch = this.labelCanvas.height
    ctx.clearRect(0, 0, cw, ch)

    ctx.font = 'bold 64px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif'
    const tw = ctx.measureText(text).width
    const padX = 36
    const padY = 22
    const bw = Math.min(cw - 16, tw + padX * 2)
    const bh = Math.min(ch - 16, 64 + padY)
    const bx = (cw - bw) / 2
    const by = (ch - bh) / 2
    const r = 18

    // High-contrast pill (near-black + light border)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)'
    ctx.beginPath()
    ctx.moveTo(bx + r, by)
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r)
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r)
    ctx.arcTo(bx, by + bh, bx, by, r)
    ctx.arcTo(bx, by, bx + bw, by, r)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
    ctx.lineWidth = 4
    ctx.stroke()

    // White fill + dark stroke so digits stay sharp on any backdrop
    const tx = cw / 2
    const ty = ch / 2 + 2
    ctx.lineJoin = 'round'
    ctx.miterLimit = 2
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 8
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeText(text, tx, ty)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, tx, ty)
    this.labelTexture.needsUpdate = true

    // Grow with camera distance so tall/far measures stay readable
    const aspect = bw / Math.max(bh, 1)
    const dist = Math.max(cam.distanceTo(this.labelSprite.position), 80)
    const h = Math.min(220, Math.max(56, dist * 0.11))
    this.labelSprite.scale.set(h * aspect, h, 1)
    this.labelSprite.visible = true
  }
}
