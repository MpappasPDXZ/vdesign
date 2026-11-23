'use client'

import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface TopNavBarProps {
  viewMode: '2d' | '3d'
  onViewModeChange: (mode: '2d' | '3d') => void
  /** When false, hide the view toggle (e.g. projects tab) */
  showViewToggle?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
}

/** Minimal chrome: 2D/3D toggle (+ 3D zoom) pinned top-right. */
export function TopNavBar({
  viewMode,
  onViewModeChange,
  showViewToggle = true,
  onZoomIn,
  onZoomOut,
  onFitView
}: TopNavBarProps) {
  const isMobile = useIsMobile()

  if (!showViewToggle) return null

  const showZoom = viewMode === '3d' && (onZoomIn || onZoomOut || onFitView)

  return (
    <div className={cn('pointer-events-none relative', isMobile ? 'h-12' : 'h-14')}>
      <div className="pointer-events-auto absolute right-3 top-1/2 z-[100] -translate-y-1/2 md:right-4">
        <div
          className={cn(
            'flex items-center rounded-full border border-border/50 bg-background/80 shadow-sm backdrop-blur-sm',
            isMobile ? 'gap-1.5 px-2.5 py-1.5' : 'gap-2 px-3 py-1.5'
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
          <span
            className={cn(
              'font-medium transition-colors',
              isMobile ? 'text-xs' : 'text-sm',
              viewMode === '2d' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            2D
          </span>
          <Switch
            checked={viewMode === '3d'}
            onCheckedChange={(checked) => onViewModeChange(checked ? '3d' : '2d')}
            className={cn(isMobile && 'h-4 w-7')}
          />
          <span
            className={cn(
              'font-medium transition-colors',
              isMobile ? 'text-xs' : 'text-sm',
              viewMode === '3d' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            3D
          </span>
        </div>
      </div>
    </div>
  )
}
