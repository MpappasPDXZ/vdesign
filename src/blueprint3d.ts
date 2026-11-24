import { Model } from './model/model'
import { Floorplanner } from './floorplanner/floorplanner'
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
    } else {
      this.three.getController().enabled = false
    }
  }

  /** Non-wall scene items as 2D footprints (skips doors/stairs/wall-hung). */
  private collectItemFootprints(): ItemFootprint[] {
    return this.model.scene
      .getItems()
      .filter((item) => !(item instanceof WallItem))
      .map((item) => ({
        xCm: item.position.x,
        zCm: item.position.z,
        widthCm: item.getWidth(),
        depthCm: item.getDepth(),
        rotationY: item.rotation.y,
        label: item.metadata.itemName || ''
      }))
  }
}
