'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface UnderlayControlsProps {
  visible: boolean
  opacity: number
  onToggle: (visible: boolean) => void
  onOpacityChange: (opacity: number) => void
}

export function UnderlayControls({
  visible,
  opacity,
  onToggle,
  onOpacityChange
}: UnderlayControlsProps) {
  const t = useTranslations('BluePrint.underlay')
  const isMobile = useIsMobile()

  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-5 bottom-5 flex flex-col gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm',
        isMobile && 'right-3 bottom-3 max-w-[min(100%,220px)]'
      )}
    >
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => onToggle(e.target.checked)}
          className="size-4 accent-primary"
        />
        {t('showBlueprint')}
      </label>
      {visible && (
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>
            {t('opacity')}: {Math.round(opacity * 100)}%
          </span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
      )}
    </div>
  )
}
