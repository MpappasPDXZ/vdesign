'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { InchMeasurementLineage } from '@/types/project'
import {
  FeetInchesSumCalculator,
  lineageLabel,
  type FeetInchesSumResult
} from './FeetInchesSumCalculator'

const fieldClass =
  'h-7 w-full rounded border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring'

/** L-shaped carpenter’s / framing square — opens ft+in sum. */
function CarpenterSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M2 2h4v8h8v4H2V2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  )
}

interface InchFieldWithCalcProps {
  label: string
  value: number
  onChange: (inches: number) => void
  lineage?: InchMeasurementLineage | null
  onLineage: (lineage: InchMeasurementLineage | null) => void
  min?: number
  onEnter?: () => void
  ariaLabel?: string
  /** Modal title, e.g. "Length — sum ft+in" */
  calcTitle: string
  useSumLabel: string
  /** Shown on hover of the dialog title */
  calcHint?: string
  className?: string
  inputClassName?: string
}

function roundIn(n: number): number {
  return Math.round(n * 1000) / 1000
}

/**
 * Inch number input with a carpenter’s-square control that opens a ft+in sum modal.
 * Applying the sum fills this field and stores lineage against it.
 */
export function InchFieldWithCalc({
  label,
  value,
  onChange,
  lineage,
  onLineage,
  min = 0,
  onEnter,
  ariaLabel,
  calcTitle,
  useSumLabel,
  calcHint,
  className,
  inputClassName
}: InchFieldWithCalcProps) {
  const [open, setOpen] = useState(false)
  const expr = lineageLabel(lineage)

  const applySum = (result: FeetInchesSumResult) => {
    onChange(result.totalInches)
    onLineage(result)
    setOpen(false)
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {label ? (
        <span className="text-[10px] text-muted-foreground">{label}</span>
      ) : null}
      <div className="flex items-center gap-0.5">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min={min}
          value={roundIn(value)}
          onChange={(e) => {
            const next = parseFloat(e.target.value) || 0
            onChange(next)
            if (lineage?.lines?.length && Math.abs(next - lineage.totalInches) > 1e-6) {
              onLineage(null)
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className={cn(fieldClass, 'flex-1', inputClassName)}
          aria-label={ariaLabel || label}
        />
        <span className="shrink-0 text-[10px] text-muted-foreground">in</span>
        <Button
          type="button"
          size="icon"
          variant={expr ? 'secondary' : 'ghost'}
          className={cn('h-7 w-7 shrink-0', expr && 'text-foreground')}
          title={expr ? `${calcTitle}\n${expr}` : calcTitle}
          aria-label={calcTitle}
          onClick={() => setOpen(true)}
        >
          <CarpenterSquareIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
      {expr ? (
        <p
          className="truncate text-[9px] leading-tight text-muted-foreground"
          title={expr}
        >
          {expr}
          {lineage ? ` = ${roundIn(lineage.totalInches)}"` : ''}
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm gap-3 p-4"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            {calcHint ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTitle className="cursor-help text-sm underline decoration-dotted decoration-muted-foreground/50 underline-offset-2">
                    {calcTitle}
                  </DialogTitle>
                </TooltipTrigger>
                <TooltipContent className="z-[90] max-w-[240px] text-[11px] leading-snug">
                  {calcHint}
                </TooltipContent>
              </Tooltip>
            ) : (
              <DialogTitle className="text-sm">{calcTitle}</DialogTitle>
            )}
          </DialogHeader>
          <FeetInchesSumCalculator
            initialLines={lineage?.lines}
            applyLabel={useSumLabel}
            onApply={applySum}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
