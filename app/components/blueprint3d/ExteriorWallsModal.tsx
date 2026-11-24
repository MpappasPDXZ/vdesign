'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Wall, WallExposure, WallType } from '@blueprint3d/model/wall'
import type { WallScheduleEntry } from '@/types/project'
import { cmToInches, inchesToCm } from './InchesDimensionInput'
import type { WallConnectSave } from './WallPropertiesPanel'

const TARGET_EXTERIOR = 16
const WALL_TYPES: WallType[] = ['concrete', 'wood', 'steel', 'fence', 'partition', 'generic']
type Cardinal = 'N' | 'E' | 'S' | 'W'

export interface ExteriorWallsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walls: Wall[]
  wallSchedule: WallScheduleEntry[]
  selectedIndex: number
  onSelectIndex: (index0: number) => void
  onBeforeMutate?: () => void
  onChanged: () => void
  onConnectSaved?: (wallNumber: number, connect: WallConnectSave) => void
  onAddWall: () => void
  onUpdateScheduleMeta?: (n: number, patch: Partial<WallScheduleEntry>) => void
}

function roundIn(n: number): number {
  return Math.round(n * 1000) / 1000
}

function inferSpanDir(wall: Wall): Cardinal {
  const dx = wall.getEndX() - wall.getStartX()
  const dy = wall.getEndY() - wall.getStartY()
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'E' : 'W'
  return dy >= 0 ? 'S' : 'N'
}

const fieldClass =
  'h-8 w-full rounded border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring'

export function ExteriorWallsModal({
  open,
  onOpenChange,
  walls,
  wallSchedule,
  selectedIndex,
  onSelectIndex,
  onBeforeMutate,
  onChanged,
  onConnectSaved,
  onAddWall,
  onUpdateScheduleMeta
}: ExteriorWallsModalProps) {
  const t = useTranslations('BluePrint.exteriorWalls')
  const tProps = useTranslations('BluePrint.wallProps')

  const wall = walls[selectedIndex] ?? null
  const wallNumber = selectedIndex + 1
  const schedule = wallSchedule.find((s) => s.n === wallNumber)

  const [name, setName] = useState('')
  const [lengthInches, setLengthInches] = useState(0)
  const [thicknessInches, setThicknessInches] = useState(8)
  const [wallType, setWallType] = useState<WallType>('concrete')
  const [exposure, setExposure] = useState<WallExposure>('exterior')
  const [connectTo, setConnectTo] = useState<number | ''>('')
  const [fromEnd, setFromEnd] = useState<'top' | 'bottom'>('bottom')
  const [fromEndInches, setFromEndInches] = useState(0)
  const [spanDir, setSpanDir] = useState<Cardinal>('S')

  useEffect(() => {
    if (!wall) return
    setName(wall.name || schedule?.name || `basement #${wallNumber}`)
    setLengthInches(cmToInches(wall.getLength()))
    setThicknessInches(cmToInches(wall.thickness) || 8)
    setWallType((wall.wallType as WallType) || 'concrete')
    setExposure((wall.exposure as WallExposure) || 'exterior')
    const savedHost = schedule?.connectsToWall ?? schedule?.connectsTo
    setConnectTo(
      savedHost != null && savedHost >= 1 && savedHost <= walls.length
        ? savedHost
        : wallNumber > 1
          ? wallNumber - 1
          : ''
    )
    setFromEnd(schedule?.connectsAt === 'top' ? 'top' : 'bottom')
    setFromEndInches(
      typeof schedule?.offsetInches === 'number'
        ? schedule.offsetInches
        : typeof schedule?.fromEndInches === 'number'
          ? schedule.fromEndInches
          : typeof schedule?.fromEndIn === 'number'
            ? schedule.fromEndIn
            : typeof schedule?.fromTopIn === 'number'
              ? schedule.fromTopIn
              : 0
    )
    const ext = (schedule?.extends || '').toLowerCase()
    if (ext.startsWith('n')) setSpanDir('N')
    else if (ext.startsWith('e')) setSpanDir('E')
    else if (ext.startsWith('w')) setSpanDir('W')
    else if (ext.startsWith('s')) setSpanDir('S')
    else setSpanDir(inferSpanDir(wall))
  }, [wall, wallNumber, schedule, walls.length])

  const slots = useMemo(() => {
    const count = Math.max(TARGET_EXTERIOR, walls.length)
    return Array.from({ length: count }, (_, i) => i)
  }, [walls.length])

  const host = connectTo === '' ? null : walls[connectTo - 1] ?? null

  const saveCurrent = (andPlace: boolean) => {
    if (!wall) {
      toast.error(t('noWall'))
      return false
    }
    if (!(lengthInches > 0) || !(thicknessInches > 0)) {
      toast.error(tProps('invalidLength'))
      return false
    }
    onBeforeMutate?.()
    wall.name = name.trim() || `basement #${wallNumber}`
    wall.setLength(inchesToCm(lengthInches))
    wall.thickness = inchesToCm(thicknessInches)
    wall.wallType = wallType
    wall.exposure = exposure

    const tipOnHost: Cardinal =
      fromEnd === 'top'
        ? host?.getAxis() === 'east-west'
          ? 'W'
          : 'N'
        : host?.getAxis() === 'east-west'
          ? 'E'
          : 'S'

    const extendsWord =
      spanDir === 'N' ? 'north' : spanDir === 'E' ? 'east' : spanDir === 'S' ? 'south' : 'west'
    // Same model as Wall Editor: tip join + offset inches (no fromEndInches dual key).
    if (andPlace && connectTo !== '' && host) {
      wall.placeAgainstWall(host, 0, false, fromEnd, spanDir)
      if (fromEndInches > 0) {
        const cm = fromEndInches * 2.54
        const away =
          tipOnHost === 'N'
            ? { dx: 0, dy: cm }
            : tipOnHost === 'S'
              ? { dx: 0, dy: -cm }
              : tipOnHost === 'W'
                ? { dx: cm, dy: 0 }
                : { dx: -cm, dy: 0 }
        wall.relativeMoveIndependent(away.dx, away.dy)
      }
      onConnectSaved?.(wallNumber, {
        connectsToWall: connectTo,
        connectsAt: tipOnHost,
        extends: spanDir
      })
      onUpdateScheduleMeta?.(wallNumber, {
        name: wall.name,
        role: wall.name,
        outerLength: `${roundIn(lengthInches)}"`,
        thickness: `${roundIn(thicknessInches)}"`,
        wallType,
        exposure,
        offsetInches: roundIn(fromEndInches),
        offsetDir:
          tipOnHost === 'N' ? 'S' : tipOnHost === 'S' ? 'N' : tipOnHost === 'W' ? 'E' : 'W',
        extends: extendsWord
      })
    } else {
      wall.setSpanFrom(wall.getStartX(), wall.getStartY(), spanDir, false)
      onUpdateScheduleMeta?.(wallNumber, {
        name: wall.name,
        role: wall.name,
        outerLength: `${roundIn(lengthInches)}"`,
        thickness: `${roundIn(thicknessInches)}"`,
        wallType,
        exposure,
        connectsToWall: connectTo === '' ? undefined : connectTo,
        connectsAt: tipOnHost,
        offsetInches: roundIn(fromEndInches),
        extends: extendsWord
      })
    }
    onChanged()
    toast.success(t('saved', { n: wallNumber }))
    return true
  }

  const goPrev = () => {
    if (selectedIndex <= 0) return
    saveCurrent(true)
    onSelectIndex(selectedIndex - 1)
  }

  const goNext = () => {
    if (!saveCurrent(true)) return
    if (selectedIndex < walls.length - 1) {
      onSelectIndex(selectedIndex + 1)
    } else if (walls.length < TARGET_EXTERIOR) {
      onAddWall()
    }
  }

  const endLabels =
    host?.getAxis() === 'east-west'
      ? { top: tProps('connectEndWest'), bottom: tProps('connectEndEast') }
      : host?.getAxis() === 'north-south'
        ? { top: tProps('connectEndNorth'), bottom: tProps('connectEndSouth') }
        : { top: tProps('connectEndTop'), bottom: tProps('connectEndBottom') }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[min(100%,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('subtitle', { count: walls.length, target: TARGET_EXTERIOR })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-[7rem_1fr] overflow-hidden">
          <ol className="overflow-y-auto border-r border-border bg-muted/30 p-1.5">
            {slots.map((i) => {
              const exists = i < walls.length
              const active = i === selectedIndex
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={!exists}
                    onClick={() => exists && onSelectIndex(i)}
                    className={cn(
                      'mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                      active && 'bg-primary text-primary-foreground',
                      !active && exists && 'hover:bg-accent',
                      !exists && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-blue-700 text-white'
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate">{exists ? t('wall') : t('empty')}</span>
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="overflow-y-auto p-4">
            {!wall ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{t('needAdd')}</p>
                <Button type="button" onClick={onAddWall}>
                  <Plus className="h-4 w-4" />
                  {t('addWall')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-semibold">
                  {t('editing', { n: wallNumber })}
                </div>

                <label className="block space-y-1 text-xs">
                  <span className="text-muted-foreground">{tProps('name')}</span>
                  <input
                    className={fieldClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1 text-xs">
                    <span className="text-muted-foreground">{tProps('length')} (in)</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={fieldClass}
                      value={roundIn(lengthInches)}
                      onChange={(e) => setLengthInches(parseFloat(e.target.value) || 0)}
                    />
                  </label>
                  <label className="block space-y-1 text-xs">
                    <span className="text-muted-foreground">{tProps('thickness')} (in)</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className={fieldClass}
                      value={roundIn(thicknessInches)}
                      onChange={(e) => setThicknessInches(parseFloat(e.target.value) || 0)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1 text-xs">
                    <span className="text-muted-foreground">{tProps('type')}</span>
                    <select
                      className={fieldClass}
                      value={wallType}
                      onChange={(e) => setWallType(e.target.value as WallType)}
                    >
                      {WALL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {tProps(`types.${type}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1 text-xs">
                    <span className="text-muted-foreground">{tProps('exposure')}</span>
                    <select
                      className={fieldClass}
                      value={exposure}
                      onChange={(e) => setExposure(e.target.value as WallExposure)}
                    >
                      <option value="exterior">{tProps('exposureExterior')}</option>
                      <option value="interior">{tProps('exposureInterior')}</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-2 rounded-md border border-border p-2.5">
                  <div className="text-xs font-medium text-muted-foreground">{tProps('connect')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block space-y-1 text-xs">
                      <span className="text-muted-foreground">{tProps('connectTo')}</span>
                      <select
                        className={fieldClass}
                        value={connectTo === '' ? '' : String(connectTo)}
                        onChange={(e) =>
                          setConnectTo(e.target.value ? parseInt(e.target.value, 10) : '')
                        }
                      >
                        <option value="">{tProps('connectNone')}</option>
                        {walls.map((_, i) =>
                          i + 1 === wallNumber ? null : (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="text-muted-foreground">{tProps('connectFromEnd')}</span>
                      <select
                        className={fieldClass}
                        value={fromEnd}
                        onChange={(e) => {
                          setFromEnd(e.target.value as 'top' | 'bottom')
                          setFromEndInches(0)
                        }}
                      >
                        <option value="top">{endLabels.top}</option>
                        <option value="bottom">{endLabels.bottom}</option>
                      </select>
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="text-muted-foreground">{tProps('connectOffset')}</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className={fieldClass}
                        value={roundIn(fromEndInches)}
                        onChange={(e) => setFromEndInches(parseFloat(e.target.value) || 0)}
                      />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">{tProps('spanDir')}</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['N', 'E', 'S', 'W'] as Cardinal[]).map((d) => (
                        <Button
                          key={d}
                          type="button"
                          size="sm"
                          variant={spanDir === d ? 'default' : 'outline'}
                          className="h-8"
                          onClick={() => setSpanDir(d)}
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={walls.length >= TARGET_EXTERIOR}
            onClick={onAddWall}
            title={t('addWallHint')}
          >
            <Plus className="h-4 w-4" />
            {t('addWall')}
            <span className="text-muted-foreground">
              ({walls.length}/{TARGET_EXTERIOR})
            </span>
          </Button>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selectedIndex <= 0}
              onClick={goPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('prev')}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => saveCurrent(true)}>
              <Check className="h-4 w-4" />
              {t('save')}
            </Button>
            <Button type="button" size="sm" onClick={goNext}>
              {selectedIndex < walls.length - 1
                ? t('next')
                : walls.length < TARGET_EXTERIOR
                  ? t('saveAndAdd')
                  : t('done')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const EXTERIOR_WALL_TARGET = TARGET_EXTERIOR
