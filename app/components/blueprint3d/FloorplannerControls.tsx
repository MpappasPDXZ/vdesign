'use client'

import { Move, Pencil, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface FloorplannerControlsProps {
  mode: 'move' | 'draw' | 'delete'
  onModeChange: (mode: 'move' | 'draw' | 'delete') => void
  onDone: () => void
  className?: string
}

/** Compact floating 2D toolbar — Move / Draw / Delete (also in left sidebar Add/Remove). */
export function FloorplannerControls({
  mode,
  onModeChange,
  onDone,
  className
}: FloorplannerControlsProps) {
  const t = useTranslations('BluePrint.floorplanner')

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      <Button
        size="sm"
        variant={mode === 'move' ? 'default' : 'ghost'}
        onClick={() => onModeChange('move')}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title={t('moveWalls')}
        aria-label={t('moveWalls')}
        aria-pressed={mode === 'move'}
      >
        <Move className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        variant={mode === 'draw' ? 'default' : 'ghost'}
        onClick={() => onModeChange('draw')}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title={t('drawWalls')}
        aria-label={t('drawWalls')}
        aria-pressed={mode === 'draw'}
      >
        <Pencil className="h-3.5 w-3.5" />
        Draw
      </Button>
      <Button
        size="sm"
        variant={mode === 'delete' ? 'default' : 'ghost'}
        onClick={() => onModeChange('delete')}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title={t('deleteWalls')}
        aria-label={t('deleteWalls')}
        aria-pressed={mode === 'delete'}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <Button
        size="sm"
        variant="default"
        onClick={onDone}
        className="h-8 gap-1.5 px-2.5 text-xs"
        aria-label={t('done')}
      >
        <Check className="h-3.5 w-3.5" />
        {t('done')}
      </Button>
    </div>
  )
}
