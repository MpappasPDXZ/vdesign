'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dimensioning } from '@blueprint3d/core/dimensioning'

interface FeetInchesSumCalculatorProps {
  onApplyInches: (inches: number) => void
  applyLabel?: string
  className?: string
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

export function FeetInchesSumCalculator({
  onApplyInches,
  applyLabel = 'Use sum',
  className
}: FeetInchesSumCalculatorProps) {
  const [text, setText] = useState('')

  const { totalInches, lineCount, error } = useMemo(() => {
    const lines = text
      .split(/\n|,|;/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (!lines.length) return { totalInches: 0, lineCount: 0, error: null as string | null }
    let sum = 0
    for (const line of lines) {
      const inches = parseDimLineToInches(line)
      if (inches == null) {
        return { totalInches: 0, lineCount: lines.length, error: `Can't parse: ${line}` }
      }
      sum += inches
    }
    return { totalInches: Math.round(sum * 1000) / 1000, lineCount: lines.length, error: null }
  }, [text])

  return (
    <div className={cn('space-y-1 rounded border border-border/70 bg-muted/30 p-1.5', className)}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={"2'6\"\n2'5\"\n6\""}
        className="w-full resize-y rounded border border-input bg-background px-1.5 py-1 font-mono text-[11px] outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : lineCount > 0 ? (
            <>
              {lineCount} → <strong className="text-foreground">{totalInches}"</strong>
            </>
          ) : (
            'One dim per line'
          )}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-6 px-2 text-[10px]"
          disabled={!!error || !(totalInches > 0)}
          onClick={() => onApplyInches(totalInches)}
        >
          {applyLabel}
        </Button>
      </div>
    </div>
  )
}
