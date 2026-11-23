'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Calculator, Check, Link2, Trash2, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { wallDisplayColor, type Wall, type WallExposure, type WallType } from '@blueprint3d/model/wall'
import { cmToInches, inchesToCm } from './InchesDimensionInput'
import { FeetInchesSumCalculator } from './FeetInchesSumCalculator'

const WALL_TYPES: WallType[] = ['concrete', 'wood', 'steel', 'partition', 'generic']

type Cardinal = 'N' | 'E' | 'S' | 'W'
type CalcTarget = 'length' | 'thickness' | 'move' | 'connect'

export interface WallListItem {
  n: number
  wall: Wall
  label: string
}

interface WallPropertiesPanelProps {
  wall: Wall
  wallNumber?: number | null
  walls?: WallListItem[]
  onClose: () => void
  onChanged: () => void
  onDelete?: () => void
  /** Snapshot before Apply / Place / Move so Undo can restore. */
  onBeforeMutate?: () => void
  canUndo?: boolean
  onUndo?: () => void
}

function defaultName(wall: Wall, wallNumber?: number | null): string {
  if (wall.name) return wall.name
  const n = wallNumber != null ? `#${wallNumber}` : ''
  return `basement ${n}`.trim()
}

function roundIn(n: number): number {
  return Math.round(n * 1000) / 1000
}

/** Plan: +X east, +Y south */
function offsetCm(dir: Cardinal, inches: number): { dx: number; dy: number } {
  const cm = inchesToCm(inches)
  switch (dir) {
    case 'N':
      return { dx: 0, dy: -cm }
    case 'S':
      return { dx: 0, dy: cm }
    case 'E':
      return { dx: cm, dy: 0 }
    case 'W':
      return { dx: -cm, dy: 0 }
  }
}

function dist2(ax: number, ay: number, bx: number, by: number): number {
  return (ax - bx) ** 2 + (ay - by) ** 2
}

/** Suggest nearest other wall (by endpoint proximity). */
function suggestHost(wall: Wall, others: WallListItem[]): number | '' {
  if (!others.length) return ''
  let best: { n: number; d: number } | null = null
  for (const o of others) {
    const hx0 = o.wall.getStartX()
    const hy0 = o.wall.getStartY()
    const hx1 = o.wall.getEndX()
    const hy1 = o.wall.getEndY()
    for (const [gx, gy] of [
      [wall.getStartX(), wall.getStartY()],
      [wall.getEndX(), wall.getEndY()]
    ] as const) {
      const d = Math.min(dist2(gx, gy, hx0, hy0), dist2(gx, gy, hx1, hy1))
      if (!best || d < best.d) best = { n: o.n, d }
    }
  }
  return best?.n ?? ''
}

/** Exterior concrete walls default to 8"; thicker walls (e.g. W9/W10 @ 12") are set explicitly. */
const DEFAULT_EXTERIOR_CONCRETE_IN = 8

const fieldClass =
  'h-7 w-full rounded border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring'

export function WallPropertiesPanel({
  wall,
  wallNumber,
  walls = [],
  onClose,
  onChanged,
  onDelete,
  onBeforeMutate,
  canUndo = false,
  onUndo
}: WallPropertiesPanelProps) {
  const t = useTranslations('BluePrint.wallProps')
  const [name, setName] = useState(defaultName(wall, wallNumber))
  const [lengthInches, setLengthInches] = useState(cmToInches(wall.getLength()))
  const [thicknessInches, setThicknessInches] = useState(cmToInches(wall.thickness))
  const [wallType, setWallType] = useState<WallType>(wall.wallType || 'generic')
  const [exposure, setExposure] = useState<WallExposure>(wall.exposure || 'exterior')
  const [error, setError] = useState<string | null>(null)
  const [showCalc, setShowCalc] = useState(false)
  const [calcTarget, setCalcTarget] = useState<CalcTarget>('connect')
  const [moveDir, setMoveDir] = useState<Cardinal>('S')
  const [moveInches, setMoveInches] = useState(88)
  const [bringAttached, setBringAttached] = useState(true)
  const [connectTo, setConnectTo] = useState<number | ''>('')
  const [fromTopInches, setFromTopInches] = useState(88)
  const [axis, setAxis] = useState<'east-west' | 'north-south'>('east-west')

  const otherWalls = useMemo(
    () => walls.filter((w) => w.wall !== wall),
    [walls, wall]
  )

  useEffect(() => {
    setName(defaultName(wall, wallNumber))
    setLengthInches(cmToInches(wall.getLength()))
    setThicknessInches(cmToInches(wall.thickness))
    setWallType(wall.wallType || 'generic')
    setExposure(wall.exposure || 'exterior')
    setAxis(wall.getAxis())
    setError(null)
    setShowCalc(false)
    setConnectTo(suggestHost(wall, otherWalls))
  }, [wall, wallNumber, otherWalls])

  const syncFromWall = () => {
    setLengthInches(cmToInches(wall.getLength()))
    setThicknessInches(cmToInches(wall.thickness))
    setAxis(wall.getAxis())
  }

  const apply = () => {
    if (!(lengthInches > 0)) {
      setError(t('invalidLength'))
      return
    }
    if (!(thicknessInches > 0)) {
      setError(t('invalidThickness'))
      return
    }
    onBeforeMutate?.()
    wall.name = name.trim()
    wall.setLength(inchesToCm(lengthInches))
    wall.thickness = inchesToCm(thicknessInches)
    wall.wallType = wallType
    wall.exposure = exposure
    if (wall.getAxis() !== axis) wall.setAxis(axis)
    setError(null)
    onChanged()
    syncFromWall()
    toast.success(t('applyDone'), {
      action: onUndo ? { label: t('undo'), onClick: () => onUndo() } : undefined
    })
  }

  const applyConnect = () => {
    if (connectTo === '' || connectTo == null) {
      setError(t('invalidConnect'))
      return
    }
    if (!(fromTopInches >= 0)) {
      setError(t('invalidConnectOffset'))
      return
    }
    const host = otherWalls.find((w) => w.n === connectTo)?.wall
    if (!host) {
      setError(t('invalidConnect'))
      return
    }
    onBeforeMutate?.()
    wall.placeAgainstWall(host, fromTopInches, bringAttached)
    setError(null)
    onChanged()
    syncFromWall()
    toast.success(t('connectDone', { n: connectTo, inches: roundIn(fromTopInches) }), {
      action: onUndo ? { label: t('undo'), onClick: () => onUndo() } : undefined
    })
  }

  const moveWall = () => {
    if (!(moveInches > 0)) {
      setError(t('invalidMove'))
      return
    }
    onBeforeMutate?.()
    const before = { x: wall.getStartX(), y: wall.getStartY() }
    const { dx, dy } = offsetCm(moveDir, moveInches)
    wall.relativeMoveWithAttached(dx, dy, bringAttached)
    setError(null)
    onChanged()
    syncFromWall()
    toast.success(t('moveDone', { dir: moveDir, inches: roundIn(moveInches) }), {
      action: onUndo ? { label: t('undo'), onClick: () => onUndo() } : undefined
    })
    if (
      Math.abs(wall.getStartX() - before.x) < 1e-6 &&
      Math.abs(wall.getStartY() - before.y) < 1e-6
    ) {
      toast.error(t('moveFailed'))
    }
  }

  const handleDelete = () => {
    if (!onDelete) return
    if (!window.confirm(t('confirmDeletePrompt'))) return
    onDelete()
  }

  const dirs: { id: Cardinal; icon: typeof ArrowUp; label: string }[] = [
    { id: 'N', icon: ArrowUp, label: t('moveN') },
    { id: 'E', icon: ArrowRight, label: t('moveE') },
    { id: 'S', icon: ArrowDown, label: t('moveS') },
    { id: 'W', icon: ArrowLeft, label: t('moveW') }
  ]

  return (
    <div
      className={cn(
        'pointer-events-auto absolute right-3 top-12 z-[70] max-h-[calc(100vh-4rem)] w-[min(100%,280px)] overflow-y-auto rounded-md border border-border bg-background/95 p-2 shadow-lg backdrop-blur-sm'
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1.5 flex items-center gap-1">
        <span
          className="h-2 w-2 shrink-0 rounded-sm border border-border"
          style={{ backgroundColor: wallDisplayColor(wallType, exposure) }}
        />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {wallNumber != null ? `#${wallNumber}` : t('title')}
        </span>
        <Button type="button" size="sm" className="h-6 px-2 text-[10px]" onClick={apply} title={t('apply')}>
          <Check className="h-3 w-3" />
          {t('apply')}
        </Button>
        {canUndo && onUndo && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px]"
            onClick={onUndo}
            title={t('undo')}
          >
            <Undo2 className="h-3 w-3" />
            {t('undo')}
          </Button>
        )}
        {onDelete && (
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
        )}
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-1 text-xs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          className={fieldClass}
          placeholder={t('name')}
          aria-label={t('name')}
        />

        <div className="grid grid-cols-[1fr_1fr] gap-1">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t('length')} (in)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={roundIn(lengthInches)}
              onChange={(e) => setLengthInches(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t('thickness')} (in)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={roundIn(thicknessInches)}
              onChange={(e) => setThicknessInches(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-muted-foreground">{t('orientation')}</span>
          <div className="grid grid-cols-2 gap-1">
            <Button
              type="button"
              size="sm"
              variant={axis === 'east-west' ? 'default' : 'outline'}
              className="h-7 px-1 text-[10px]"
              onClick={() => setAxis('east-west')}
            >
              {t('orientationEWShort')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={axis === 'north-south' ? 'default' : 'outline'}
              className="h-7 px-1 text-[10px]"
              onClick={() => setAxis('north-south')}
            >
              {t('orientationNSShort')}
            </Button>
          </div>
          <span className="text-[9px] leading-tight text-muted-foreground">{t('orientationHint')}</span>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <select
            value={wallType}
            onChange={(e) => {
              const next = e.target.value as WallType
              setWallType(next)
              if (next === 'concrete' && exposure === 'exterior') {
                setThicknessInches(DEFAULT_EXTERIOR_CONCRETE_IN)
              }
            }}
            className={fieldClass}
            aria-label={t('type')}
          >
            {WALL_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
          <select
            value={exposure}
            onChange={(e) => {
              const next = e.target.value as WallExposure
              setExposure(next)
              if (next === 'exterior' && wallType === 'concrete') {
                setThicknessInches(DEFAULT_EXTERIOR_CONCRETE_IN)
              }
            }}
            className={fieldClass}
            aria-label={t('exposure')}
          >
            <option value="exterior">{t('exposureExterior')}</option>
            <option value="interior">{t('exposureInterior')}</option>
          </select>
        </div>

        {/* Connects to */}
        <div className="space-y-1 rounded border border-border/80 p-1.5">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Link2 className="h-3 w-3" />
            {t('connect')}
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t('connectTo')}</span>
            <select
              value={connectTo === '' ? '' : String(connectTo)}
              onChange={(e) => setConnectTo(e.target.value ? parseInt(e.target.value, 10) : '')}
              className={fieldClass}
            >
              <option value="">{t('connectNone')}</option>
              {otherWalls.map((w) => (
                <option key={w.n} value={w.n}>
                  #{w.n} — {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t('connectFromTop')}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={roundIn(fromTopInches)}
                onChange={(e) => setFromTopInches(parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => e.key === 'Enter' && applyConnect()}
                className={cn(fieldClass, 'flex-1')}
              />
              <span className="shrink-0 text-[10px] text-muted-foreground">in</span>
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={applyConnect}
                disabled={connectTo === ''}
              >
                {t('connectPlace')}
              </Button>
            </div>
          </label>
          <p className="text-[9px] leading-tight text-muted-foreground">{t('connectHint')}</p>
          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={bringAttached}
              onChange={(e) => setBringAttached(e.target.checked)}
              className="size-3 accent-primary"
            />
            {t('bringAttached')}
          </label>
        </div>

        {/* Move N/E/S/W */}
        <div className="space-y-1 rounded border border-border/80 p-1.5">
          <div className="text-[10px] font-medium text-muted-foreground">{t('move')}</div>
          <div className="grid grid-cols-4 gap-0.5">
            {dirs.map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={moveDir === id ? 'default' : 'outline'}
                className="h-7 px-0"
                title={label}
                onClick={() => setMoveDir(id)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={roundIn(moveInches)}
              onChange={(e) => setMoveInches(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => e.key === 'Enter' && moveWall()}
              className={cn(fieldClass, 'flex-1')}
              aria-label={t('moveInches')}
            />
            <span className="shrink-0 text-[10px] text-muted-foreground">in</span>
            <Button type="button" size="sm" className="h-7 px-2 text-[10px]" onClick={moveWall}>
              {t('moveGo')}
            </Button>
          </div>
          <p className="text-[9px] leading-tight text-muted-foreground">{t('bringAttachedHint')}</p>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-border py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
          onClick={() => setShowCalc((v) => !v)}
        >
          <Calculator className="h-3 w-3" />
          {showCalc ? t('hideCalc') : t('showCalc')}
        </button>

        {showCalc && (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['connect', t('connect')],
                  ['length', t('length')],
                  ['thickness', t('thickness')],
                  ['move', t('move')]
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={calcTarget === id ? 'default' : 'outline'}
                  className="h-5 flex-1 text-[10px]"
                  onClick={() => setCalcTarget(id)}
                >
                  → {label}
                </Button>
              ))}
            </div>
            <FeetInchesSumCalculator
              applyLabel={t('useSum')}
              onApplyInches={(inches) => {
                if (calcTarget === 'length') setLengthInches(inches)
                else if (calcTarget === 'thickness') setThicknessInches(inches)
                else if (calcTarget === 'connect') setFromTopInches(inches)
                else setMoveInches(inches)
                setShowCalc(false)
              }}
            />
          </div>
        )}

        {error && <p className="text-[10px] text-destructive">{error}</p>}
      </div>
    </div>
  )
}
