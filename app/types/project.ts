import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type { SetbackSpec } from '@blueprint3d/floorplanner/setback'
import type { SavedFloorplan } from '@blueprint3d/model/floorplan'
import type { SerializedItem } from '@blueprint3d/model/model'

/**
 * One level’s drawable payload (walls, items, finishes…).
 * Same shape whether stored alone (legacy) or inside a home.
 */
export interface VdesignLevelPayload {
  floorplan: SavedFloorplan
  items: SerializedItem[]
  underlay?: UnderlayConfig
  /** Named zones drawn on the 2D plan */
  areas?: AreaLabel[]
  /**
   * Municipal setbacks drawn as dashed lines in blueprint mode
   * (e.g. 5′ E/W, 25′ from north neighbor).
   */
  setbacks?: SetbackSpec[]
  /** Wall schedule — numbers match 2D badges (1-based, JSON wall order) */
  wallSchedule?: WallScheduleEntry[]
  /** Wall-hosted entrances (doors, stair openings, …) */
  entrances?: EntranceScheduleEntry[]
  /**
   * Floor finishes keyed by area label name (e.g. "Gym").
   * Applied to the room whose polygon contains that area’s point.
   */
  floorFinishes?: FloorFinishSpec[]
}

/** Level row inside a home — id is stable for save/merge (e.g. "basement"). */
export interface VdesignLevel extends VdesignLevelPayload {
  id: string
  name: string
  order?: number
}

/**
 * One home = one address / git slug, many levels (basement, backyard, …).
 * Prefer this over separate plans/*-Basement.json + plans/*-Backyard.json.
 */
export interface VdesignHome {
  format: 'vdesign-home-v1'
  meta: {
    name: string
    address?: string
    notes?: string
  }
  activeLevelId: string
  levels: VdesignLevel[]
}

/**
 * Legacy single-level on-disk / editor working copy.
 * Editor still edits one level at a time as this shape; homes wrap levels.
 */
export interface VdesignProject extends VdesignLevelPayload {
  meta?: {
    name?: string
    address?: string
    level?: string
    levelId?: string
    notes?: string
  }
}

/** Axis-aligned floor patch in plan cm (center + size). Used when the area is not a closed room. */
export interface FloorFinishRectCm {
  /** Center X (plan cm) */
  x: number
  /** Center Z / plan Y (cm) */
  z: number
  width: number
  depth: number
}

/** Named-area floor finish (rubber, hardwood, …). */
export interface FloorFinishSpec {
  area: string
  url: string
  /** Texture repeat scale in cm (smaller → denser pattern). */
  scale: number
  notes?: string
  /**
   * Optional explicit floor patch. Required for open bays (gym→hall with no door):
   * room detection only finds closed wall cycles, so area labels alone never get a mesh.
   */
  rectCm?: FloorFinishRectCm
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
  /** Display summary, e.g. "Basement · Backyard" */
  level?: string
  /** Path under /public (home or legacy level JSON) */
  path: string
}
