import fs from 'fs/promises'
import path from 'path'
import type { VdesignProject } from '@/types/project'

/** Repo `plans/` directory (Docker: /app/plans via volume). */
export function getPlansDir(): string {
  if (process.env.VDESIGN_PLANS_DIR) {
    return path.resolve(process.env.VDESIGN_PLANS_DIR)
  }
  // next.dev cwd is usually `app/` → monorepo root is parent
  return path.resolve(process.cwd(), '..', 'plans')
}

export function slugifyPlanName(name: string): string {
  const s = name
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return s || 'vdesign-plan'
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'Z')
}

export interface PlanWriteResult {
  slug: string
  latestPath: string
  versionPath: string
  relativeLatest: string
  relativeVersion: string
  walls: number
}

export async function writePlanToRepo(opts: {
  project: VdesignProject
  name: string
  id?: string
}): Promise<PlanWriteResult> {
  const walls = opts.project?.floorplan?.walls?.length ?? 0
  if (!walls) {
    throw new Error('Refusing to save empty floorplan (0 walls)')
  }

  const slug = slugifyPlanName(opts.name || opts.id || 'vdesign-plan')
  const root = getPlansDir()
  const versionsDir = path.join(root, 'versions', slug)

  await fs.mkdir(versionsDir, { recursive: true })

  const project: VdesignProject = {
    ...opts.project,
    meta: {
      ...opts.project.meta,
      name: opts.name || opts.project.meta?.name,
      notes: opts.project.meta?.notes
    }
  }

  const body = `${JSON.stringify(project, null, 2)}\n`
  const latestPath = path.join(root, `${slug}.json`)
  const versionPath = path.join(versionsDir, `${stamp()}.json`)

  await fs.writeFile(latestPath, body, 'utf8')
  await fs.writeFile(versionPath, body, 'utf8')

  // Manifest for quick listing
  const manifestPath = path.join(versionsDir, 'manifest.json')
  let manifest: { saves: Array<{ file: string; at: string; walls: number }> } = { saves: [] }
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  } catch {
    /* first save */
  }
  manifest.saves = [
    { file: path.basename(versionPath), at: new Date().toISOString(), walls },
    ...(manifest.saves || [])
  ].slice(0, 200)
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  return {
    slug,
    latestPath,
    versionPath,
    relativeLatest: path.posix.join('plans', `${slug}.json`),
    relativeVersion: path.posix.join(
      'plans',
      'versions',
      slug,
      path.basename(versionPath)
    ),
    walls
  }
}

export async function readLatestPlan(slugHint?: string): Promise<{
  project: VdesignProject
  slug: string
  relativePath: string
  mtimeMs: number
} | null> {
  const root = getPlansDir()
  let entries: string[] = []
  try {
    entries = await fs.readdir(root)
  } catch {
    return null
  }

  const jsonFiles = entries.filter((f) => f.endsWith('.json') && f !== 'README.md')
  if (!jsonFiles.length) return null

  const preferred = slugHint
    ? jsonFiles.find((f) => f === `${slugifyPlanName(slugHint)}.json`)
    : undefined

  type Cand = { file: string; mtimeMs: number }
  const cands: Cand[] = []
  for (const file of jsonFiles) {
    const st = await fs.stat(path.join(root, file))
    if (st.isFile()) cands.push({ file, mtimeMs: st.mtimeMs })
  }
  if (!cands.length) return null

  cands.sort((a, b) => b.mtimeMs - a.mtimeMs)
  const pick = preferred
    ? cands.find((c) => c.file === preferred) || cands[0]
    : cands[0]

  const full = path.join(root, pick.file)
  const raw = await fs.readFile(full, 'utf8')
  const project = JSON.parse(raw) as VdesignProject
  if (!project?.floorplan?.walls?.length) {
    throw new Error(`Latest plan has no walls: ${pick.file}`)
  }

  return {
    project,
    slug: pick.file.replace(/\.json$/i, ''),
    relativePath: path.posix.join('plans', pick.file),
    mtimeMs: pick.mtimeMs
  }
}

export async function listPlanVersions(slug: string): Promise<
  Array<{ file: string; at?: string; walls?: number; relativePath: string }>
> {
  const versionsDir = path.join(getPlansDir(), 'versions', slugifyPlanName(slug))
  try {
    const manifestRaw = await fs.readFile(path.join(versionsDir, 'manifest.json'), 'utf8')
    const manifest = JSON.parse(manifestRaw) as {
      saves: Array<{ file: string; at: string; walls: number }>
    }
    return (manifest.saves || []).map((s) => ({
      ...s,
      relativePath: path.posix.join('plans', 'versions', slugifyPlanName(slug), s.file)
    }))
  } catch {
    return []
  }
}
