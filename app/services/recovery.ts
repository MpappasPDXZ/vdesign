/**
 * Crash/session recovery for open floorplans.
 * Writes to localStorage (fast) and keeps a downloadable JSON snapshot.
 */
import type { VdesignProject } from '@/types/project'

const RECOVERY_KEY = 'vdesign-plan-recovery'
const RECOVERY_META_KEY = 'vdesign-plan-recovery-meta'

export interface RecoveryMeta {
  savedAt: number
  name?: string
  id?: string
}

export function writeRecoverySnapshot(
  project: VdesignProject,
  meta?: { name?: string; id?: string }
): void {
  if (typeof window === 'undefined') return
  try {
    const payload = JSON.stringify(project)
    localStorage.setItem(RECOVERY_KEY, payload)
    const info: RecoveryMeta = {
      savedAt: Date.now(),
      name: meta?.name,
      id: meta?.id
    }
    localStorage.setItem(RECOVERY_META_KEY, JSON.stringify(info))
  } catch (error) {
    console.warn('[recovery] Failed to write snapshot:', error)
  }
}

export function readRecoverySnapshot(): {
  project: VdesignProject
  meta: RecoveryMeta | null
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RECOVERY_KEY)
    if (!raw) return null
    const project = JSON.parse(raw) as VdesignProject
    if (!project?.floorplan?.corners || !project?.floorplan?.walls) return null
    const metaRaw = localStorage.getItem(RECOVERY_META_KEY)
    const meta = metaRaw ? (JSON.parse(metaRaw) as RecoveryMeta) : null
    return { project, meta }
  } catch {
    return null
  }
}

export function clearRecoverySnapshot(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECOVERY_KEY)
  localStorage.removeItem(RECOVERY_META_KEY)
}

/** Trigger a JSON file download the user can keep outside the browser. */
export function downloadProjectJson(project: VdesignProject, filename?: string): void {
  const name =
    filename ||
    `${(project.meta?.name || 'vdesign-plan').replace(/[^\w.-]+/g, '-').toLowerCase()}.json`
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name.endsWith('.json') ? name : `${name}.json`
  a.click()
  URL.revokeObjectURL(url)
}
