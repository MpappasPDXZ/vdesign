/**
 * Room Type Enumeration
 * Defines all supported room types for Feng Shui analysis
 * Note: living_room uses underscore for database compatibility
 */
export enum RoomType {
  BEDROOM = 'bedroom',
  LIVING_ROOM = 'living-room',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  OFFICE = 'office',
  /** Home level — outdoor yard (card badge / save tag, not a Feng Shui room). */
  BACKYARD = 'backyard',
  /** Home level — basement / lower level (card badge; label “Downstairs”). */
  DOWNSTAIRS = 'downstairs',
  /** Home level — upper / second floor. */
  UPSTAIRS = 'upstairs'
}

/** Room types offered in New/Save/Template pickers (excludes home-level tags). */
export const SELECTABLE_ROOM_TYPES: RoomType[] = [
  RoomType.BEDROOM,
  RoomType.LIVING_ROOM,
  RoomType.KITCHEN,
  RoomType.BATHROOM,
  RoomType.OFFICE
]

/**
 * Map a home level id/name to the card badge room type.
 * basement → downstairs; backyard → backyard; else bedroom default.
 */
export function roomTypeForLevel(
  levelId?: string | null,
  levelName?: string | null
): RoomType {
  const id = (levelId || '').toLowerCase()
  const name = (levelName || '').toLowerCase()
  if (id === 'backyard' || name.includes('backyard')) return RoomType.BACKYARD
  if (
    id === 'basement' ||
    id === 'downstairs' ||
    name.includes('basement') ||
    name.includes('downstairs')
  ) {
    return RoomType.DOWNSTAIRS
  }
  if (
    id === 'upstairs' ||
    id === 'second' ||
    name.includes('upstairs') ||
    name.includes('second')
  ) {
    return RoomType.UPSTAIRS
  }
  if (id === 'main' || name.includes('main')) return RoomType.LIVING_ROOM
  return RoomType.BEDROOM
}

/**
 * Type guard to check if a string is a valid RoomType
 */
export function isValidRoomType(value: string): value is RoomType {
  return Object.values(RoomType).includes(value as RoomType)
}

/**
 * Mode Type Enumeration
 * Defines special modes for Blueprint3D
 */
export enum SpecialMode {
  GENERATOR = 'generator',
  WEALTH_CORNER = 'wealth-corner'
}

export enum StandardMode {
  STANDARD = 'standard'
}

/**
 * Combined type for all possible modes (room types + special modes)
 */
export type AppMode = RoomType | SpecialMode

/**
 * Room type display labels
 */
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.BEDROOM]: 'Bedroom',
  [RoomType.LIVING_ROOM]: 'Living Room',
  [RoomType.KITCHEN]: 'Kitchen',
  [RoomType.BATHROOM]: 'Bathroom',
  [RoomType.OFFICE]: 'Office',
  [RoomType.BACKYARD]: 'Backyard',
  [RoomType.DOWNSTAIRS]: 'Downstairs',
  [RoomType.UPSTAIRS]: 'Upstairs'
}
