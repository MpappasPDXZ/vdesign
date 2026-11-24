'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface BlueprintScaleBarProps {
  /** Current plan zoom: canvas pixels per centimeter. */
  getPixelsPerCm: () => number | undefined
  className?: string
}

const FT_TO_CM = 30.48
const BAR_FT = 10

/**
 * Floating graphic scale for Blueprint mode — always 5′ / 10′.
 * Sits SE, same bottom inset as FloorplannerControls (Edit / Draw / Delete / Done).
 */
export function BlueprintScaleBar({ getPixelsPerCm, className }: BlueprintScaleBarProps) {
  const [ppc, setPpc] = useState(0.5)

  useEffect(() => {
    const sync = () => {
      const next = getPixelsPerCm()
      if (typeof next === 'number' && Number.isFinite(next) && next > 0) {
        setPpc((prev) => (Math.abs(prev - next) < 1e-6 ? prev : next))
      }
    }
    sync()
    const id = window.setInterval(sync, 100)
    return () => window.clearInterval(id)
  }, [getPixelsPerCm])

  const barPx = Math.max(48, BAR_FT * FT_TO_CM * ppc)
  const halfPx = barPx / 2

  return (
    <div
      className={cn(
        'pointer-events-none flex flex-col gap-1 rounded-lg border border-border bg-background/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm',
        className
      )}
      aria-label="Scale: 5 feet and 10 feet"
    >
      <div className="flex items-end" style={{ width: barPx }}>
        <div className="relative h-2 w-full overflow-hidden rounded-sm border border-foreground/80">
          <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: halfPx }} />
          <div
            className="absolute inset-y-0 bg-background"
            style={{ left: halfPx, width: halfPx }}
          />
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/80" />
        </div>
      </div>
      <div
        className="relative h-3 text-[10px] font-medium leading-none text-foreground"
        style={{ width: barPx }}
      >
        <span className="absolute left-0 -translate-x-0">0′</span>
        <span className="absolute left-1/2 -translate-x-1/2">5′</span>
        <span className="absolute right-0 translate-x-0">10′</span>
      </div>
    </div>
  )
}
