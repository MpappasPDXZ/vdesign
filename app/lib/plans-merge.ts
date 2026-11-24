import type {
  EntranceScheduleEntry,
  FloorFinishSpec,
  VdesignHome,
  VdesignLevel,
  VdesignLevelPayload,
  VdesignProject,
  WallScheduleEntry
} from '@/types/project'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { SerializedItem } from '@blueprint3d/model/model'
import { getActiveLevel, levelToProject, projectToLevelPayload, upsertLevel } from '@/lib/home'

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

/** Rough level family from wall names — blocks basement↔backyard finish clobber. */
function wallNameFamily(
  walls: VdesignProject['floorplan'] extends infer F
    ? F extends { walls?: Array<{ name?: string }> }
      ? F['walls']
      : never
    : never
): 'basement' | 'backyard' | 'other' | null {
  if (!walls?.length) return null
  let basement = 0
  let backyard = 0
  for (const w of walls) {
    const n = (w.name || '').toLowerCase()
    if (n.startsWith('basement') || n.includes('turf north') || n.includes('batting')) {
      basement += 1
    } else if (
      n.startsWith('backyard') ||
      n.startsWith('pool house') ||
      n.includes('property fence') ||
      n.includes('covered deck')
    ) {
      backyard += 1
    }
  }
  if (basement === 0 && backyard === 0) return 'other'
  if (basement > backyard) return 'basement'
  if (backyard > basement) return 'backyard'
  return 'other'
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

  const diskFamily = wallNameFamily(disk.floorplan.walls)
  const incomingFamily = wallNameFamily(incoming.floorplan?.walls)
  // Never blend basement grass/turf (or patio) into the other level's geometry.
  if (
    diskFamily &&
    incomingFamily &&
    diskFamily !== 'other' &&
    incomingFamily !== 'other' &&
    diskFamily !== incomingFamily
  ) {
    return {
      project: disk,
      merged: false,
      notes: [
        `refused cross-level merge (${incomingFamily} into ${diskFamily}) — kept disk level`
      ]
    }
  }

  const notes: string[] = []
  const wallSchedule = mergeWallSchedule(disk.wallSchedule, incoming.wallSchedule)
  const floorplan = pickFloorplan(disk.floorplan, incoming.floorplan)
  const keptDiskFloorplan =
    floorplan === disk.floorplan &&
    (disk.floorplan?.walls?.length ?? 0) > (incoming.floorplan?.walls?.length ?? 0)

  // Richer disk geometry + thinner incoming usually means a wrong/stale save (e.g. backyard
  // finishes posted onto basement). Keep disk rooms/finishes; still union additive items.
  const items = unionByKey(disk.items, incoming.items, itemFingerprint)
  const entrances = unionByKey(
    disk.entrances as EntranceScheduleEntry[] | undefined,
    incoming.entrances,
    (e) => e.id || `n:${e.n}`
  )
  const areas = keptDiskFloorplan
    ? (disk.areas as AreaLabel[] | undefined) ?? incoming.areas
    : unionByKey(disk.areas as AreaLabel[] | undefined, incoming.areas, (a) => a.name)
  const floorFinishes = keptDiskFloorplan
    ? (disk.floorFinishes as FloorFinishSpec[] | undefined) ?? incoming.floorFinishes
    : unionByKey(
        disk.floorFinishes as FloorFinishSpec[] | undefined,
        incoming.floorFinishes,
        (f) => f.area
      )

  if (items.length > (incoming.items?.length ?? 0)) {
    notes.push(`kept ${items.length - (incoming.items?.length ?? 0)} item(s) from disk`)
  }
  if (entrances.length > (incoming.entrances?.length ?? 0)) {
    notes.push(
      `kept ${entrances.length - (incoming.entrances?.length ?? 0)} entrance(s) from disk`
    )
  }
  if (keptDiskFloorplan) {
    notes.push('kept disk floorFinishes/areas with richer floorplan')
  } else if ((floorFinishes?.length ?? 0) > (incoming.floorFinishes?.length ?? 0)) {
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
    // Incoming setbacks win when provided; otherwise keep disk.
    setbacks: incoming.setbacks?.length ? incoming.setbacks : disk.setbacks,
    floorFinishes,
    wallSchedule,
    underlay: keptDiskFloorplan
      ? disk.underlay
      : (incoming.underlay ?? disk.underlay),
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

export interface HomeMergeResult {
  home: VdesignHome
  merged: boolean
  notes: string[]
}

/**
 * Merge one level into a home. Other levels on disk are preserved untouched.
 */
export function mergeHomeLevel(
  disk: VdesignHome,
  levelId: string,
  incomingLevel: VdesignLevelPayload,
  levelName?: string
): HomeMergeResult {
  const existing = disk.levels.find((l) => l.id === levelId)
  if (!existing) {
    const home = upsertLevel(disk, levelId, incomingLevel, levelName)
    return { home, merged: false, notes: [`added new level ${levelId}`] }
  }

  const diskProject = levelToProject(existing, disk.meta)
  const incomingProject: VdesignProject = {
    ...incomingLevel,
    meta: { level: levelName || existing.name, levelId }
  }
  const { project, merged, notes } = mergePlanProjects(diskProject, incomingProject)
  const home = upsertLevel(disk, levelId, projectToLevelPayload(project), levelName || existing.name)
  return {
    home: { ...home, activeLevelId: levelId },
    merged,
    notes: notes.map((n) => `level ${levelId}: ${n}`)
  }
}

/** Ensure level list entries stay sorted for stable UI. */
export function sortHomeLevels(home: VdesignHome): VdesignHome {
  const levels = [...home.levels].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
  )
  return { ...home, levels }
}

export function activeLevelWallCount(home: VdesignHome): number {
  return getActiveLevel(home).floorplan?.walls?.length ?? 0
}

export type { VdesignLevel }
