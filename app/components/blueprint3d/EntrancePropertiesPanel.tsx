'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Check, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Item } from '@blueprint3d/items/item'
import { cmToInches, inchesToCm } from './InchesDimensionInput'

interface EntrancePropertiesPanelProps {
  /** Wall-hosted entrance / opening item (E or S badge on the plan). */
  item: Item
  onClose: () => void
  /** Called before geometry changes (undo snapshot). */
  onBeforeMutate?: () => void
  /** Width/height applied — persist plan + sync schedule. */
  onApplied: (item: Item, widthInches: number, heightInches: number) => void
  /** Trash — remove from scene, wall, schedule; persist. */
  onDelete: (item: Item) => void
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Entrance Editor — opened by clicking an E/S badge in 2D Edit mode.
 * Fields: width, height (inches). One Apply → `item.resize` (cuts the wall hole to size).
 * Delete = trash. Docs: docs/entrance-editor.md
 */
export function EntrancePropertiesPanel({
  item,
  onClose,
  onBeforeMutate,
  onApplied,
  onDelete
}: EntrancePropertiesPanelProps) {
  const t = useTranslations('BluePrint.entranceProps')
  const [widthIn, setWidthIn] = useState(round2(cmToInches(item.getWidth())))
  const [heightIn, setHeightIn] = useState(round2(cmToInches(item.getHeight())))

  // Re-init only when a different entrance is picked.
  useEffect(() => {
    setWidthIn(round2(cmToInches(item.getWidth())))
    setHeightIn(round2(cmToInches(item.getHeight())))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  const name = item.metadata?.itemName || t('title')
  const hostN = item.metadata?.hostWallN as number | undefined
  const kind = item.metadata?.entranceKind === 'stairs' ? 'S' : 'E'

  const apply = () => {
    if (!(widthIn > 0) || !(heightIn > 0)) return
    onBeforeMutate?.()
    item.resize(inchesToCm(heightIn), inchesToCm(widthIn), item.getDepth())
    onApplied(item, widthIn, heightIn)
  }

  const handleDelete = () => {
    if (!window.confirm(t('confirmDeletePrompt', { name }))) return
    onDelete(item)
  }

  const inputClass =
    'h-7 w-20 rounded border border-input bg-background px-1.5 text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring'

  const panel = (
    <div
      className="fixed right-3 top-14 z-[70] w-[300px] rounded-lg border border-border bg-background/95 p-2.5 shadow-xl backdrop-blur"
      data-entrance-editor="true"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 border-b border-border pb-1.5">
        <div
          className="flex items-center gap-1"
          title={hostN != null ? t('titleHost', { n: hostN }) : t('title')}
        >
          <span className="shrink-0 rounded bg-teal-600 px-1.5 py-0.5 text-xs font-bold text-white">
            {kind}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight" title={name}>
            {name}
          </span>
          <Button
            type="button"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={apply}
            title={t('apply')}
          >
            <Check className="h-3 w-3" />
            {t('apply')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-6 px-2 text-[10px]"
            onClick={handleDelete}
            title={t('delete')}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">{t('width')}</span>
          <input
            type="number"
            min={1}
            step={0.25}
            value={widthIn}
            onChange={(e) => setWidthIn(parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">{t('height')}</span>
          <input
            type="number"
            min={1}
            step={0.25}
            value={heightIn}
            onChange={(e) => setHeightIn(parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
