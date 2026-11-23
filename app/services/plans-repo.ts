import type { VdesignProject } from '@/types/project'

export interface RepoSaveResult {
  ok: boolean
  slug: string
  relativeLatest: string
  relativeVersion: string
  walls: number
  error?: string
}

/** Persist current project into the git repo `plans/` via Next API. */
export async function saveProjectToRepo(opts: {
  project: VdesignProject
  name: string
  id?: string
}): Promise<RepoSaveResult> {
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: opts.project,
      name: opts.name,
      id: opts.id
    })
  })
  const data = (await res.json().catch(() => ({}))) as RepoSaveResult & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}

/** Load the newest (or named) plan JSON from `plans/`. */
export async function loadLatestProjectFromRepo(slug?: string): Promise<{
  project: VdesignProject
  slug: string
  relativePath: string
  mtimeMs: number
}> {
  const q = new URLSearchParams({ latest: '1' })
  if (slug) q.set('slug', slug)
  const res = await fetch(`/api/plans?${q}`, { cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    project?: VdesignProject
    slug?: string
    relativePath?: string
    mtimeMs?: number
  }
  if (!res.ok || !data.project || !data.slug || !data.relativePath) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return {
    project: data.project,
    slug: data.slug,
    relativePath: data.relativePath,
    mtimeMs: data.mtimeMs ?? 0
  }
}
