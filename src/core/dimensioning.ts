import { Configuration, configDimUnit } from './configuration'

/** Dimensioning in Inch. */
export const dimInch: string = 'inch'

/** Dimensioning in Meter. */
export const dimMeter: string = 'm'

/** Dimensioning in Centi Meter. */
export const dimCentiMeter: string = 'cm'

/** Dimensioning in Milli Meter. */
export const dimMilliMeter: string = 'mm'

/** Dimensioning functions. */
export class Dimensioning {
  /** Converts cm to dimensioning string.
   * @param cm Centi meter value to be converted.
   * @returns String representation.
   */
  public static cmToMeasure(cm: number): string {
    switch (Configuration.getStringValue(configDimUnit)) {
      case dimInch: {
        // 2.54 cm/in is exact; avoid 0.3937 drift that can round to 12"
        const totalInches = Math.round(cm / 2.54)
        let feet = Math.floor(totalInches / 12)
        let inches = totalInches - feet * 12
        if (inches === 12) {
          feet += 1
          inches = 0
        }
        return feet + "'" + inches + '"'
      }
      case dimMilliMeter:
        return '' + Math.round(10 * cm) + ' mm'
      case dimCentiMeter:
        return '' + Math.round(10 * cm) / 10 + ' cm'
      case dimMeter:
      default:
        return '' + Math.round(10 * cm) / 1000 + ' m'
    }
  }

  /**
   * Parse a typed length into centimeters.
   * Accepts: 26', 26'4", 26'-4", 26 ft, 4", 800cm, 8m, 8000mm, bare numbers
   * (bare numbers use the active dim unit).
   */
  public static measureToCm(input: string): number | null {
    const raw = input.trim().toLowerCase().replace(/,/g, '')
    if (!raw) return null

    // Imperial: 26'-4 1/2", 26'4", 26', 4", 26 ft 4 in
    const imperial =
      /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*-?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/.exec(
        raw
      ) ||
      /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)$/.exec(raw) ||
      /^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/.exec(raw)

    if (imperial) {
      if (raw.includes("'") || raw.includes('ft') || raw.includes('feet')) {
        const feet = parseFloat(imperial[1])
        const inches = imperial[2] ? parseFloat(imperial[2]) : 0
        if (Number.isNaN(feet) || Number.isNaN(inches)) return null
        return (feet * 12 + inches) * 2.54
      }
      const inchesOnly = parseFloat(imperial[1])
      if (Number.isNaN(inchesOnly)) return null
      return inchesOnly * 2.54
    }

    // Metric with unit suffix
    const metric = /^(\d+(?:\.\d+)?)\s*(mm|cm|m)$/.exec(raw)
    if (metric) {
      const value = parseFloat(metric[1])
      if (Number.isNaN(value)) return null
      switch (metric[2]) {
        case 'mm':
          return value / 10
        case 'cm':
          return value
        case 'm':
          return value * 100
      }
    }

    // Bare number → interpret in active unit
    const bare = /^(\d+(?:\.\d+)?)$/.exec(raw)
    if (!bare) return null
    const value = parseFloat(bare[1])
    if (Number.isNaN(value)) return null

    switch (Configuration.getStringValue(configDimUnit)) {
      case dimInch:
        // Treat as feet when >= 1 and no quote, matching typed wall lengths like "26"
        return value * 30.48
      case dimMilliMeter:
        return value / 10
      case dimCentiMeter:
        return value
      case dimMeter:
      default:
        return value * 100
    }
  }
}
