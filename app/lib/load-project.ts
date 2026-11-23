import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import { defaultUnderlayOpacity } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { VdesignProject } from '@/types/project'

export function parseProjectJson(raw: string): VdesignProject {
  const data = JSON.parse(raw) as VdesignProject
  if (!data?.floorplan?.corners || !data?.floorplan?.walls) {
    throw new Error('Invalid project: missing floorplan.corners/walls')
  }
  if (!Array.isArray(data.items)) {
    data.items = []
  }
  return data
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
  return areas.filter((a) => a?.name && Number.isFinite(a.xCm) && Number.isFinite(a.yCm))
}
