'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dimensioning } from '@blueprint3d/core/dimensioning'
import type { InchMeasurementLineage } from '@/types/project'

export interface FeetInchesSumResult extends InchMeasurementLineage {}

interface FeetInchesSumCalculatorProps {
  onApply: (result: FeetInchesSumResult) => void
  applyLabel?: string
  className?: string
  /** Prefill from saved lineage for this field */
  initialLines?: string[]
}

/** Parse one line: 2'6", 2'-6", 2 ft 6 in, 30", 2.5', bare number = inches. */
export function parseDimLineToInches(raw: string): number | null {
  const text = raw.trim().toLowerCase().replace(/,/g, '')
  if (!text) return null

  // Bare number → inches (list items are usually inch totals or short stubs)
  const bare = /^(\d+(?:\.\d+)?)$/.exec(text)
  if (bare) {
    const n = parseFloat(bare[1])
    return Number.isNaN(n) ? null : Math.round(n * 1000) / 1000
  }

  // Inches only: 30" / 30 in
  const inchesOnly = /^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/.exec(text)
  if (inchesOnly) {
    const n = parseFloat(inchesOnly[1])
    return Number.isNaN(n) ? null : Math.round(n * 1000) / 1000
  }

  // Feet + optional inches: 2'6", 2'-6", 2 ft 6, 2.5'
  const ftIn =
    /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*-?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/.exec(
      text
    )
  if (ftIn) {
    const feet = parseFloat(ftIn[1])
    const inches = ftIn[2] ? parseFloat(ftIn[2]) : 0
    if (Number.isNaN(feet) || Number.isNaN(inches)) return null
    return Math.round((feet * 12 + inches) * 1000) / 1000
  }

  // Fallback through Dimensioning (cm/m/mm, etc.)
  const cm = Dimensioning.measureToCm(raw)
  if (cm != null && cm >= 0) return Math.round((cm / 2.54) * 1000) / 1000
  return null
}

function splitLines(text: string): string[] {
  return text
    .split(/\n|,|;/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function FeetInchesSumCalculator({
  onApply,
  applyLabel = 'Use sum',
  className,
  initialLines
}: FeetInchesSumCalculatorProps) {
  const [text, setText] = useState(() => (initialLines?.length ? initialLines.join('\n') : ''))

  useEffect(() => {
    if (initialLines?.length) setText(initialLines.join('\n'))
  }, [initialLines])

  const { totalInches, lines, error } = useMemo(() => {
    const parsed = splitLines(text)
    if (!parsed.length) {
      return { totalInches: 0, lines: [] as string[], error: null as string | null }
    }
    let sum = 0
    for (const line of parsed) {
      const inches = parseDimLineToInches(line)
      if (inches == null) {
        return { totalInches: 0, lines: parsed, error: `Can't parse: ${line}` }
      }
      sum += inches
    }
    return {
      totalInches: Math.round(sum * 1000) / 1000,
      lines: parsed,
      error: null
    }
  }, [text])

  return (
    <div className={cn('space-y-1.5', className)}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={"2'6\"\n2'5\"\n9\""}
        className="w-full resize-y rounded border border-input bg-background px-2 py-1.5 font-mono text-[11px] outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : lines.length > 0 ? (
            <>
              {lines.length} → <strong className="text-foreground">{totalInches}"</strong>
            </>
          ) : (
            'One dim per line'
          )}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-7 px-2.5 text-[10px]"
          disabled={!!error || !(totalInches > 0)}
          onClick={() => onApply({ lines, totalInches })}
        >
          {applyLabel}
        </Button>
      </div>
    </div>
  )
}

/** Compact display of saved lineage under an inch field. */
export function lineageLabel(lineage: InchMeasurementLineage | null | undefined): string | null {
  if (!lineage?.lines?.length) return null
  return lineage.lines.join(' + ')
}
