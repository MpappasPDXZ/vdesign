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
  /** Scene item this footprint draws (selection highlight / hit-test identity). */
  ref?: object
  /**
   * plant — green ink (landscaping OR movable), shown in 2D + blueprint
   * structure — fixed fixtures / built-ins, blue ink
   * framing — posts/columns/beams as plan symbols
   * furniture — legacy; prefer plant for movable pieces
   */
  kind?: 'plant' | 'structure' | 'furniture' | 'framing'
}
