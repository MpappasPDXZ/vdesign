'use client'

import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'
import { Maximize, Minimize } from 'lucide-react'
import type { ViewMode } from '@/types/view-mode'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

const VIEW_OPTIONS: { mode: ViewMode; label: string; aria: string }[] = [
  { mode: '2d', label: '2D', aria: '2D View' },
  { mode: 'blueprint', label: 'Blueprint', aria: 'Blueprint View' },
  { mode: '3d', label: '3D', aria: '3D View' }
]

export function ViewToggle({
  viewMode,
  onViewChange,
  isFullscreen = false,
  onFullscreenToggle
}: ViewToggleProps) {
  const isMobile = useIsMobile()

  return (
    <div
      className={cn(
        'absolute flex bg-card border border-border shadow-lg',
        isMobile
          ? 'top-3 right-3 gap-0.5 rounded-lg'
          : 'top-5 right-5 gap-1 rounded overflow-hidden shadow-md'
      )}
    >
      {VIEW_OPTIONS.map(({ mode, label, aria }, index) => (
        <button
          key={mode}
          onClick={() => onViewChange(mode)}
          className={cn(
            'transition-all font-medium',
            isMobile
              ? 'min-w-[44px] min-h-[44px] px-2.5 py-2 text-sm'
              : 'px-3 py-1.5 text-sm',
            index === 0 && isMobile && 'rounded-l-lg',
            index === VIEW_OPTIONS.length - 1 &&
              !onFullscreenToggle &&
              isMobile &&
              'rounded-r-lg',
            viewMode === mode
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-foreground hover:bg-accent active:scale-95'
          )}
          aria-label={aria}
          aria-pressed={viewMode === mode}
        >
          {label}
        </button>
      ))}
      {onFullscreenToggle && (
        <>
          <div className={cn('bg-border', isMobile ? 'w-0.5' : 'w-px')} />
          <button
            onClick={onFullscreenToggle}
            className={cn(
              'transition-all bg-card text-foreground hover:bg-accent active:scale-95 flex items-center justify-center',
              isMobile
                ? 'min-w-[44px] min-h-[44px] px-3 py-2 rounded-r-lg'
                : 'px-2.5 py-1.5'
            )}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className={isMobile ? 'h-4 w-4' : 'h-4 w-4'} />
            ) : (
              <Maximize className={isMobile ? 'h-4 w-4' : 'h-4 w-4'} />
            )}
          </button>
        </>
      )}
    </div>
  )
}
