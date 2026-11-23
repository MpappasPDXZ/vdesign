import type { UnderlayConfig } from './underlay'

/** Built-in overlay kinds drawn in the 2D editor. */
export type OverlayKind = 'blueprint' | 'wallNumbers' | 'areaLabels'

export interface OverlayDescriptor {
  id: string
  kind: OverlayKind
  /** Display name */
  label: string
  visible: boolean
  /** 0–1 — used by image overlays (blueprint) */
  opacity?: number
}

/** Blueprint image is one overlay kind (backed by UnderlayConfig). */
export type BlueprintOverlay = UnderlayConfig & {
  kind: 'blueprint'
  id?: string
  label?: string
  visible?: boolean
}

export function blueprintFromUnderlay(
  underlay: UnderlayConfig,
  opts?: { id?: string; label?: string; visible?: boolean }
): BlueprintOverlay {
  return {
    kind: 'blueprint',
    id: opts?.id ?? 'blueprint',
    label: opts?.label ?? 'Blueprint',
    visible: opts?.visible ?? true,
    ...underlay
  }
}
