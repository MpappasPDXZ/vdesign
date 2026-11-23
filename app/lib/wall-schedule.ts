import type { WallScheduleEntry } from '@/types/project'

/** Insert a schedule row after wall number `afterN` (1-based). Use 0 to insert as #1. Renumbers. */
export function insertWallScheduleEntry(
  schedule: WallScheduleEntry[],
  afterN: number,
  entry: Omit<WallScheduleEntry, 'n'>
): WallScheduleEntry[] {
  const sorted = [...schedule].sort((a, b) => a.n - b.n)
  const insertAt = Math.max(0, Math.min(sorted.length, afterN))
  const next: WallScheduleEntry[] = [
    ...sorted.slice(0, insertAt),
    { ...entry, n: insertAt + 1 },
    ...sorted.slice(insertAt)
  ]
  return next.map((e, i) => ({ ...e, n: i + 1 }))
}
