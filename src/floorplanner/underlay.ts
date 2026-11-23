/** Blueprint image drawn under the 2D floorplan for verification. */
export interface UnderlayConfig {
  /** Public URL or absolute path to the image */
  url: string
  /** 0–1 */
  opacity: number
  /** World X of image left edge (cm) */
  xCm: number
  /** World Y of image top edge (cm) */
  yCm: number
  /** Image width in world units (cm) */
  widthCm: number
  /** Image height in world units (cm) */
  heightCm: number
}

export const defaultUnderlayOpacity = 0.4
