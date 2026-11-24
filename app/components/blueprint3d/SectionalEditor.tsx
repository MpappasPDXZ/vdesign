'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Item } from '@blueprint3d/items/item'
import type { Scene } from '@blueprint3d/model/scene'
import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'

/** Matches theatre gray sectional (and legacy green L) pieces. */
const SECTIONAL_PREFIXES = ['Sectional —', 'Sectional -', 'Green Couch L']
const MIN_ARM_IN = 24
const MIN_DEPTH_IN = 18

type EdgesIn = {
  west: number
  north: number
  south: number
  east: number
  depth: number
}

function isSectionalItem(item: Item): boolean {
  const name = item.metadata?.itemName || ''
  return SECTIONAL_PREFIXES.some((p) => name.startsWith(p))
}

function cmToDisplay(cm: number, unit: string): number {
  switch (unit) {
    case 'm':
      return cm / 100
    case 'cm':
      return cm
    case 'mm':
      return cm * 10
    case 'inch':
    default:
      return cm / 2.54
  }
}

function displayToCm(value: number, unit: string): number {
  switch (unit) {
    case 'm':
      return value * 100
    case 'cm':
      return value
    case 'mm':
      return value / 10
    case 'inch':
    default:
      return value * 2.54
  }
}

function unitLabel(unit: string): string {
  switch (unit) {
    case 'm':
      return 'm'
    case 'cm':
      return 'cm'
    case 'mm':
      return 'mm'
    default:
      return 'in'
  }
}

function roundDisp(n: number, unit: string): number {
  const d = unit === 'm' ? 2 : unit === 'cm' ? 1 : 0
  return Number(n.toFixed(d))
}

type Arms = {
  /** N–S arm (along east wall / W33) */
  ns: Item
  /** E–W arm (along north wall / W31) */
  ew: Item
  slant: Item | null
  /** NE corner nest (W31/W33) vs legacy SW nest */
  nest: 'ne' | 'sw'
}

/** Classify L arms (+ optional slant chaise). */
function classifyArms(items: Item[]): Arms | null {
  if (items.length < 2) return null
  const nameOf = (i: Item) => i.metadata?.itemName || ''
  const slant = items.find((i) => /slant/i.test(nameOf(i))) || null
  const east = items.find((i) => /east/i.test(nameOf(i)))
  const north = items.find(
    (i) => /north/i.test(nameOf(i)) && !/slant/i.test(nameOf(i))
  )
  if (east && north && east !== north) {
    return { ns: east, ew: north, slant, nest: 'ne' }
  }
  const west = items.find((i) => /west/i.test(nameOf(i)))
  const south = items.find(
    (i) => /south/i.test(nameOf(i)) && !/slant/i.test(nameOf(i))
  )
  if (west && south && west !== south) {
    return { ns: west, ew: south, slant, nest: 'sw' }
  }
  const rect = items.filter((i) => i !== slant)
  const sorted = [...rect].sort((a, b) => b.getDepth() - a.getDepth())
  const ns = sorted[0]
  const ew = rect.find((i) => i !== ns) || sorted[1]
  if (!ns || !ew) return null
  return { ns, ew, slant, nest: 'sw' }
}

function readEdgesCm(arms: Arms): {
  west: number
  north: number
  south: number
  east: number
  depth: number
  height: number
} {
  const { ns, ew, nest } = arms
  if (nest === 'ne') {
    // NE nest: ns = east arm (DEPTH along X), ew = north arm (DEPTH along Z)
    const d = ns.getWidth()
    const e = ns.position.x + d / 2
    const n = ew.position.z + ew.getDepth() / 2
    const w = ew.position.x - ew.getWidth() / 2
    const s = ns.position.z + ns.getDepth() / 2
    return { west: w, north: n, south: s, east: e, depth: d, height: ns.getHeight() }
  }
  // SW nest: ns = west arm, ew = south arm
  const d = ns.getWidth()
  const w = ns.position.x - d / 2
  const n = ns.position.z - ns.getDepth() / 2
  const s = ew.position.z + ew.getDepth() / 2
  const e = ew.position.x + ew.getWidth() / 2
  return { west: w, north: n, south: s, east: e, depth: d, height: ns.getHeight() }
}

function edgesValid(w: number, n: number, s: number, e: number, d: number): boolean {
  const nsLen = Math.abs(s - n) - d
  const ewLen = Math.abs(e - w)
  return (
    nsLen >= MIN_ARM_IN * 2.54 &&
    ewLen >= MIN_ARM_IN * 2.54 &&
    d >= MIN_DEPTH_IN * 2.54
  )
}

function applyEdgesToArms(
  arms: Arms,
  w: number,
  n: number,
  s: number,
  e: number,
  d: number,
  height: number
): void {
  const { ns, ew, slant, nest } = arms
  const anchor = nest === 'ne' ? ew : ew
  const prevAx = nest === 'ne' ? ew.position.x - ew.getWidth() / 2 : ew.position.x + ew.getWidth() / 2
  const prevAz = ew.position.z
  const slantDx = slant ? slant.position.x - prevAx : 0
  const slantDz = slant ? slant.position.z - prevAz : 0

  if (nest === 'ne') {
    // East arm (N–S): east face @ e, runs south from n to s
    const nsLen = s - (n - d)
    ns.position.set(e - d / 2, ns.position.y, (n - d + s) / 2)
    ns.resize(height, d, nsLen)
    ns.position_set = true
    ns.metadata.itemName = 'Sectional — east'
    ns.metadata.description = 'Gray sectional — along W33 (edge-editable)'

    // North arm (E–W): north face @ n, runs west from e to w
    const ewLen = e - w
    ew.position.set((w + e) / 2, ew.position.y, n - d / 2)
    ew.resize(height, ewLen, d)
    ew.position_set = true
    ew.metadata.itemName = 'Sectional — north'
    ew.metadata.description = 'Gray sectional — along W31 (edge-editable)'

    if (slant) {
      const newWest = ew.position.x - ew.getWidth() / 2
      slant.position.set(newWest + slantDx, slant.position.y, ew.position.z + slantDz)
      slant.position_set = true
    }
    return
  }

  // SW nest (legacy)
  const westLen = s - d - n
  const southLen = e - w
  ns.position.set(w + d / 2, ns.position.y, (n + (s - d)) / 2)
  ns.resize(height, d, westLen)
  ns.position_set = true
  ns.metadata.itemName = 'Sectional — west'
  ns.metadata.description = 'Gray sectional — west run (edge-editable)'

  ew.position.set((w + e) / 2, ew.position.y, s - d / 2)
  ew.resize(height, southLen, d)
  ew.position_set = true
  ew.metadata.itemName = 'Sectional — south'
  ew.metadata.description = 'Gray sectional — south run (edge-editable)'

  if (slant) {
    const newEast = ew.position.x + ew.getWidth() / 2
    slant.position.set(newEast + slantDx, slant.position.y, ew.position.z + slantDz)
    slant.position_set = true
  }
  void anchor
}

export function isSectionalCouch(item: Item | null | undefined): boolean {
  return !!item && isSectionalItem(item)
}

interface SectionalEditorProps {
  selectedItem: Item
  scene: Scene | null | undefined
  onDelete: () => void
  onClose: () => void
}

/**
 * Linked L-sectional editor: each outer edge (N/S/E/W) is a draft field;
 * Apply writes both arms. Nudge buttons move the whole L.
 */
export function SectionalEditor({
  selectedItem,
  scene,
  onDelete,
  onClose
}: SectionalEditorProps) {
  const unit = Configuration.getStringValue(configDimUnit) || 'inch'
  const [draft, setDraft] = useState<EdgesIn>({
    west: 0,
    north: 0,
    south: 0,
    east: 0,
    depth: 0
  })
  const [heightCm, setHeightCm] = useState(78)
  const [error, setError] = useState<string | null>(null)

  const arms = useMemo(() => {
    if (!scene) return null
    const group = scene.getItems().filter(isSectionalItem)
    return classifyArms(group)
  }, [scene, selectedItem])

  useEffect(() => {
    if (!arms) return
    const e = readEdgesCm(arms)
    setHeightCm(e.height)
    setDraft({
      west: roundDisp(cmToDisplay(e.west, unit), unit),
      north: roundDisp(cmToDisplay(e.north, unit), unit),
      south: roundDisp(cmToDisplay(e.south, unit), unit),
      east: roundDisp(cmToDisplay(e.east, unit), unit),
      depth: roundDisp(cmToDisplay(e.depth, unit), unit)
    })
    setError(null)
  }, [arms, selectedItem, unit])

  const commitCm = (w: number, n: number, s: number, e: number, d: number) => {
    if (!arms) return
    if (!edgesValid(w, n, s, e, d)) {
      setError('Arms too small')
      return
    }
    setError(null)
    applyEdgesToArms(arms, w, n, s, e, d, heightCm)
  }

  const handleApply = () => {
    commitCm(
      displayToCm(draft.west, unit),
      displayToCm(draft.north, unit),
      displayToCm(draft.south, unit),
      displayToCm(draft.east, unit),
      displayToCm(draft.depth, unit)
    )
  }

  const nudgeEdge = (edge: keyof EdgesIn, deltaDisp: number) => {
    const next = { ...draft, [edge]: roundDisp(draft[edge] + deltaDisp, unit) }
    setDraft(next)
    commitCm(
      displayToCm(next.west, unit),
      displayToCm(next.north, unit),
      displayToCm(next.south, unit),
      displayToCm(next.east, unit),
      displayToCm(next.depth, unit)
    )
  }

  const nudgeAll = (dx: number, dz: number) => {
    const next = {
      ...draft,
      west: roundDisp(draft.west + dx, unit),
      east: roundDisp(draft.east + dx, unit),
      north: roundDisp(draft.north + dz, unit),
      south: roundDisp(draft.south + dz, unit)
    }
    setDraft(next)
    commitCm(
      displayToCm(next.west, unit),
      displayToCm(next.north, unit),
      displayToCm(next.south, unit),
      displayToCm(next.east, unit),
      displayToCm(next.depth, unit)
    )
  }

  const handleDeleteBoth = () => {
    if (!scene) {
      onDelete()
      return
    }
    scene
      .getItems()
      .filter(isSectionalItem)
      .forEach((it) => it.removeFromScene())
    onClose()
  }

  if (!arms) return null

  const edgeRow = (
    label: string,
    key: keyof EdgesIn,
    title: string
  ) => (
    <div className="flex items-center gap-1" title={title}>
      <span className="w-4 shrink-0 text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0 text-xs"
        onClick={() => nudgeEdge(key, -1)}
        title={`${label} −1 ${unitLabel(unit)} (live)`}
      >
        −
      </Button>
      <Input
        type="number"
        value={draft[key]}
        onChange={(e) =>
          setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))
        }
        className="h-7 text-xs"
        step={unit === 'm' ? '0.01' : '1'}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0 text-xs"
        onClick={() => nudgeEdge(key, 1)}
        title={`${label} +1 ${unitLabel(unit)} (live)`}
      >
        +
      </Button>
    </div>
  )

  const panel = (
    <div
      className={cn(
        'pointer-events-auto fixed right-3 top-14 z-[70] w-[280px] rounded-md border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm'
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="truncate text-sm font-semibold"
          title="Gray 90° + slant sectional. Move each outer edge; −/+ nudges live; Apply commits typed values."
        >
          Sectional
        </span>
        <div className="flex shrink-0 gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDeleteBoth}
            title="Delete both arms"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {edgeRow('N', 'north', 'North tip of west arm')}
        {edgeRow('W', 'west', 'West outer face')}
        {edgeRow('E', 'east', 'East tip of south arm')}
        {edgeRow('S', 'south', 'South outer face (along W32)')}
        {edgeRow('D', 'depth', 'Seat depth (both arms)')}
      </div>

      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        {unitLabel(unit)}
      </p>

      {error && (
        <p className="mt-1 text-center text-[10px] text-destructive">{error}</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-[10px] text-muted-foreground" title="Nudge whole L">
          Place
        </span>
        <div className="flex gap-0.5">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-xs" onClick={() => nudgeAll(-1, 0)}>
            ←
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-xs" onClick={() => nudgeAll(1, 0)}>
            →
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-xs" onClick={() => nudgeAll(0, -1)}>
            ↑
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-xs" onClick={() => nudgeAll(0, 1)}>
            ↓
          </Button>
        </div>
      </div>

      <Button type="button" className="mt-2 h-8 w-full text-xs" onClick={handleApply}>
        Apply edges
      </Button>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
