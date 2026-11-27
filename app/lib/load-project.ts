import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import { defaultUnderlayOpacity } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { VdesignHome, VdesignProject } from '@/types/project'
import {
  getActiveLevel,
  isVdesignHome,
  levelToProject,
  normalizeToHome
} from '@/lib/home'

/** Parse a level payload or a home (returns the active level as a project). */
export function parseProjectJson(raw: string): VdesignProject {
  const data = JSON.parse(raw) as unknown
  if (isVdesignHome(data)) {
    return levelToProject(getActiveLevel(data), data.meta)
  }
  const project = data as VdesignProject
  if (!project?.floorplan?.corners || !project?.floorplan?.walls) {
    throw new Error('Invalid project: missing floorplan.corners/walls')
  }
  if (!Array.isArray(project.items)) {
    project.items = []
  }
  return project
}

/** Parse home or legacy; always returns a VdesignHome. */
export function parseHomeJson(raw: string, fallbackName?: string): VdesignHome {
  return normalizeToHome(JSON.parse(raw), fallbackName)
}

/** Serialized string accepted by model.loadSerialized */
export function toSerializedRoom(project: VdesignProject): string {
  return JSON.stringify({
    floorplan: project.floorplan,
    items: project.items ?? []
  })
}

export function normalizeUnderlay(
  underlay: UnderlayConfig | undefined
): UnderlayConfig | null {
  if (!underlay?.url) return null
  return {
    url: underlay.url,
    opacity: underlay.opacity ?? defaultUnderlayOpacity,
    xCm: underlay.xCm ?? 0,
    yCm: underlay.yCm ?? 0,
    widthCm: underlay.widthCm,
    heightCm: underlay.heightCm
  }
}

export function normalizeAreas(areas: AreaLabel[] | undefined): AreaLabel[] {
  if (!Array.isArray(areas)) return []
  return areas
    .filter((a) => a?.name && Number.isFinite(a.xCm) && Number.isFinite(a.yCm))
    .map((a) => {
      const out: AreaLabel = { name: a.name, xCm: a.xCm, yCm: a.yCm }
      if (typeof a.notes === 'string' && a.notes) out.notes = a.notes
      if (a.area_floor_invisible === true || a.area_floor_invisible === 1) {
        out.area_floor_invisible = true
      } else if (a.area_floor_invisible === false || a.area_floor_invisible === 0) {
        out.area_floor_invisible = false
      }
      const r = a.rectCm
      if (
        r &&
        Number.isFinite(r.x) &&
        Number.isFinite(r.z) &&
        Number.isFinite(r.width) &&
        Number.isFinite(r.depth) &&
        r.width > 0 &&
        r.depth > 0
      ) {
        out.rectCm = { x: r.x, z: r.z, width: r.width, depth: r.depth }
      }
      return out
    })
}

const SETBACK_EDGES = new Set(['north', 'south', 'east', 'west'])

/** Municipal setback specs for blueprint dashed lines. */
export function normalizeSetbacks(
  setbacks: import('@/types/project').VdesignLevelPayload['setbacks']
): import('@blueprint3d/floorplanner/setback').SetbackSpec[] {
  if (!Array.isArray(setbacks)) return []
  return setbacks.filter(
    (s) =>
      s &&
      SETBACK_EDGES.has(s.from) &&
      typeof s.feet === 'number' &&
      Number.isFinite(s.feet) &&
      s.feet > 0
  )
}
