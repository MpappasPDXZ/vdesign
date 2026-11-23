'use client'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface TopNavBarProps {
  viewMode: '2d' | '3d'
  onViewModeChange: (mode: '2d' | '3d') => void
  /** When false, hide the view toggle (e.g. projects tab) */
  showViewToggle?: boolean
}

/** Minimal chrome: 2D/3D toggle pinned top-right. All other dials live in the left menu. */
export function TopNavBar({
  viewMode,
  onViewModeChange,
  showViewToggle = true
}: TopNavBarProps) {
  const isMobile = useIsMobile()

  if (!showViewToggle) return null

  return (
    <div className={cn('pointer-events-none relative', isMobile ? 'h-12' : 'h-14')}>
      <div className="pointer-events-auto absolute right-3 top-1/2 z-[100] -translate-y-1/2 md:right-4">
        <div
          className={cn(
            'flex items-center rounded-full border border-border/50 bg-background/80 shadow-sm backdrop-blur-sm',
            isMobile ? 'gap-2 px-3 py-1.5' : 'gap-3 px-4 py-2'
          )}
        >
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
