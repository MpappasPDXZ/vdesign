'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Link2, Trash2, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { wallDisplayColor, type Wall, type WallExposure, type WallType } from '@blueprint3d/model/wall'
import type { InchMeasurementLineage, WallScheduleEntry } from '@/types/project'
import { cmToInches, inchesToCm } from './InchesDimensionInput'
import { InchFieldWithCalc } from './InchFieldWithCalc'

const WALL_TYPES: WallType[] = ['concrete', 'wood', 'steel', 'partition', 'generic']

type Cardinal = 'N' | 'E' | 'S' | 'W'

export interface WallListItem {
  n: number
  wall: Wall
  label: string
}

/** Connect persist payload — tip join only (mid-span is offsetInches). */
export interface WallConnectSave {
  connectsToWall: number
  connectsAt: Cardinal
  extends: Cardinal
}

interface WallPropertiesPanelProps {
  wall: Wall
  wallNumber?: number | null
  walls?: WallListItem[]
  /** Saved schedule row for this wall — restores Connect host. */
  scheduleEntry?: WallScheduleEntry | null
  onClose: () => void
  onChanged: () => void
  onDelete?: () => void
  /** Persist Connect host/end after Apply. */
  onConnectSaved?: (wallNumber: number, connect: WallConnectSave) => void
  /** Persist schedule fields (lineage, offset, etc.). */
  onSchedulePatch?: (wallNumber: number, patch: Partial<WallScheduleEntry>) => void
  /** Highlight Connect host on the 2D plan (orange). Cleared on unmount. */
  onConnectHostHighlight?: (host: Wall | null) => void
  /** Snapshot before Apply so Undo can restore. */
  onBeforeMutate?: () => void
  canUndo?: boolean
  onUndo?: () => void
}

function extendsToCardinal(ext?: string | null): Cardinal | null {
  if (!ext) return null
  const k = ext.toLowerCase()
  if (k === 'n' || k === 'north') return 'N'
  if (k === 'e' || k === 'east') return 'E'
  if (k === 's' || k === 'south') return 'S'
  if (k === 'w' || k === 'west') return 'W'
  if (k === 'top') return 'N'
  if (k === 'bottom') return 'S'
  return null
}

/** Map host tip N/E/S/W → internal top/bottom (N/W = top, S/E = bottom). */
function hostTipToTopBottom(tip: Cardinal): 'top' | 'bottom' {
  return tip === 'N' || tip === 'W' ? 'top' : 'bottom'
}

function topBottomToHostTip(
  tb: 'top' | 'bottom',
  axis: 'east-west' | 'north-south'
): Cardinal {
  if (axis === 'east-west') return tb === 'top' ? 'W' : 'E'
  return tb === 'top' ? 'N' : 'S'
}

/** Prefer the host tip that isn't already joined to another wall. */
function freeHostTip(host: Wall): Cardinal {
  const topC = host.cornerAtEnd('top')
  const botC = host.cornerAtEnd('bottom')
  const topBusy = topC.wallCount() > 1
  const botBusy = botC.wallCount() > 1
  const axis = host.getAxis()
  if (topBusy && !botBusy) return topBottomToHostTip('bottom', axis)
  if (botBusy && !topBusy) return topBottomToHostTip('top', axis)
  return topBottomToHostTip('bottom', axis)
}

function parseSavedHostTip(
  raw: string | undefined | null,
  host: Wall | null
): Cardinal | null {
  if (!raw || !host) return null
  const c = extendsToCardinal(raw)
  if (c === 'N' || c === 'E' || c === 'S' || c === 'W') {
    const axis = host.getAxis()
    if (axis === 'east-west' && (c === 'E' || c === 'W')) return c
    if (axis === 'north-south' && (c === 'N' || c === 'S')) return c
    if (raw === 'top' || raw === 'bottom') {
      return topBottomToHostTip(raw, axis)
    }
  }
  if (raw === 'top' || raw === 'bottom') {
    return topBottomToHostTip(raw, host.getAxis())
  }
  return null
}

function defaultName(wall: Wall, wallNumber?: number | null): string {
  if (wall.name) return wall.name
  const n = wallNumber != null ? `#${wallNumber}` : ''
  return `basement ${n}`.trim()
}

function roundIn(n: number): number {
  return Math.round(n * 1000) / 1000
}

/**
 * Restore Offset inches/dir. Canonical: offsetInches + offsetDir.
 * Deprecated fromEndInches/fromEndIn/fromTopIn migrate only when offsetInches absent.
 */
function readOffset(
  schedule: WallScheduleEntry | null | undefined,
  tip: Cardinal
): { inches: number; dir: Cardinal } {
  const away: Record<Cardinal, Cardinal> = { N: 'S', S: 'N', W: 'E', E: 'W' }
  if (typeof schedule?.offsetInches === 'number' && schedule.offsetInches >= 0) {
    return {
      inches: schedule.offsetInches,
      dir: extendsToCardinal(schedule.offsetDir) ?? away[tip]
    }
  }
  const legacy =
    (typeof schedule?.fromEndInches === 'number' && schedule.fromEndInches > 0
      ? schedule.fromEndInches
      : null) ??
    (typeof schedule?.fromEndIn === 'number' && schedule.fromEndIn > 0
      ? schedule.fromEndIn
      : null) ??
    (typeof schedule?.fromTopIn === 'number' && schedule.fromTopIn > 0
      ? schedule.fromTopIn
      : null)
  if (legacy != null) {
    return { inches: legacy, dir: extendsToCardinal(schedule?.offsetDir) ?? away[tip] }
  }
  return { inches: 0, dir: 'S' }
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

/** Infer start→finish cardinal from current wall geometry (start → end). */
function inferSpanDir(wall: Wall): Cardinal {
  const dx = wall.getEndX() - wall.getStartX()
  const dy = wall.getEndY() - wall.getStartY()
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'E' : 'W'
  return dy >= 0 ? 'S' : 'N'
}

/**
 * Suggest a host wall. Prefer a shared corner (true join), then nearest tip.
 * On ties, prefer the lower wall number (predecessor), not a successor like #4 for #3.
 */
function suggestHost(wall: Wall, others: WallListItem[], preferBefore?: number | null): number | '' {
  if (!others.length) return ''
  const myCorners = new Set([wall.getStart(), wall.getEnd()])
  let best: { n: number; d: number; shared: boolean } | null = null
  for (const o of others) {
    const shared =
      myCorners.has(o.wall.getStart()) || myCorners.has(o.wall.getEnd())
    const hx0 = o.wall.getStartX()
    const hy0 = o.wall.getStartY()
    const hx1 = o.wall.getEndX()
    const hy1 = o.wall.getEndY()
    let d = Infinity
    for (const [gx, gy] of [
      [wall.getStartX(), wall.getStartY()],
      [wall.getEndX(), wall.getEndY()]
    ] as const) {
      d = Math.min(d, dist2(gx, gy, hx0, hy0), dist2(gx, gy, hx1, hy1))
    }
    if (!best) {
      best = { n: o.n, d, shared }
      continue
    }
    if (shared && !best.shared) {
      best = { n: o.n, d, shared }
      continue
    }
    if (shared === best.shared) {
      if (d < best.d - 1e-9) {
        best = { n: o.n, d, shared }
      } else if (Math.abs(d - best.d) <= 1e-9) {
        const prefer = preferBefore != null ? preferBefore - 1 : null
        if (prefer != null && o.n === prefer) best = { n: o.n, d, shared }
        else if (prefer != null && best.n === prefer) {
          /* keep */
        } else if (o.n < best.n) best = { n: o.n, d, shared }
      }
    }
  }
  return best?.n ?? ''
}

/** Exterior concrete walls default to 8"; thicker walls (e.g. W9/W10 @ 12") are set explicitly. */
const DEFAULT_EXTERIOR_CONCRETE_IN = 8

const fieldClass =
  'h-7 w-full rounded border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring'

const sectionClass =
  'space-y-1.5 rounded-md border border-border bg-muted/20 p-2 shadow-sm'
const sectionTitleClass =
  'cursor-help text-[11px] font-semibold uppercase tracking-wide text-foreground underline decoration-dotted decoration-muted-foreground/60 underline-offset-2'

function SectionTitle({ label, hint }: { label: string; hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={sectionTitleClass} tabIndex={0}>
          {label}
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="z-[90] max-w-[240px] text-[11px] leading-snug">
        {hint}
      </TooltipContent>
    </Tooltip>
  )
}

export function WallPropertiesPanel({
  wall,
  wallNumber,
  walls = [],
  scheduleEntry = null,
  onClose,
  onChanged,
  onDelete,
  onConnectSaved,
  onSchedulePatch,
  onConnectHostHighlight,
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
  const [moveDir, setMoveDir] = useState<Cardinal>('S')
  const [moveInches, setMoveInches] = useState(0)
  const [bringAttached, setBringAttached] = useState(false)
  const [connectTo, setConnectTo] = useState<number | ''>('')
  const [hostTip, setHostTip] = useState<Cardinal>('E')
  const [spanDir, setSpanDir] = useState<Cardinal>('E')
  const [lengthLineage, setLengthLineage] = useState<InchMeasurementLineage | null>(null)
  const [thicknessLineage, setThicknessLineage] = useState<InchMeasurementLineage | null>(null)
  const [moveLineage, setMoveLineage] = useState<InchMeasurementLineage | null>(null)

  const otherWalls = useMemo(
    () => walls.filter((w) => w.wall !== wall),
    [walls, wall]
  )

  const hostWall = useMemo(
    () => (connectTo === '' ? null : otherWalls.find((w) => w.n === connectTo)?.wall ?? null),
    [connectTo, otherWalls]
  )

  // Connect host → orange on plan (field → floorplanner.setConnectHostWall).
  useEffect(() => {
    onConnectHostHighlight?.(hostWall)
    return () => onConnectHostHighlight?.(null)
  }, [hostWall, onConnectHostHighlight])

  const pickHost = (n: number | '') => {
    setConnectTo(n)
    if (n === '') return
    const host = otherWalls.find((o) => o.n === n)?.wall
    if (host) setHostTip(freeHostTip(host))
  }

  // Only re-init when the selected wall changes — not when parent recreates `walls`.
  useEffect(() => {
    setName(defaultName(wall, wallNumber))
    setLengthInches(cmToInches(wall.getLength()))
    setThicknessInches(cmToInches(wall.thickness))
    setWallType(wall.wallType || 'generic')
    setExposure(wall.exposure || 'exterior')
    setError(null)
    setLengthLineage(scheduleEntry?.lengthLineage ?? null)
    setThicknessLineage(scheduleEntry?.thicknessLineage ?? null)
    setMoveLineage(scheduleEntry?.offsetLineage ?? null)

    const others = walls.filter((w) => w.wall !== wall)
    const savedHost = scheduleEntry?.connectsToWall ?? scheduleEntry?.connectsTo
    const hostN =
      savedHost != null && others.some((o) => o.n === savedHost)
        ? savedHost
        : suggestHost(wall, others, wallNumber)
    setConnectTo(hostN)
    const host = hostN === '' ? null : others.find((o) => o.n === hostN)?.wall ?? null
    const savedTip = parseSavedHostTip(scheduleEntry?.connectsAt, host)
    const tip = savedTip ?? (host ? freeHostTip(host) : 'E')
    setHostTip(tip)

    // Offset ← offsetInches only (one-shot migrate from deprecated tip-distance keys).
    const { inches: offIn, dir: offDir } = readOffset(scheduleEntry, tip)
    setMoveInches(offIn)
    setMoveDir(offDir)

    setSpanDir(
      extendsToCardinal(scheduleEntry?.extends) ??
        (scheduleEntry?.orientation === 'east-west'
          ? 'E'
          : scheduleEntry?.orientation === 'north-south'
            ? 'S'
            : null) ??
        inferSpanDir(wall)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only when wall identity changes
  }, [wall, wallNumber])

  /** True if this wall shares a corner with host (real join). */
  const sharesCornerWith = (host: Wall) => {
    const a = wall.getStart()
    const b = wall.getEnd()
    return (
      a === host.getStart() ||
      a === host.getEnd() ||
      b === host.getStart() ||
      b === host.getEnd()
    )
  }

  /** Join at host tip. Mid-span = Offset after join. Place never brings neighbors. */
  const placeOnHost = (host: Wall, hostN: number) => {
    const fromEnd = hostTipToTopBottom(hostTip)
    const lenCm =
      lengthInches > 0 ? inchesToCm(lengthInches) : wall.getLength()
    wall.placeAgainstWall(host, 0, false, fromEnd, spanDir, lenCm)
    if (!sharesCornerWith(host)) {
      toast.error(t('connectFailed'))
      return false
    }
    if (wallNumber != null) {
      onConnectSaved?.(wallNumber, {
        connectsToWall: hostN,
        connectsAt: hostTip,
        extends: spanDir
      })
    }
    return true
  }

  /** One Apply: specs → tip join (if Connect) → offset move. See docs/wall-editor.md */
  const apply = () => {
    if (!(lengthInches > 0)) {
      setError(t('invalidLength'))
      return
    }
    if (!(thicknessInches > 0)) {
      setError(t('invalidThickness'))
      return
    }
    if (!(moveInches >= 0)) {
      setError(t('invalidMove'))
      return
    }
    onBeforeMutate?.()
    wall.name = name.trim()
    wall.thickness = inchesToCm(thicknessInches)
    wall.wallType = wallType
    wall.exposure = exposure

    const host =
      connectTo === '' ? null : otherWalls.find((w) => w.n === connectTo)?.wall ?? null
    const lenCm = inchesToCm(lengthInches)

    if (host && connectTo !== '') {
      // Tip join + length in one shot — do NOT setLength first (that dragged hosts).
      if (!placeOnHost(host, connectTo)) {
        setError(t('connectFailed'))
        onChanged()
        return
      }
    } else {
      wall.setSpanFrom(
        wall.getStartX(),
        wall.getStartY(),
        spanDir,
        false,
        null,
        lenCm
      )
    }

    if (moveInches > 0) {
      const { dx, dy } = offsetCm(moveDir, moveInches)
      // Default: move this wall only (split off host). Chain-neighbor is opt-in.
      wall.relativeMoveWithAttached(dx, dy, bringAttached)
    }

    if (wallNumber != null) {
      onSchedulePatch?.(wallNumber, {
        outerLength: `${roundIn(lengthInches)}"`,
        thickness: `${roundIn(thicknessInches)}"`,
        wallType,
        exposure,
        name: name.trim() || undefined,
        offsetInches: roundIn(moveInches),
        offsetDir: moveDir,
        // Always write lineage keys (null clears) so carpenter-square audit trail persists
        lengthLineage: lengthLineage ?? null,
        thicknessLineage: thicknessLineage ?? null,
        offsetLineage: moveLineage ?? null
      })
    }

    setError(null)
    onChanged()
    toast.success(t('applyDone'), {
      action: onUndo ? { label: t('undo'), onClick: () => onUndo() } : undefined
    })
    onClose()
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

  // Portal to body — never under #floorplanner (papercut: open/visibility hell).
  const panel = (
    <div
      className={cn(
        'pointer-events-auto fixed right-3 top-14 z-[70] max-h-[calc(100vh-4rem)] w-[300px] overflow-y-auto rounded-md border border-border bg-background/95 p-2 shadow-lg backdrop-blur-sm'
      )}
      data-wall-editor="true"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 border-b border-border pb-1.5">
        <div className="flex items-center gap-1">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm border border-border"
            style={{ backgroundColor: wallDisplayColor(wallType, exposure) }}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
            {wallNumber != null ? t('titleNumbered', { n: wallNumber }) : t('title')}
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
      </div>

      <div className="space-y-2 text-xs">
        {/* ——— Placement ——— */}
        <section className={sectionClass}>
          <SectionTitle label={t('sectionPlacement')} hint={t('sectionPlacementHint')} />

          <div className="flex items-center gap-1.5">
            <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-[10px] text-muted-foreground">{t('connect')}</span>
            <select
              value={connectTo === '' ? '' : String(connectTo)}
              onChange={(e) => pickHost(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="h-7 w-14 shrink-0 rounded border border-input bg-background px-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              aria-label={t('connectTo')}
              title={t('connectTo')}
            >
              <option value="">{t('connectNone')}</option>
              {otherWalls.map((w) => (
                <option key={w.n} value={w.n}>
                  {w.n}
                </option>
              ))}
            </select>
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{t('connectTip')}</span>
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {dirs.map(({ id, icon: Icon, label }) => {
              const axisHost = hostWall?.getAxis()
              const allowed =
                !hostWall ||
                (axisHost === 'east-west' && (id === 'E' || id === 'W')) ||
                (axisHost === 'north-south' && (id === 'N' || id === 'S'))
              return (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={hostTip === id ? 'default' : 'outline'}
                  className="h-7 px-0"
                  title={label}
                  disabled={!allowed}
                  onClick={() => setHostTip(id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              )
            })}
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground">{t('spanDir')}</span>
            <div className="grid grid-cols-4 gap-0.5">
              {dirs.map(({ id, icon: Icon, label }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={spanDir === id ? 'default' : 'outline'}
                  className="h-7 px-0"
                  title={label}
                  onClick={() => setSpanDir(id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Specs ——— */}
        <section className={sectionClass}>
          <SectionTitle label={t('sectionSpecs')} hint={t('sectionSpecsHint')} />
          <div className="grid grid-cols-2 gap-1.5">
            <InchFieldWithCalc
              label={`${t('length')}`}
              value={lengthInches}
              onChange={setLengthInches}
              lineage={lengthLineage}
              onLineage={(lin) => {
                setLengthLineage(lin)
                if (wallNumber != null) onSchedulePatch?.(wallNumber, { lengthLineage: lin })
              }}
              min={0}
              onEnter={apply}
              calcTitle={t('calcTitleLength')}
              calcHint={t('calcModalHint')}
              useSumLabel={t('useSum')}
            />
            <InchFieldWithCalc
              label={`${t('thickness')}`}
              value={thicknessInches}
              onChange={setThicknessInches}
              lineage={thicknessLineage}
              onLineage={(lin) => {
                setThicknessLineage(lin)
                if (wallNumber != null) onSchedulePatch?.(wallNumber, { thicknessLineage: lin })
              }}
              min={0}
              onEnter={apply}
              calcTitle={t('calcTitleThickness')}
              calcHint={t('calcModalHint')}
              useSumLabel={t('useSum')}
            />
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
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className={fieldClass}
            placeholder={t('name')}
            aria-label={t('name')}
          />
        </section>

        {/* ——— Offset (Move only — applied with Apply) ——— */}
        <section className={sectionClass}>
          <SectionTitle label={t('sectionOffset')} hint={t('sectionOffsetHint')} />
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
          <InchFieldWithCalc
            label={t('moveInches')}
            value={moveInches}
            onChange={setMoveInches}
            lineage={moveLineage}
            onLineage={(lin) => {
              setMoveLineage(lin)
              if (wallNumber != null) onSchedulePatch?.(wallNumber, { offsetLineage: lin })
            }}
            min={0}
            onEnter={apply}
            calcTitle={t('calcTitleMove')}
            calcHint={t('calcModalHint')}
            useSumLabel={t('useSum')}
          />
          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={bringAttached}
              onChange={(e) => setBringAttached(e.target.checked)}
              className="size-3 accent-primary"
            />
            {t('bringAttached')}
          </label>
        </section>

        {error && <p className="text-[10px] text-destructive">{error}</p>}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
