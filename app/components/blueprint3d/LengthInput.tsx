'use client'

import { useEffect, useRef, useState } from 'react'
import { Ruler } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Dimensioning } from '@blueprint3d/core/dimensioning'

interface LengthInputProps {
  enabled: boolean
  onCommit: (lengthCm: number) => void
  className?: string
}

export function LengthInput({ enabled, onCommit, className }: LengthInputProps) {
  const t = useTranslations('BluePrint.floorplanner')
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (enabled) {
      setValue('')
      setError(false)
      // Defer focus so canvas click does not steal it immediately
      const id = window.setTimeout(() => inputRef.current?.focus(), 50)
      return () => window.clearTimeout(id)
    }
  }, [enabled])

  if (!enabled) return null

  const submit = () => {
    const cm = Dimensioning.measureToCm(value)
    if (cm == null || cm <= 0) {
      setError(true)
      return
    }
    setError(false)
    onCommit(cm)
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      <Ruler className="h-4 w-4 shrink-0 text-muted-foreground" />
      <label className="sr-only" htmlFor="vdesign-length-input">
        {t('typedLengthLabel')}
      </label>
      <input
        id="vdesign-length-input"
        ref={inputRef}
        type="text"
        inputMode="decimal"
        placeholder={t('typedLengthPlaceholder')}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
          e.stopPropagation()
        }}
        className={cn(
          'w-36 rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring',
          error ? 'border-destructive' : 'border-input'
        )}
      />
      <button
        type="button"
        onClick={submit}
        className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        {t('typedLengthApply')}
      </button>
      <span className="hidden text-xs text-muted-foreground sm:inline">{t('typedLengthHint')}</span>
    </div>
  )
}
