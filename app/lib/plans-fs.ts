import fs from 'fs/promises'
import path from 'path'
import type { VdesignProject } from '@/types/project'
import { mergePlanProjects } from '@/lib/plans-merge'

/** Repo `plans/` directory (Docker: /app/plans via volume). */
export function getPlansDir(): string {
  if (process.env.VDESIGN_PLANS_DIR) {
    return path.resolve(process.env.VDESIGN_PLANS_DIR)
  }
  // next.dev cwd is usually `app/` → monorepo root is parent
  return path.resolve(process.cwd(), '..', 'plans')
}

/**
 * Serialize writes per plan slug so parallel agents / rapid Save clicks
 * cannot interleave latest.json + version + manifest updates.
 */
const writeQueues = new Map<string, Promise<unknown>>()

async function withSlugWriteLock<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeQueues.get(slug) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = prev.then(() => gate)
  writeQueues.set(
    slug,
    tail.catch(() => {
      /* keep chain alive */
    })
  )
  await prev.catch(() => {
    /* ignore prior failure */
  })
  try {
    return await fn()
  } finally {
    release()
    if (writeQueues.get(slug) === tail) writeQueues.delete(slug)
  }
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
  /** Disk mtime after write — pass back as baseMtimeMs on the next save. */
  mtimeMs: number
  /** True when incoming was combined with an existing on-disk plan. */
  merged: boolean
  mergeNotes: string[]
}

export async function writePlanToRepo(opts: {
  project: VdesignProject
  name: string
  id?: string
  /**
   * mtimeMs from the Load latest that this save is based on.
   * When it matches disk, skip merge and write incoming as-is.
   * When it mismatches (or omitted), merge additive fields with disk under the lock.
   */
  baseMtimeMs?: number
  /** Default true — parallel agents need merge. Set false only for intentional full replace. */
  merge?: boolean
}): Promise<PlanWriteResult> {
  const wallsIn = opts.project?.floorplan?.walls?.length ?? 0
  if (!wallsIn) {
    throw new Error('Refusing to save empty floorplan (0 walls)')
  }

  const slug = slugifyPlanName(opts.name || opts.id || 'vdesign-plan')
  const doMerge = opts.merge !== false

  return withSlugWriteLock(slug, async () => {
    const root = getPlansDir()
    const versionsDir = path.join(root, 'versions', slug)

    await fs.mkdir(versionsDir, { recursive: true })

    const latestPath = path.join(root, `${slug}.json`)
    const versionPath = path.join(versionsDir, `${stamp()}.json`)
    const lockPath = path.join(versionsDir, '.write.lock')

    // Cross-process advisory lock (parallel agents / multiple Node workers)
    const lockDeadline = Date.now() + 15_000
    for (;;) {
      try {
        const handle = await fs.open(lockPath, 'wx')
        await handle.writeFile(`${process.pid}\n${new Date().toISOString()}\n`, 'utf8')
        await handle.close()
        break
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code
        if (code !== 'EEXIST') throw err
        if (Date.now() > lockDeadline) {
          // Stale lock — take over
          await fs.rm(lockPath, { force: true })
          continue
        }
        await new Promise((r) => setTimeout(r, 40 + Math.random() * 60))
      }
    }

    try {
      let disk: VdesignProject | null = null
      let diskMtimeMs = 0
      try {
        const st = await fs.stat(latestPath)
        diskMtimeMs = st.mtimeMs
        disk = JSON.parse(await fs.readFile(latestPath, 'utf8')) as VdesignProject
      } catch {
        /* first save for this slug */
      }

      const baseMatches =
        typeof opts.baseMtimeMs === 'number' &&
        diskMtimeMs > 0 &&
        Math.abs(diskMtimeMs - opts.baseMtimeMs) < 1

      let project: VdesignProject = {
        ...opts.project,
        meta: {
          ...opts.project.meta,
          name: opts.name || opts.project.meta?.name,
          notes: opts.project.meta?.notes
        }
      }
      let merged = false
      let mergeNotes: string[] = []

      if (doMerge && disk && !baseMatches) {
        const result = mergePlanProjects(disk, project)
        project = {
          ...result.project,
          meta: {
            ...result.project.meta,
            name: opts.name || result.project.meta?.name,
            notes: result.project.meta?.notes
          }
        }
        merged = result.merged
        mergeNotes = result.notes
      } else if (baseMatches) {
        mergeNotes = ['baseMtimeMs matched — wrote incoming without merge']
      }

      const walls = project.floorplan?.walls?.length ?? 0
      if (!walls) {
        throw new Error('Refusing to save empty floorplan after merge (0 walls)')
      }

      const body = `${JSON.stringify(project, null, 2)}\n`

      // Write version first, then latest (readers prefer latest; versions are append-only)
      await fs.writeFile(versionPath, body, 'utf8')
      await fs.writeFile(latestPath, body, 'utf8')
      const stAfter = await fs.stat(latestPath)

      const manifestPath = path.join(versionsDir, 'manifest.json')
      let manifest: { saves: Array<{ file: string; at: string; walls: number; merged?: boolean }> } =
        { saves: [] }
      try {
        manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
      } catch {
        /* first save */
      }
      manifest.saves = [
        {
          file: path.basename(versionPath),
          at: new Date().toISOString(),
          walls,
          merged: merged || undefined
        },
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
        walls,
        mtimeMs: stAfter.mtimeMs,
        merged,
        mergeNotes
      }
    } finally {
      await fs.rm(lockPath, { force: true })
    }
  })
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
