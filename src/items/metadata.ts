/** Meta data for items. */
export interface Metadata {
  /** Name of the item. */
  itemName?: string

  /** Translation key for the item name (i18n). */
  itemKey?: string

  /** Type of the item. */
  itemType?: number

  /** Url of the model. */
  modelUrl?: string

  /** Resizeable or not */
  resizable?: boolean

  /** Description of the item for AI understanding */
  description?: string

  /** Wall-hosted entrance kind (door | stairs) — see docs/entrance-editor.md */
  entranceKind?: 'door' | 'stairs'

  /** 1-based host wall number when placed as an entrance */
  hostWallN?: number
}

