import type {
  EntranceScheduleEntry,
  FloorFinishSpec,
  VdesignProject,
  WallScheduleEntry
} from '@/types/project'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { SerializedItem } from '@blueprint3d/model/model'

/** Stable key for item union (no unique id in SerializedItem). */
export function itemFingerprint(item: SerializedItem): string {
  return [
    item.model_url || '',
    item.item_type,
    item.item_name || '',
    Math.round(item.xpos ?? 0),
    Math.round(item.ypos ?? 0),
    Math.round(item.zpos ?? 0)
  ].join('|')
}

function unionByKey<T>(
  current: T[] | undefined,
  incoming: T[] | undefined,
  keyOf: (row: T) => string,
  /** When both have the same key, prefer incoming. */
  preferIncoming = true
): T[] {
  const map = new Map<string, T>()
  for (const row of current || []) {
    map.set(keyOf(row), row)
  }
  for (const row of incoming || []) {
    const k = keyOf(row)
    if (!map.has(k) || preferIncoming) map.set(k, row)
  }
  return [...map.values()]
}

function mergeWallSchedule(
  current: WallScheduleEntry[] | undefined,
  incoming: WallScheduleEntry[] | undefined
): WallScheduleEntry[] | undefined {
  if (!current?.length && !incoming?.length) return incoming ?? current
  const map = new Map<number, WallScheduleEntry>()
  for (const row of current || []) map.set(row.n, { ...row })
  for (const row of incoming || []) {
    const prev = map.get(row.n)
    map.set(row.n, prev ? { ...prev, ...row } : { ...row })
  }
  return [...map.values()].sort((a, b) => a.n - b.n)
}

function pickFloorplan(
  current: VdesignProject['floorplan'],
  incoming: VdesignProject['floorplan']
): VdesignProject['floorplan'] {
  const cw = current?.walls?.length ?? 0
  const iw = incoming?.walls?.length ?? 0
  // Prefer the richer geometry; equal → incoming (may include wall moves).
  if (iw > cw) return incoming
  if (cw > iw) return current
  return incoming ?? current
}

export interface PlanMergeResult {
  project: VdesignProject
  /** True when disk already had a plan and arrays/floorplan were combined. */
  merged: boolean
  /** Human-readable notes for logs/toasts. */
  notes: string[]
}

/**
 * Combine a stale-or-partial save with the on-disk latest so parallel agents
 * (theatre / stairs / gym) do not clobber each other's additive work.
 *
 * Additive unions: items, entrances, areas, floorFinishes.
 * wallSchedule: merge by wall # (incoming fields overlay).
 * floorplan: keep the version with more walls; tie → incoming.
 */
export function mergePlanProjects(
  disk: VdesignProject | null,
  incoming: VdesignProject
): PlanMergeResult {
  if (!disk?.floorplan?.walls?.length) {
    return { project: incoming, merged: false, notes: ['no disk plan — wrote incoming as-is'] }
  }

  const notes: string[] = []
  const items = unionByKey(disk.items, incoming.items, itemFingerprint)
  const entrances = unionByKey(
    disk.entrances as EntranceScheduleEntry[] | undefined,
    incoming.entrances,
    (e) => e.id || `n:${e.n}`
  )
  const areas = unionByKey(
    disk.areas as AreaLabel[] | undefined,
    incoming.areas,
    (a) => a.name
  )
  const floorFinishes = unionByKey(
    disk.floorFinishes as FloorFinishSpec[] | undefined,
    incoming.floorFinishes,
    (f) => f.area
  )
  const wallSchedule = mergeWallSchedule(disk.wallSchedule, incoming.wallSchedule)
  const floorplan = pickFloorplan(disk.floorplan, incoming.floorplan)

  if (items.length > (incoming.items?.length ?? 0)) {
    notes.push(`kept ${items.length - (incoming.items?.length ?? 0)} item(s) from disk`)
  }
  if (entrances.length > (incoming.entrances?.length ?? 0)) {
    notes.push(
      `kept ${entrances.length - (incoming.entrances?.length ?? 0)} entrance(s) from disk`
    )
  }
  if ((floorFinishes?.length ?? 0) > (incoming.floorFinishes?.length ?? 0)) {
    notes.push('kept floorFinishes from disk')
  }
  if ((disk.floorplan?.walls?.length ?? 0) > (incoming.floorplan?.walls?.length ?? 0)) {
    notes.push('kept richer floorplan from disk')
  }

  const project: VdesignProject = {
    ...disk,
    ...incoming,
    floorplan,
    items,
    entrances,
    areas,
    floorFinishes,
    wallSchedule,
    underlay: incoming.underlay ?? disk.underlay,
    meta: {
      ...disk.meta,
      ...incoming.meta
    }
  }

  return {
    project,
    merged: notes.length > 0 || items.length !== (incoming.items?.length ?? 0),
    notes: notes.length ? notes : ['merged with disk (no additive gaps)']
  }
}
