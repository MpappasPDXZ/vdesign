import * as THREE from 'three'
import { Utils } from '../core/utils'
import { EventEmitter } from '../core/events'
import { Factory } from '../items/factory'
import type { Item } from '../items/item'
import type { Model } from './model'
import { JSONLoader } from '../loaders/JSONLoader'
import { GLBLoader } from '../loaders/GLBLoader'
import { ProceduralLoader, isProceduralUrl } from '../loaders/ProceduralLoader'

/**
 * The Scene is a manager of Items and also links to a ThreeJS scene.
 */
export class Scene {
  /** The associated ThreeJS scene. */
  private scene: THREE.Scene

  /** */
  private items: Item[] = []

  /** */
  public needsUpdate = false

  /** The Json loader. */
  private jsonLoader: JSONLoader

  /** The GLB loader. */
  private glbLoader: GLBLoader

  /** Procedural placeholder geometry (venue / layout objects). */
  private proceduralLoader: ProceduralLoader

  /** */
  public itemLoadingCallbacks = new EventEmitter<void>()

  /** Item */
  public itemLoadedCallbacks = new EventEmitter<Item>()

  /** Item */
  public itemRemovedCallbacks = new EventEmitter<Item>()

  /** Item Load Error */
  public itemLoadErrorCallbacks = new EventEmitter<{ fileName: string; error: any }>()

  /**
   * Constructs a scene.
   * @param model The associated model.
   * @param textureDir The directory from which to load the textures.
   */
  constructor(
    private model: Model,
    // @ts-ignore - textureDir is declared but not used, keeping for future use
    private textureDir: string
  ) {
    this.scene = new THREE.Scene()

    // init item loaders
    // Use custom JSONLoader for old three.js JSON format models
    this.jsonLoader = new JSONLoader()
    // Use GLBLoader for modern GLB/GLTF models
    this.glbLoader = new GLBLoader()
    this.proceduralLoader = new ProceduralLoader()
  }

  /** Adds a non-item, basically a mesh, to the scene.
   * @param mesh The mesh to be added.
   */
  public add(mesh: THREE.Mesh): void {
    this.scene.add(mesh)
  }

  /** Removes a non-item, basically a mesh, from the scene.
   * @param mesh The mesh to be removed.
   */
  public remove(mesh: THREE.Mesh): void {
    this.scene.remove(mesh)
    if (this.items.includes(mesh as unknown as Item)) {
      Utils.removeValue(this.items, mesh as unknown as Item)
    }
  }

  /** Gets the scene.
   * @returns The scene.
   */
  public getScene(): THREE.Scene {
    return this.scene
  }

  /** Gets the items.
   * @returns The items.
   */
  public getItems(): Item[] {
    return this.items
  }

  /** Gets the count of items.
   * @returns The count.
   */
  public itemCount(): number {
    return this.items.length
  }

  /** Removes all items. */
  public clearItems(): void {
    this.items.forEach((item) => {
      this.removeItem(item, true)
    })
    this.items = []
  }

  /**
   * Removes an item.
   * @param item The item to be removed.
   * @param dontRemove If not set, also remove the item from the items list.
   */
  public removeItem(item: Item, dontRemove: boolean = false): void {
    // use this for item meshes
    this.itemRemovedCallbacks.fire(item)
    item.removed()
    this.scene.remove(item)
    if (!dontRemove) {
      Utils.removeValue(this.items, item)
    }
  }

  /**
   * Creates an item and adds it to the scene.
   * @param itemType The type of the item given by an enumerator.
   * @param fileName The name of the file to load.
   * @param metadata TODO
   * @param position The initial position.
   * @param rotation The initial rotation around the y axis.
   * @param scale The initial scaling.
   * @param fixed True if fixed.
   */
  public addItem(
    itemType: number,
    fileName: string,
    metadata: Record<string, unknown>,
    position?: THREE.Vector3,
    rotation?: number,
    scale?: THREE.Vector3,
    fixed?: boolean
  ): void {
    itemType = itemType || 1
    const scope = this
    const loaderCallback = (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => {

      // Ensure materials are properly configured for visibility
      materials.forEach((mat) => {
        // Make sure materials are double-sided to avoid backface culling issues
        mat.side = THREE.DoubleSide
        mat.depthTest = true
        // Transparent glass must keep depthWrite:false — forcing true fills panes solid.
        if (!mat.transparent) {
          mat.depthWrite = true
        }
      })

      // Single-material meshes must not use a material[] — Three r181 skips
      // drawing array materials when geometry has no groups (procedural stairs/boxes).
      const materialForMesh: THREE.Material | THREE.Material[] =
        materials.length === 1 ? materials[0] : materials
      if (materials.length === 1 && geometry.groups.length === 0) {
        const vertCount = geometry.getAttribute('position')?.count ?? 0
        if (vertCount > 0) geometry.addGroup(0, vertCount, 0)
      }

      // Custom JSONLoader already returns BufferGeometry
      const item = new (Factory.getClass(itemType))(
        scope.model,
        metadata,
        geometry,
        materialForMesh,
        position,
        rotation,
        scale
      )
      item.fixed = fixed || false
      scope.items.push(item)
      scope.add(item)

      item.initObject()
      scope.itemLoadedCallbacks.fire(item)
    }

    this.itemLoadingCallbacks.fire()

    // Determine which loader to use based on URL / file extension
    const loader = isProceduralUrl(fileName)
      ? this.proceduralLoader
      : fileName.toLowerCase().endsWith('.glb') || fileName.toLowerCase().endsWith('.gltf')
        ? this.glbLoader
        : this.jsonLoader

    // Wrap in try-catch for better error handling
    try {
      loader.load(
        fileName,
        loaderCallback,
        undefined, // TODO_Ekki
        (error: any) => {
          console.error('Error loading model:', fileName, error)
          this.itemLoadErrorCallbacks.fire({ fileName, error })
        }
      )
    } catch (e) {
      console.error('Exception loading model:', e)
      this.itemLoadErrorCallbacks.fire({ fileName, error: e })
    }
  }
}
