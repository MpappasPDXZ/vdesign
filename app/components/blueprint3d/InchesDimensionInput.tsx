'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface InchesDimensionInputProps {
  id: string
  label: string
  valueInches: number
  onChangeInches: (inches: number) => void
  totalLabel: string
  className?: string
}

function roundInches(n: number): number {
  return Math.round(n * 1000) / 1000
}

function splitFeetInches(totalInches: number): { feet: number; inches: number } {
  const safe = Math.max(0, totalInches)
  const feet = Math.floor(safe / 12)
  const inches = roundInches(safe - feet * 12)
  return { feet, inches }
}

/** Parse a total-inches field: bare number or values ending in " / in. */
export function parseTotalInches(raw: string): number | null {
  const text = raw.trim().toLowerCase().replace(/,/g, '')
  if (!text) return null
  const match = /^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?$/.exec(text)
  if (!match) return null
  const value = parseFloat(match[1])
  if (Number.isNaN(value) || value < 0) return null
  return value
}

export function cmToInches(cm: number): number {
  return roundInches(cm / 2.54)
}

export function inchesToCm(inches: number): number {
  return inches * 2.54
}

const fieldClass =
  'rounded border border-input bg-background px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-ring'

export function InchesDimensionInput({
  id,
  label,
  valueInches,
  onChangeInches,
  totalLabel,
  className
}: InchesDimensionInputProps) {
  const split = splitFeetInches(valueInches)
  const [totalText, setTotalText] = useState(String(roundInches(valueInches)))
  const [feetText, setFeetText] = useState(String(split.feet))
  const [inchesText, setInchesText] = useState(String(split.inches))

  useEffect(() => {
    const next = splitFeetInches(valueInches)
    setTotalText(String(roundInches(valueInches)))
    setFeetText(String(next.feet))
    setInchesText(String(next.inches))
  }, [valueInches])

  const commitTotal = (raw: string) => {
    const parsed = parseTotalInches(raw)
    if (parsed == null) return
    onChangeInches(roundInches(parsed))
  }

  const commitFeetInches = (feetRaw: string, inchesRaw: string) => {
    const feet = parseFloat(feetRaw)
    const inches = parseFloat(inchesRaw)
    if (Number.isNaN(feet) || Number.isNaN(inches) || feet < 0 || inches < 0) return
    onChangeInches(roundInches(feet * 12 + inches))
  }

  return (
    <div className={cn('grid grid-cols-[52px_1fr] items-center gap-x-2 gap-y-1', className)}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={totalText}
          onChange={(e) => setTotalText(e.target.value)}
          onBlur={() => commitTotal(totalText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTotal(totalText)
          }}
          className={cn(fieldClass, 'w-[4.25rem]')}
          aria-label={totalLabel}
          title={totalLabel}
        />
        <span className="text-[10px] text-muted-foreground">in</span>
        <span className="mx-0.5 text-[10px] text-muted-foreground/60">=</span>
        <input
          type="text"
          inputMode="numeric"
          value={feetText}
          onChange={(e) => setFeetText(e.target.value)}
          onBlur={() => commitFeetInches(feetText, inchesText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitFeetInches(feetText, inchesText)
          }}
          className={cn(fieldClass, 'w-9')}
          aria-label="Feet"
          title="Feet"
        />
        <span className="text-[10px] text-muted-foreground">ft</span>
        <input
          type="text"
          inputMode="decimal"
          value={inchesText}
          onChange={(e) => setInchesText(e.target.value)}
          onBlur={() => commitFeetInches(feetText, inchesText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitFeetInches(feetText, inchesText)
          }}
          className={cn(fieldClass, 'w-9')}
          aria-label="Inches"
          title="Inches"
        />
        <span className="text-[10px] text-muted-foreground">in</span>
      </div>
    </div>
  )
}
