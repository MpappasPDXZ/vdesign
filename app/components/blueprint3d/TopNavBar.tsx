'use client'

import { ZoomIn, ZoomOut, Maximize2, Ruler, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'
import type { ViewMode } from '@/types/view-mode'

interface TopNavBarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  /** When false, hide the view toggle (e.g. projects tab) */
  showViewToggle?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  /** 3D measure mode — click two points for a length */
  measureActive?: boolean
  onMeasureToggle?: () => void
  /** Copy chrome-free viewport screenshot (header/footer) to clipboard */
  onCopyScreenshot?: () => void
  /** Blueprint: green landscaping / movable footprints */
  landscapingVisible?: boolean
  onLandscapingVisibleChange?: (visible: boolean) => void
  /** 3D: show/hide tree meshes */
  treesVisible?: boolean
  onTreesVisibleChange?: (visible: boolean) => void
}

const VIEW_OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: '2d', label: '2D' },
  { mode: 'blueprint', label: 'Blueprint' },
  { mode: '3d', label: '3D' }
]

/** Minimal chrome: 2D / Blueprint / 3D (+ 3D zoom) pinned top-right. */
export function TopNavBar({
  viewMode,
  onViewModeChange,
  showViewToggle = true,
  onZoomIn,
  onZoomOut,
  onFitView,
  measureActive = false,
  onMeasureToggle,
  onCopyScreenshot,
  landscapingVisible = true,
  onLandscapingVisibleChange,
  treesVisible = true,
  onTreesVisibleChange
}: TopNavBarProps) {
  const isMobile = useIsMobile()

  if (!showViewToggle) return null

  const showZoom = !!(onZoomIn || onZoomOut || onFitView)
  const showMeasure = viewMode === '3d' && !!onMeasureToggle
  const showScreenshot = !!onCopyScreenshot
  const showBlueprintPanel =
    viewMode === 'blueprint' && typeof onLandscapingVisibleChange === 'function'
  const show3dPanel = viewMode === '3d' && typeof onTreesVisibleChange === 'function'

  return (
    <div className={cn('pointer-events-none relative', isMobile ? 'h-12' : 'h-14')}>
      <div className="pointer-events-auto absolute right-3 top-1/2 z-[100] flex -translate-y-1/2 flex-col items-end gap-1.5 md:right-4">
        <div
          className={cn(
            'flex items-center rounded-full border border-border/50 bg-background/80 shadow-sm backdrop-blur-sm',
            isMobile ? 'gap-1 px-2 py-1.5' : 'gap-1.5 px-2.5 py-1.5'
          )}
        >
          {showZoom && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(isMobile ? 'h-7 w-7' : 'h-8 w-8')}
                    onClick={onZoomOut}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(isMobile ? 'h-7 w-7' : 'h-8 w-8')}
                    onClick={onZoomIn}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom in</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(isMobile ? 'h-7 w-7' : 'h-8 w-8')}
                    onClick={onFitView}
                    aria-label="Fit plan"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Fit plan</TooltipContent>
              </Tooltip>
              <div className="mx-0.5 h-5 w-px bg-border/60" aria-hidden />
            </>
          )}
          <div
            role="group"
            aria-label="View mode"
            className={cn(
              'flex items-center rounded-full bg-muted/60 p-0.5',
              isMobile ? 'gap-0' : 'gap-0.5'
            )}
          >
            {VIEW_OPTIONS.map(({ mode, label }) => {
              const active = viewMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full font-medium transition-colors',
                    isMobile ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-sm',
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              )
            })}
            {showMeasure && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border/60" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onMeasureToggle}
                      aria-pressed={measureActive}
                      aria-label="Measure"
                      title="Measure — click two points"
                      className={cn(
                        'rounded-full flex items-center justify-center transition-colors',
                        isMobile ? 'h-7 w-7' : 'h-8 w-8',
                        measureActive
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Ruler className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {measureActive ? 'Exit measure' : 'Measure — click two points'}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {showScreenshot && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border/60" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onCopyScreenshot}
                      aria-label="Copy screenshot"
                      title="Copy screenshot — no toolbar chrome"
                      className={cn(
                        'rounded-full flex items-center justify-center transition-colors',
                        isMobile ? 'h-7 w-7' : 'h-8 w-8',
                        'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Copy screenshot (clean view + header/footer)
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        {showBlueprintPanel && (
          <div
            className="w-max rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
            role="dialog"
            aria-label="Blueprint layers"
          >
            <label
              className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
              title="Green footprints: plants, rocks, planters, chairs, loungers"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-emerald-700"
                checked={landscapingVisible}
                onChange={(e) => onLandscapingVisibleChange?.(e.target.checked)}
              />
              Landscaping / movable
            </label>
          </div>
        )}
        {show3dPanel && (
          <div
            className="w-max rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
            role="dialog"
            aria-label="3D layers"
          >
            <label
              className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
              title="Pine, palm, cypress, and other trees"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-emerald-700"
                checked={treesVisible}
                onChange={(e) => onTreesVisibleChange?.(e.target.checked)}
              />
              Trees
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
