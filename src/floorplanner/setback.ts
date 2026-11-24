/** Municipal setback offset from a property edge (plan Y = south). */
export type SetbackEdge = 'north' | 'south' | 'east' | 'west'

export interface SetbackSpec {
  from: SetbackEdge
  /** Offset from that property edge, feet. */
  feet: number
  /** Label drawn on the dashed line (e.g. "5′ E setback"). */
  label?: string
}

/** Resolved axis-aligned setback segment in plan cm. */
export interface SetbackLine {
  x1Cm: number
  y1Cm: number
  x2Cm: number
  y2Cm: number
  label: string
}

export type PropertyBoundsCm = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Default lot setbacks: 5′ sides, 25′ from north neighbor (opposite house). */
export const DEFAULT_LOT_SETBACKS: SetbackSpec[] = [
  { from: 'west', feet: 5, label: '5′ W setback' },
  { from: 'east', feet: 5, label: '5′ E setback' },
  { from: 'north', feet: 25, label: '25′ N setback' }
]

const FT_TO_CM = 30.48

/** Turn edge offsets into dashed line segments spanning the property. */
export function resolveSetbackLines(
  bounds: PropertyBoundsCm,
  specs: SetbackSpec[]
): SetbackLine[] {
  const { minX, maxX, minY, maxY } = bounds
  if (!(maxX > minX) || !(maxY > minY)) return []

  const lines: SetbackLine[] = []
  for (const spec of specs) {
    const offset = spec.feet * FT_TO_CM
    if (!(offset > 0)) continue
    const label =
      spec.label ||
      `${spec.feet}′ ${spec.from.charAt(0).toUpperCase()}${spec.from.slice(1)} setback`

    switch (spec.from) {
      case 'west':
        lines.push({
          x1Cm: minX + offset,
          y1Cm: minY,
          x2Cm: minX + offset,
          y2Cm: maxY,
          label
        })
        break
      case 'east':
        lines.push({
          x1Cm: maxX - offset,
          y1Cm: minY,
          x2Cm: maxX - offset,
          y2Cm: maxY,
          label
        })
        break
      case 'north':
        lines.push({
          x1Cm: minX,
          y1Cm: minY + offset,
          x2Cm: maxX,
          y2Cm: minY + offset,
          label
        })
        break
      case 'south':
        lines.push({
          x1Cm: minX,
          y1Cm: maxY - offset,
          x2Cm: maxX,
          y2Cm: maxY - offset,
          label
        })
        break
    }
  }
  return lines
}
