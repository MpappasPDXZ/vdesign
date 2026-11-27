/** Axis-aligned hole / finish rect in plan cm (center + size). */
export interface AreaRectCm {
  x: number
  z: number
  width: number
  depth: number
}

/** Text label for a named zone on the 2D plan (cm world coords). */
export interface AreaLabel {
  name: string
  xCm: number
  yCm: number
  /** Optional schedule / design notes (shown in UI tooltips, PDF, etc.). */
  notes?: string
  /**
   * Hide floor in this zone (open-to-below voids).
   * Default / omit / 0 / false = floor visible. Only true / 1 hides it.
   * If the label shares a wall-cycle with normal rooms (e.g. loft), set `rectCm`
   * so only that rectangle is cut out — otherwise the whole room slab is removed
   * only when every area in the cycle is invisible.
   */
  area_floor_invisible?: boolean | 0 | 1
  /** Optional plan rect for void holes when mixed with floored rooms. */
  rectCm?: AreaRectCm
}
