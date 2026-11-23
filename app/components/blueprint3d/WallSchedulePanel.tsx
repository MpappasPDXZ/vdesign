'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'
import type { WallScheduleEntry } from '@/types/project'

interface WallSchedulePanelProps {
  walls: WallScheduleEntry[]
  className?: string
}

export function WallSchedulePanel({ walls, className }: WallSchedulePanelProps) {
  const t = useTranslations('BluePrint.wallSchedule')
  const isMobile = useIsMobile()

  if (!walls.length) return null

  return (
    <div
      className={cn(
        'pointer-events-auto absolute left-5 top-16 z-[65] max-h-[min(50vh,420px)] w-[min(100%,280px)] overflow-y-auto rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm',
        isMobile && 'left-3 top-14 w-[min(100%,240px)]',
        className
      )}
    >
      <div className="sticky top-0 border-b border-border bg-background/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('title')}
      </div>
      <ol className="divide-y divide-border text-sm">
        {walls.map((w) => (
          <li key={w.n} className="flex gap-2 px-3 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white">
              {w.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium leading-tight">{w.role}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {w.outerLength ? (
                  <span>
                    {t('length')}: {w.outerLength}
                  </span>
                ) : (
                  <span className="italic">{t('lengthUnknown')}</span>
                )}
                {' · '}
                {w.thickness ? (
                  <span>
                    {t('thickness')}: {w.thickness}
                  </span>
                ) : (
                  <span className="italic">{t('thicknessUnknown')}</span>
                )}
              </div>
              {w.notes && <div className="mt-0.5 text-[11px] text-muted-foreground">{w.notes}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
