'use client'

import { useRef, useState } from 'react'
import { ChevronDown, ImagePlus, Trash2, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'

interface BlueprintOverlayEditorProps {
  underlay: UnderlayConfig | null
  visible: boolean
  onToggleVisible: (visible: boolean) => void
  onChange: (next: UnderlayConfig) => void
  onRemove: () => void
  onAddFile: (file: File) => void
}

function Field({
  label,
  value,
  onCommit,
  step = 1
}: {
  label: string
  value: number
  onCommit: (n: number) => void
  step?: number
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          if (!Number.isNaN(n)) onCommit(n)
        }}
        className="rounded border border-input bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  )
}

export function BlueprintOverlayEditor({
  underlay,
  visible,
  onToggleVisible,
  onChange,
  onRemove,
  onAddFile
}: BlueprintOverlayEditorProps) {
  const t = useTranslations('BluePrint.blueprintOverlay')
  const fileRef = useRef<HTMLInputElement>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)

  return (
    <div className="space-y-1.5 rounded-lg border border-border p-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onAddFile(file)
        }}
      />

      {!underlay ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">{t('empty')}</p>
          <Button
            type="button"
            size="sm"
            className="h-7 w-full justify-start text-xs"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {t('add')}
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => onToggleVisible(e.target.checked)}
              className="size-3.5 accent-primary"
            />
            <span className="truncate">{t('show')}</span>
          </label>

          {visible && (
            <>
              <label className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                <span>
                  {t('opacity')}: {Math.round(underlay.opacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={underlay.opacity}
                  onChange={(e) =>
                    onChange({ ...underlay, opacity: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
              </label>

              <button
                type="button"
                className="flex w-full items-center justify-between rounded px-0.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => setAdjustOpen((o) => !o)}
              >
                <span>{t('adjust')}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', adjustOpen && 'rotate-180')} />
              </button>

              {adjustOpen && (
                <div className="space-y-1.5 border-t border-border pt-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Field
                      label={t('xCm')}
                      value={underlay.xCm}
                      step={1}
                      onCommit={(xCm) => onChange({ ...underlay, xCm })}
                    />
                    <Field
                      label={t('yCm')}
                      value={underlay.yCm}
                      step={1}
                      onCommit={(yCm) => onChange({ ...underlay, yCm })}
                    />
                    <Field
                      label={t('widthCm')}
                      value={underlay.widthCm}
                      step={1}
                      onCommit={(widthCm) => {
                        if (widthCm > 0) onChange({ ...underlay, widthCm })
                      }}
                    />
                    <Field
                      label={t('heightCm')}
                      value={underlay.heightCm}
                      step={1}
                      onCommit={(heightCm) => {
                        if (heightCm > 0) onChange({ ...underlay, heightCm })
                      }}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 justify-start text-xs"
                      onClick={() => fileRef.current?.click()}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {t('replace')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive"
                      onClick={onRemove}
                      title={t('remove')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {!visible && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 w-full justify-start text-xs"
              onClick={() => fileRef.current?.click()}
            >
              <RefreshCw className="h-3 w-3" />
              {t('replace')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
