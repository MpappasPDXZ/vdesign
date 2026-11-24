/** Floor-item footprint for 2D plan overlay (cm, Three.js XZ). */
export interface ItemFootprint {
  xCm: number
  zCm: number
  /** Local X extent (cm). */
  widthCm: number
  /** Local Z extent (cm). */
  depthCm: number
  /** Three.js Y rotation (radians). */
  rotationY: number
  label: string
}
