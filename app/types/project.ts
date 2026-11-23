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
  /** Wall-hosted entrances (doors, stair openings, …) */
  entrances?: EntranceScheduleEntry[]
  meta?: {
    name?: string
    address?: string
    level?: string
    notes?: string
  }
}

/** How an inch value was derived (ft+in sum) — audit trail, not a second length field. */
export interface InchMeasurementLineage {
  lines: string[]
  totalInches: number
}

/**
 * Wall-hosted openings. Not “door-only” — stairs (and later gates) are entrances too.
 * See docs/entrance-editor.md.
 */
export type EntranceKind = 'door' | 'stairs'

/** Persisted entrance row — host wall required. */
export interface EntranceScheduleEntry {
  id: string
  n: number
  kind: EntranceKind
  /** Host wall # (1-based schedule) */
  wallN: number
  name?: string | null
  /** Inches along wall from tip */
  offsetInches?: number
  fromTip?: 'N' | 'E' | 'S' | 'W' | string
  widthInches?: number
  heightInches?: number
  sillInches?: number
  widthLineage?: InchMeasurementLineage | null
  heightLineage?: InchMeasurementLineage | null
  notes?: string
}

/**
 * Persisted wall row. Canonical Connect/Offset keys only — see docs/wall-editor.md.
 * Do not add schedule properties without a field→function row there.
 */
export interface WallScheduleEntry {
  n: number
  role: string
  name?: string | null
  outerLength?: string | null
  thickness?: string | null
  wallType?: string | null
  exposure?: string | null
  notes?: string

  /** Connect host wall # */
  connectsToWall?: number
  /** Host tip: N/E/S/W (legacy top/bottom accepted on read) */
  connectsAt?: 'top' | 'bottom' | 'N' | 'E' | 'S' | 'W' | string
  /** Start→finish after tip join */
  extends?: 'north' | 'south' | 'east' | 'west' | string

  /** Mid-span Offset distance (inches) — sole offset key */
  offsetInches?: number
  /** Mid-span Offset direction */
  offsetDir?: 'N' | 'E' | 'S' | 'W' | string

  /** Carpenter-square ft+in sum for length — persist on Use sum + Apply */
  lengthLineage?: InchMeasurementLineage | null
  /** Carpenter-square sum for thickness */
  thicknessLineage?: InchMeasurementLineage | null
  /** Carpenter-square sum for Offset distance */
  offsetLineage?: InchMeasurementLineage | null

  /** @deprecated Read-only migrate → connectsToWall */
  connectsTo?: number
  /** @deprecated Read-only migrate → offsetInches when offsetInches absent */
  fromEndInches?: number
  /** @deprecated Read-only migrate → offsetInches */
  fromEndIn?: number
  /** @deprecated Read-only migrate → offsetInches */
  fromTopIn?: number
  /** @deprecated Infer span from `extends` */
  orientation?: string
}

export interface SeedProjectInfo {
  id: string
  name: string
  address?: string
  level?: string
  /** Path under /public, e.g. /projects/2713-s-224th-basement/floorplan.json */
  path: string
}
