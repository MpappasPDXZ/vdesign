/**
 * vdesign core — Blueprint3D Modern ES6 module entry point
 * 2D/3D floor planner for dimensions and layout
 */

// Core modules
export * from './core/utils'
export * from './core/configuration'
export * from './core/dimensioning'
export * from './core/version'

// Model modules
export { Model } from './model/model'
export { Floorplan } from './model/floorplan'
export { Corner } from './model/corner'
export { Wall } from './model/wall'
export { Room } from './model/room'
export { HalfEdge } from './model/half_edge'
export { Scene } from './model/scene'

// Items modules
export { Item } from './items/item'
export { FloorItem } from './items/floor_item'
export { WallItem } from './items/wall_item'
export { InWallItem } from './items/in_wall_item'
export { OnFloorItem } from './items/on_floor_item'
export { InWallFloorItem } from './items/in_wall_floor_item'
export { WallFloorItem } from './items/wall_floor_item'
export { Factory } from './items/factory'

// Three.js modules
export { Main as ThreeMain } from './three/main'
export { Controller } from './three/controller'
export { Controls } from './three/controls'
export { Edge } from './three/edge'
export { Floor } from './three/floor'
export { FloorplanThree } from './three/floorplan'
export { HUD } from './three/hud'
export { Lights } from './three/lights'
export { Skybox } from './three/skybox'

// Floorplanner modules
export { Floorplanner } from './floorplanner/floorplanner'
export { FloorplannerView, floorplannerModes } from './floorplanner/floorplanner_view'
export type { UnderlayConfig } from './floorplanner/underlay'
export { defaultUnderlayOpacity } from './floorplanner/underlay'
export type { AreaLabel } from './floorplanner/area_label'
export type { ItemFootprint } from './floorplanner/item_footprint'
export type { OverlayKind, OverlayDescriptor, BlueprintOverlay } from './floorplanner/overlay'
export { blueprintFromUnderlay } from './floorplanner/overlay'

// Main Blueprint3D class
export { Blueprint3d, type Options } from './blueprint3d'
