/** App shell view: editable plan, blueprint presentation, or 3D. */
export type ViewMode = '2d' | '3d' | 'blueprint'

export function isPlanView(mode: ViewMode): boolean {
  return mode === '2d' || mode === 'blueprint'
}
