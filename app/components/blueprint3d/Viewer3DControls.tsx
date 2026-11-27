'use client'

import { MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Viewer3DControlsProps {
  selectActive: boolean
  onSelectToggle: () => void
  className?: string
}

/**
 * Compact floating 3D toolbar — Select fixtures (off by default so orbit/pan win).
 */
export function Viewer3DControls({
  selectActive,
  onSelectToggle,
  className
}: Viewer3DControlsProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      <Button
        size="sm"
        variant={selectActive ? 'default' : 'ghost'}
        onClick={onSelectToggle}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title={
          selectActive
            ? 'Select on — click fixtures to move. Turn off to pan/orbit freely.'
            : 'Select off — pan and zoom freely. Turn on to click fixtures.'
        }
        aria-label="Select fixtures"
        aria-pressed={selectActive}
      >
        <MousePointer2 className="h-3.5 w-3.5" />
        Select
      </Button>
    </div>
  )
}
