'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Item } from '@blueprint3d/items/item'
import { OnFloorItem } from '@blueprint3d/items/on_floor_item'
import { FloorItem } from '@blueprint3d/items/floor_item'
import { WallItem } from '@blueprint3d/items/wall_item'
import { InWallItem } from '@blueprint3d/items/in_wall_item'
import { InWallFloorItem } from '@blueprint3d/items/in_wall_floor_item'

const NUDGE_IN = 6

/** Floor furniture / props — not wall-mounted openings. */
export function isMovableFloorItem(item: Item): boolean {
  if (item.fixed) return false
  if (item instanceof WallItem) return false
  if (item instanceof InWallItem) return false
  if (item instanceof InWallFloorItem) return false
  return item instanceof OnFloorItem || item instanceof FloorItem
}

interface ItemMovePanelProps {
  item: Item
  onMoved?: () => void
}

/**
 * Move selected floor furniture: N/E/S/W nudges + typed yaw 0–360.
 * Blue marker sits at the item centroid (drag the item itself in the canvas).
 */
export function ItemMovePanel({ item, onMoved }: ItemMovePanelProps) {
  const [angle, setAngle] = useState(() => radToDeg(item.rotation.y))

  useEffect(() => {
    setAngle(radToDeg(item.rotation.y))
  }, [item])

  if (typeof document === 'undefined') return null

  const name =
    (item.metadata as { itemName?: string } | undefined)?.itemName ||
    (item.metadata as { name?: string } | undefined)?.name ||
    'Item'

  const nudge = (dir: 'N' | 'E' | 'S' | 'W') => {
    const cm = NUDGE_IN * 2.54
    const next = item.position.clone()
    if (dir === 'N') next.z -= cm
    else if (dir === 'S') next.z += cm
    else if (dir === 'E') next.x += cm
    else next.x -= cm
    // Keep elevation; FloorItem.moveToPosition may adjust y for floor clearance
    item.moveToPosition(next, null)
    onMoved?.()
  }

  const applyAngle = () => {
    const n = Number(angle)
    if (!Number.isFinite(n)) return
    const wrapped = ((n % 360) + 360) % 360
    item.rotation.y = (wrapped * Math.PI) / 180
    setAngle(String(Math.round(wrapped)))
    onMoved?.()
  }

  return createPortal(
    <div
      className={cn(
        'fixed right-3 top-14 z-[70] w-[12rem] rounded-md border border-border/60',
        'bg-background/90 p-2 shadow-sm backdrop-blur-sm'
      )}
      title="Nudge selected furniture on the plan, or type yaw 0–360. Drag the item in 3D to move freely."
    >
      <div
        className="mb-1.5 truncate text-xs font-medium text-foreground"
        title={name}
      >
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500 align-middle" />
        Move
      </div>
      <div className="mb-1.5 truncate text-[10px] text-muted-foreground" title={name}>
        {name}
      </div>
      <div className="grid grid-cols-3 gap-1 place-items-center">
        <span />
        <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('N')}>
          N
        </Button>
        <span />
        <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('W')}>
          W
        </Button>
        <span className="h-3 w-3 rounded-full bg-blue-500 shadow" aria-hidden />
        <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('E')}>
          E
        </Button>
        <span />
        <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('S')}>
          S
        </Button>
        <span />
      </div>
      <label
        className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
        title="Yaw degrees: 0 faces +Z (south), 90 faces +X (east)"
      >
        <span className="shrink-0">Angle</span>
        <Input
          type="number"
          min={0}
          max={360}
          step={1}
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          onBlur={applyAngle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
              applyAngle()
            }
          }}
          className="h-7 text-xs"
        />
      </label>
    </div>,
    document.body
  )
}

function radToDeg(rad: number): string {
  return String(Math.round(((((rad * 180) / Math.PI) % 360) + 360) % 360))
}
