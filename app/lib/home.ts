import type {
  VdesignHome,
  VdesignLevel,
  VdesignLevelPayload,
  VdesignProject
} from '@/types/project'

export const HOME_FORMAT = 'vdesign-home-v1' as const

export function isVdesignHome(data: unknown): data is VdesignHome {
  if (!data || typeof data !== 'object') return false
  const d = data as VdesignHome
  return (
    d.format === HOME_FORMAT &&
    Array.isArray(d.levels) &&
    d.levels.length > 0 &&
    typeof d.activeLevelId === 'string' &&
    typeof d.meta?.name === 'string'
  )
}

export function isLevelPayload(data: unknown): data is VdesignLevelPayload {
  if (!data || typeof data !== 'object') return false
  const d = data as VdesignLevelPayload
  return !!d.floorplan?.walls?.length && !!d.floorplan?.corners
}

/** Strip home/level chrome → canvas payload. */
export function levelToProject(
  level: VdesignLevel,
  homeMeta?: VdesignHome['meta']
): VdesignProject {
  return {
    floorplan: level.floorplan,
    items: level.items ?? [],
    underlay: level.underlay,
    areas: level.areas,
    setbacks: level.setbacks,
    entrances: level.entrances,
    floorFinishes: level.floorFinishes,
    wallSchedule: level.wallSchedule,
    meta: {
      name: homeMeta?.name,
      address: homeMeta?.address,
      notes: homeMeta?.notes,
      level: level.name,
      levelId: level.id
    }
  }
}

export function projectToLevelPayload(project: VdesignProject): VdesignLevelPayload {
  return {
    floorplan: project.floorplan,
    items: project.items ?? [],
    underlay: project.underlay,
    areas: project.areas,
    setbacks: project.setbacks,
    entrances: project.entrances,
    floorFinishes: project.floorFinishes,
    wallSchedule: project.wallSchedule
  }
}

/** Wrap a legacy single-level plan as a one-level home. */
export function wrapProjectAsHome(
  project: VdesignProject,
  opts?: { homeName?: string; levelId?: string; levelName?: string }
): VdesignHome {
  const levelName =
    opts?.levelName || project.meta?.level || project.meta?.name || 'Level 1'
  const levelId =
    opts?.levelId ||
    project.meta?.levelId ||
    slugifyLevelId(levelName)
  const homeName =
    opts?.homeName ||
    stripLevelSuffix(project.meta?.name || 'vdesign-home')

  const level: VdesignLevel = {
    id: levelId,
    name: levelName,
    order: 0,
    ...projectToLevelPayload(project)
  }

  return {
    format: HOME_FORMAT,
    meta: {
      name: homeName,
      address: project.meta?.address,
      notes: project.meta?.notes
    },
    activeLevelId: levelId,
    levels: [level]
  }
}

export function getActiveLevel(home: VdesignHome): VdesignLevel {
  const found = home.levels.find((l) => l.id === home.activeLevelId)
  if (found) return found
  return home.levels[0]
}

/** Patch one level into a home (replace by id; append if new). */
export function upsertLevel(
  home: VdesignHome,
  levelId: string,
  payload: VdesignLevelPayload,
  levelName?: string
): VdesignHome {
  const levels = home.levels.map((l) => ({ ...l }))
  const idx = levels.findIndex((l) => l.id === levelId)
  if (idx >= 0) {
    levels[idx] = {
      ...levels[idx],
      ...payload,
      id: levelId,
      name: levelName || levels[idx].name
    }
  } else {
    levels.push({
      id: levelId,
      name: levelName || levelId,
      order: levels.length,
      ...payload
    })
  }
  return {
    ...home,
    activeLevelId: levelId,
    levels
  }
}

export function slugifyLevelId(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'level'
  )
}

/** "2713-S-224th-Basement" → "2713-S-224th" */
export function stripLevelSuffix(name: string): string {
  return name
    .replace(
      /\s*[—–-]\s*(Basement|Backyard|Main|Second|Upstairs|Garage|Exterior)\s*$/i,
      ''
    )
    .replace(
      /-(Basement|Backyard|Main|Second|Upstairs|Garage|Exterior)$/i,
      ''
    )
    .trim() || name
}

/**
 * Parse repo/import JSON: home stays home; legacy project becomes a home.
 */
export function normalizeToHome(data: unknown, fallbackName = 'vdesign-home'): VdesignHome {
  if (isVdesignHome(data)) {
    const levels = [...data.levels].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
    )
    const active =
      levels.find((l) => l.id === data.activeLevelId)?.id ?? levels[0]?.id
    if (!active) throw new Error('Home has no levels')
    return { ...data, levels, activeLevelId: active }
  }
  if (isLevelPayload(data)) {
    return wrapProjectAsHome(data as VdesignProject, { homeName: fallbackName })
  }
  throw new Error('Invalid project: not a home or level floorplan')
}
