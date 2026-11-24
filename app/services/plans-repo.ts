import type { VdesignHome, VdesignProject } from '@/types/project'

export interface RepoSaveResult {
  ok: boolean
  slug: string
  relativeLatest: string
  relativeVersion: string
  walls: number
  mtimeMs?: number
  merged?: boolean
  mergeNotes?: string[]
  levelId?: string
  home?: {
    format: string
    meta: VdesignHome['meta']
    activeLevelId: string
    levels: Array<{ id: string; name: string; order?: number; walls: number }>
  }
  error?: string
}

export interface RepoLoadResult {
  project: VdesignProject
  home: VdesignHome
  slug: string
  relativePath: string
  mtimeMs: number
  levelId: string
}

/** Persist active level into the home plans/{slug}.json via Next API. */
export async function saveProjectToRepo(opts: {
  project: VdesignProject
  name: string
  id?: string
  levelId?: string
  levelName?: string
  /** From last Reload — lets server skip merge when still current. */
  baseMtimeMs?: number
  /** Default true on server. Pass false only for intentional full replace. */
  merge?: boolean
}): Promise<RepoSaveResult> {
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: opts.project,
      name: opts.name,
      id: opts.id,
      levelId: opts.levelId,
      levelName: opts.levelName,
      baseMtimeMs: opts.baseMtimeMs,
      merge: opts.merge
    })
  })
  const data = (await res.json().catch(() => ({}))) as RepoSaveResult & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}

/** Load the home (or named) plan JSON from `plans/`. */
export async function loadLatestProjectFromRepo(slug?: string): Promise<RepoLoadResult> {
  const q = new URLSearchParams({ latest: '1' })
  if (slug) q.set('slug', slug)
  const res = await fetch(`/api/plans?${q}`, { cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    project?: VdesignProject
    home?: VdesignHome
    slug?: string
    relativePath?: string
    mtimeMs?: number
    levelId?: string
  }
  if (!res.ok || !data.project || !data.slug || !data.relativePath || !data.home) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return {
    project: data.project,
    home: data.home,
    slug: data.slug,
    relativePath: data.relativePath,
    mtimeMs: data.mtimeMs ?? 0,
    levelId: data.levelId || data.home.activeLevelId
  }
}
