import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { SavedFloorplan } from '@blueprint3d/model/floorplan'
import type { SerializedItem } from '@blueprint3d/model/model'

/** On-disk / imported project format (extends Blueprint3D serialized room). */
export interface VdesignProject {
  floorplan: SavedFloorplan
  items: SerializedItem[]
  underlay?: UnderlayConfig
  /** Named zones drawn on the 2D plan */
  areas?: AreaLabel[]
  /** Wall schedule — numbers match 2D badges (1-based, JSON wall order) */
  wallSchedule?: WallScheduleEntry[]
  meta?: {
    name?: string
    address?: string
    level?: string
    notes?: string
  }
}

export interface WallScheduleEntry {
  n: number
  role: string
  /** Outer face length when known, e.g. 2'-6" */
  outerLength?: string | null
  /** Wall thickness when known, e.g. 8" */
  thickness?: string | null
  notes?: string
}

export interface SeedProjectInfo {
  id: string
  name: string
  address?: string
  level?: string
  /** Path under /public, e.g. /projects/2713-s-224th-basement/floorplan.json */
  path: string
}
