import { Model } from './model/model'
import { Floorplanner, type PlanHit } from './floorplanner/floorplanner'
import type { Item } from './items/item'
import { Main } from './three/main'
import { WallItem } from './items/wall_item'
import type { ItemFootprint } from './floorplanner/item_footprint'

/** Startup options. */
export interface Options {
  /** */
  widget?: boolean

  /** */
  threeElement?: string

  /** */
  floorplannerElement?: string

  /** The texture directory. */
  textureDir?: string

  /** Enable/disable wheel zoom (default: true). Set to false for logged-out users to allow page scroll. */
  enableWheelZoom?: boolean

  /** Enable continuous rotation even after user interaction (default: false). */
  alwaysSpin?: boolean
}

/** Blueprint3D core application. */
export class Blueprint3d {
  public model: Model

  public three: Main

  public floorplanner?: Floorplanner

  /** Creates an instance.
   * @param options The initialization options.
   */
  constructor(options: Options) {
    this.model = new Model(options.textureDir || '')
    this.three = new Main(this.model, options.threeElement || document.body, undefined, {
      enableWheelZoom: options.enableWheelZoom ?? true,
      alwaysSpin: options.alwaysSpin ?? false
    })

    if (!options.widget) {
      this.floorplanner = new Floorplanner(options.floorplannerElement || '', this.model.floorplan)
      this.floorplanner.setItemFootprintProvider(() => this.collectItemFootprints())
      this.floorplanner.setPlanHitTester((x, z, r) => this.hitTestPlan(x, z, r))
      // Items load async after plan JSON — refresh footprints as each mesh arrives.
      this.model.scene.itemLoadedCallbacks.add(() => {
        this.floorplanner?.redraw()
      })
    } else {
      this.three.getController().enabled = false
    }
  }

  /**
   * Non-wall scene items as 2D footprints (skips doors/stairs/wall-hung).
   * Drops giant shells (roofs, pads, aprons) that would bury fixtures on the plan.
   */
  private planFootprintItems(): Item[] {
    return this.model.scene
      .getItems()
      .filter((item) => !(item instanceof WallItem))
      .filter((item) =>
        this.isPlanFixtureFootprint(item.metadata.itemName || '', item.getWidth(), item.getDepth())
      )
  }

  private collectItemFootprints(): ItemFootprint[] {
    return this.planFootprintItems().map((item) => {
      const label = item.metadata.itemName || ''
      return {
        xCm: item.position.x,
        zCm: item.position.z,
        widthCm: item.getWidth(),
        depthCm: item.getDepth(),
        rotationY: item.rotation.y,
        label,
        ref: item,
        kind: this.footprintKind(label)
      }
    })
  }

  /**
   * Edit-mode click: nearest wall-hosted entrance badge first, else the smallest
   * floor-item footprint under the cursor (same rotation/size as drawn on the plan).
   */
  private hitTestPlan(xCm: number, zCm: number, badgeRadiusCm: number): PlanHit | null {
    let entrance: Item | null = null
    let bestD = badgeRadiusCm
    for (const wall of this.model.floorplan.getWalls()) {
      for (const item of wall.items || []) {
        const pos = this.floorplanner
          ? this.floorplanner.entranceBadgeCm(wall, item)
          : { x: item.position.x, z: item.position.z }
        const d = Math.hypot(pos.x - xCm, pos.z - zCm)
        if (d <= bestD) {
          bestD = d
          entrance = item
        }
      }
    }
    if (entrance) return { kind: 'entrance', item: entrance }

    const showPlants = this.floorplanner?.getShowLandscapingMovable() !== false
    let best: Item | null = null
    let bestArea = Infinity
    for (const item of this.planFootprintItems()) {
      if (!showPlants && this.footprintKind(item.metadata.itemName || '') === 'plant') continue
      // Point → footprint local space (Three Y rotation; plan canvas negates it, so inverse is +rotation)
      const dx = xCm - item.position.x
      const dz = zCm - item.position.z
      const c = Math.cos(item.rotation.y)
      const s = Math.sin(item.rotation.y)
      const lx = dx * c - dz * s
      const lz = dx * s + dz * c
      const w = item.getWidth()
      const dpt = item.getDepth()
      if (Math.abs(lx) <= w / 2 && Math.abs(lz) <= dpt / 2) {
        const area = w * dpt
        if (area < bestArea) {
          bestArea = area
          best = item
        }
      }
    }
    return best ? { kind: 'item', item: best } : null
  }

  private footprintKind(name: string): 'plant' | 'furniture' | 'structure' | 'framing' {
    // Green = landscaping OR movable. Blue = fixed structure / framing.
    if (this.isLandscapingOrMovable(name)) return 'plant'
    if (this.isFramingFootprint(name)) return 'framing'
    return 'structure'
  }

  /**
   * Green plan ink — landscaping and anything the owner can rearrange
   * (planters, rocks, loungers, chairs, stools, tables, …).
   */
  private isLandscapingOrMovable(name: string): boolean {
    if (/\bplanters?\b/i.test(name)) return true
    // Do not treat "mulch bed" as a bedroom bed — still landscaping via mulch.
    if (/\b(mulch|flower|garden|planting)\s+bed\b/i.test(name)) return true
    return /\b(tree|pine|oak|maple|palm|cypress|shrub|bush|hedge|plant|lawn|grass|rock|boulder|mulch|lounge|lounger|chaise|chair|stool|sofa|couch|loveseat|settee|table|desk|ottoman|bench|recliner|sectional|armchair|bar.?stool)\b/i.test(
      name
    )
  }

  /**
   * Structural posts / columns / beams for the construction plan.
   * Skips equipment (gym rack posts) — those aren't building framing.
   */
  private isFramingFootprint(name: string): boolean {
    if (/\b(rack|gym|hf)\b/i.test(name)) return false
    return /\b(column|deck post|frame post|pier|footing|post|beam)\b/i.test(name)
  }

  /**
   * Keep fixtures + framing; skip shells that flood the 2D plan
   * (roofs, pads, joists, treads — denser framing stays off the space plan).
   */
  private isPlanFixtureFootprint(name: string, widthCm: number, depthCm: number): boolean {
    if (!(widthCm > 1) || !(depthCm > 1)) return false
    const area = widthCm * depthCm
    // ~50 sq ft — unnamed large shells (pads/roofs) that bury fixtures
    if (area > 465_000) return false
    const n = name.toLowerCase()
    // Framing posts/columns/beams are drawn as plan symbols — allow through.
    if (this.isFramingFootprint(name)) return true
    // PH concrete pad is the foundation under enclosed + open bar — show on plan.
    if (/^ph concrete pad$/i.test(name.trim())) return true
    if (
      /\b(roof|cover|apron|deck floor|deck cover|concrete pad|pad slab|turf|gravel|sod|fence|joist|stringer|truss|tread|mulch|coping)\b/.test(
        n
      )
    ) {
      return false
    }
    // Water plate is the usable pool outline — skip duplicate basin shells.
    if (/^pool water$/i.test(name.trim())) return true
    if (/\bpool\b/i.test(n) && /\b(basin|shell|plaster)\b/.test(n)) return false
    // Counter / bar top sits on the island — one footprint only (avoid double bars).
    if (/\b(bar top|countertop|counter top)\b/.test(n)) return false
    return true
  }
}
