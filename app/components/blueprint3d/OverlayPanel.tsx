'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'
import type { OverlayDescriptor } from '@blueprint3d/floorplanner/overlay'

interface OverlayPanelProps {
  overlays: OverlayDescriptor[]
  onToggle: (id: string, visible: boolean) => void
  onOpacityChange: (id: string, opacity: number) => void
}

export function OverlayPanel({ overlays, onToggle, onOpacityChange }: OverlayPanelProps) {
  const t = useTranslations('BluePrint.overlays')
  const isMobile = useIsMobile()

  if (!overlays.length) return null

  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-5 bottom-5 flex w-[min(100%,240px)] flex-col gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm',
        isMobile && 'right-3 bottom-3'
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('title')}
      </div>
      <ul className="space-y-2">
        {overlays.map((o) => (
          <li key={o.id} className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={o.visible}
                onChange={(e) => onToggle(o.id, e.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="truncate">{o.label}</span>
              {o.kind === 'blueprint' && (
                <span className="ml-auto text-[10px] font-normal uppercase text-muted-foreground">
                  {t('typeBlueprint')}
                </span>
              )}
            </label>
            {o.visible && o.kind === 'blueprint' && o.opacity != null && (
              <label className="flex flex-col gap-1 pl-6 text-xs text-muted-foreground">
                <span>
                  {t('opacity')}: {Math.round(o.opacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={o.opacity}
                  onChange={(e) => onOpacityChange(o.id, parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
