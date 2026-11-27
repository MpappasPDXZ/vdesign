'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { Wall } from '@blueprint3d/model/wall'
import {
  areaLabelFromWalls,
  upsertArea,
  wallsFormClosedLoop
} from '@/lib/area-from-walls'

interface AreaFloorPanelProps {
  walls: Wall[]
  wallNumbers: number[]
  areas: AreaLabel[]
  onClose: () => void
  onClearSelection: () => void
  onApply: (areas: AreaLabel[]) => void
  /** Selected walls → 42″ black metal railing (fence). */
  onMakeRailing?: (walls: Wall[]) => void
  /** Selected walls → full-height stud wall (not railing). */
  onMakeWall?: (walls: Wall[]) => void
}

/** Guard-height Omarail stand-in (42″) / 2″ posts — matches existing loft rails. */
export const RAILING_HEIGHT_CM = 106.68
export const RAILING_THICKNESS_CM = 5.08
export const FULL_WALL_HEIGHT_CM = 274.32
export const FULL_WALL_THICKNESS_CM = 10

export function AreaFloorPanel({
  walls,
  wallNumbers,
  areas,
  onClose,
  onClearSelection,
  onApply,
  onMakeRailing,
  onMakeWall
}: AreaFloorPanelProps) {
  const [name, setName] = useState('')
  const [floorVisible, setFloorVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const closed = useMemo(() => wallsFormClosedLoop(walls), [walls])

  const existing = useMemo(
    () =>
      [...areas].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [areas]
  )

  if (!mounted) return null

  const canCreate = walls.length >= 2 && name.trim().length > 0

  const handleCreate = () => {
    const label = areaLabelFromWalls(walls, name, floorVisible)
    if (!label) return
    onApply(upsertArea(areas, label))
    setName('')
    setFloorVisible(true)
    onClearSelection()
  }

  const setExistingFloorVisible = (areaName: string, visible: boolean) => {
    onApply(
      areas.map((a) =>
        a.name === areaName
          ? {
              ...a,
              area_floor_invisible: visible ? false : true
            }
          : a
      )
    )
  }

  return createPortal(
    <aside
      className="fixed right-3 top-14 z-[70] flex w-[min(100vw-1.5rem,20rem)] flex-col gap-3 rounded-lg border border-border bg-background p-3 shadow-lg"
      role="dialog"
      aria-label="Areas & floor"
    >
      <div className="flex items-start justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <h2 className="text-sm font-semibold leading-tight">Areas & floor</h2>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[16rem] text-xs">
            Click walls to select. Make railing / wall, or name a zone and set floor visible.
          </TooltipContent>
        </Tooltip>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <section className="space-y-2 rounded-md border border-border p-2">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            Walls {wallNumbers.length ? wallNumbers.map((n) => `#${n}`).join(' ') : '—'}
          </span>
          <span className={closed ? 'text-emerald-600' : ''}>
            {walls.length < 3 ? 'need ≥3' : closed ? 'closed' : 'open'}
          </span>
        </div>
        {(onMakeRailing || onMakeWall) && (
          <div className="flex gap-1.5">
            {onMakeRailing && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 flex-1 text-[11px]"
                disabled={!walls.length}
                title="42″ black metal railing"
                onClick={() => onMakeRailing(walls)}
              >
                Make railing
              </Button>
            )}
            {onMakeWall && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 flex-1 text-[11px]"
                disabled={!walls.length}
                title="Full-height stud wall"
                onClick={() => onMakeWall(walls)}
              >
                Make wall
              </Button>
            )}
          </div>
        )}
        <label className="block space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Name
          </span>
          <input
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Open to Great Room"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            className="size-3.5 accent-primary"
            checked={floorVisible}
            onChange={(e) => setFloorVisible(e.target.checked)}
          />
          Floor visible
        </label>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            className="h-8 flex-1 gap-1"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            <Check className="h-3.5 w-3.5" />
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!walls.length}
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </section>

      {existing.length > 0 && (
        <section className="space-y-1">
          <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Existing
          </div>
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1.5">
            {existing.map((a) => {
              const visible = !(a.area_floor_invisible === true || a.area_floor_invisible === 1)
              return (
                <li key={a.name}>
                  <label className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted/60">
                    <input
                      type="checkbox"
                      className="size-3.5 shrink-0 accent-primary"
                      checked={visible}
                      onChange={(e) => setExistingFloorVisible(a.name, e.target.checked)}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium" title={a.name}>
                      {a.name}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </aside>,
    document.body
  )
}
