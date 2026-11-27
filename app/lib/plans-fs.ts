import fs from 'fs/promises'
import path from 'path'
import type { VdesignHome, VdesignProject } from '@/types/project'
import { mergeHomeLevel, mergePlanProjects } from '@/lib/plans-merge'
import {
  getActiveLevel,
  isVdesignHome,
  levelToProject,
  normalizeToHome,
  projectToLevelPayload,
  stripLevelSuffix,
  upsertLevel,
  wrapProjectAsHome
} from '@/lib/home'

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
  home?: VdesignHome
  levelId?: string
}

export async function writePlanToRepo(opts: {
  /** Active level payload (what the canvas is editing). */
  project: VdesignProject
  /** Home display / slug name (e.g. 2713-S-224th). Level suffixes are stripped. */
  name: string
  id?: string
  /** Which level to patch. Defaults to project.meta.levelId or "basement". */
  levelId?: string
  levelName?: string
  /**
   * mtimeMs from Reload that this save is based on.
   * When it matches disk, skip merge and write incoming as-is.
   * When it mismatches (or omitted), merge additive fields with disk under the lock.
   */
  baseMtimeMs?: number
  /** Default true — parallel agents need merge. Set false only for intentional full replace. */
  merge?: boolean
  /**
   * When true and disk has no home yet, replace the whole file with a new home
   * built from `project` (plus optional extraLevels). Exclusive writer only.
   */
  replaceHome?: boolean
}): Promise<PlanWriteResult> {
  const wallsIn = opts.project?.floorplan?.walls?.length ?? 0
  if (!wallsIn) {
    throw new Error('Refusing to save empty floorplan (0 walls)')
  }

  const homeName = stripLevelSuffix(opts.name || opts.id || 'vdesign-plan')
  const slug = slugifyPlanName(homeName)
  // Never default to a synthetic "main" — that spawned an empty 4th level on 2713.
  const levelId =
    opts.levelId || opts.project.meta?.levelId || opts.project.meta?.level || 'basement'
  const levelName =
    opts.levelName || opts.project.meta?.level || levelId
  const doMerge = opts.merge !== false

  return withSlugWriteLock(slug, async () => {
    const root = getPlansDir()
    const versionsDir = path.join(root, 'versions', slug)

    await fs.mkdir(versionsDir, { recursive: true })

    const latestPath = path.join(root, `${slug}.json`)
    const versionPath = path.join(versionsDir, `${stamp()}.json`)
    const lockPath = path.join(versionsDir, '.write.lock')

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
          await fs.rm(lockPath, { force: true })
          continue
        }
        await new Promise((r) => setTimeout(r, 40 + Math.random() * 60))
      }
    }

    try {
      let diskRaw: unknown = null
      let diskMtimeMs = 0
      try {
        const st = await fs.stat(latestPath)
        diskMtimeMs = st.mtimeMs
        diskRaw = JSON.parse(await fs.readFile(latestPath, 'utf8'))
      } catch {
        /* first save for this slug */
      }

      const baseMatches =
        typeof opts.baseMtimeMs === 'number' &&
        diskMtimeMs > 0 &&
        Math.abs(diskMtimeMs - opts.baseMtimeMs) < 1

      let home: VdesignHome
      let merged = false
      let mergeNotes: string[] = []

      const incomingPayload = projectToLevelPayload(opts.project)

      if (!diskRaw) {
        home = wrapProjectAsHome(opts.project, {
          homeName,
          levelId: String(levelId),
          levelName: String(levelName)
        })
        mergeNotes = ['created new home']
      } else if (isVdesignHome(diskRaw)) {
        if (doMerge && !baseMatches) {
          const result = mergeHomeLevel(
            diskRaw,
            String(levelId),
            incomingPayload,
            String(levelName)
          )
          home = {
            ...result.home,
            meta: {
              ...result.home.meta,
              name: homeName,
              address: opts.project.meta?.address ?? result.home.meta.address,
              notes: opts.project.meta?.notes ?? result.home.meta.notes
            },
            activeLevelId: String(levelId)
          }
          merged = result.merged
          mergeNotes = result.notes
        } else {
          home = upsertLevel(
            {
              ...diskRaw,
              meta: {
                ...diskRaw.meta,
                name: homeName,
                address: opts.project.meta?.address ?? diskRaw.meta.address,
                notes: opts.project.meta?.notes ?? diskRaw.meta.notes
              }
            },
            String(levelId),
            incomingPayload,
            String(levelName)
          )
          mergeNotes = baseMatches
            ? ['baseMtimeMs matched — wrote level without merge']
            : ['wrote level without merge']
        }
      } else {
        // Legacy single-level file on disk
        const diskProject = diskRaw as VdesignProject
        let levelProject = opts.project
        if (doMerge && !baseMatches) {
          const result = mergePlanProjects(diskProject, opts.project)
          levelProject = result.project
          merged = result.merged
          mergeNotes = result.notes
        } else if (baseMatches) {
          mergeNotes = ['baseMtimeMs matched — wrote incoming without merge']
        }
        home = wrapProjectAsHome(levelProject, {
          homeName,
          levelId: String(levelId),
          levelName: String(levelName)
        })
        mergeNotes = [...mergeNotes, 'upgraded legacy plan to home format']
      }

      if (opts.replaceHome) {
        home = wrapProjectAsHome(opts.project, {
          homeName,
          levelId: String(levelId),
          levelName: String(levelName)
        })
        mergeNotes = ['replaceHome — full home rewrite']
        merged = false
      }

      const walls = getActiveLevel(home).floorplan?.walls?.length ?? 0
      if (!walls) {
        throw new Error('Refusing to save empty floorplan after merge (0 walls)')
      }

      const body = `${JSON.stringify(home, null, 2)}\n`

      await fs.writeFile(versionPath, body, 'utf8')
      await fs.writeFile(latestPath, body, 'utf8')
      const stAfter = await fs.stat(latestPath)

      const manifestPath = path.join(versionsDir, 'manifest.json')
      let manifest: {
        saves: Array<{ file: string; at: string; walls: number; merged?: boolean; levelId?: string }>
      } = { saves: [] }
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
          merged: merged || undefined,
          levelId: String(levelId)
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
        mergeNotes,
        home,
        levelId: String(levelId)
      }
    } finally {
      await fs.rm(lockPath, { force: true })
    }
  })
}

export interface PlanReadResult {
  /** Active level as canvas project. */
  project: VdesignProject
  home: VdesignHome
  slug: string
  relativePath: string
  mtimeMs: number
  levelId: string
}

export async function readLatestPlan(
  slugHint?: string,
  levelHint?: string | null
): Promise<PlanReadResult | null> {
  const root = getPlansDir()
  let entries: string[] = []
  try {
    entries = await fs.readdir(root)
  } catch {
    return null
  }

  const jsonFiles = entries.filter((f) => f.endsWith('.json') && f !== 'README.md')
  if (!jsonFiles.length) return null

  const hintSlug = slugHint ? slugifyPlanName(stripLevelSuffix(slugHint)) : undefined
  const preferred = hintSlug
    ? jsonFiles.find((f) => f === `${hintSlug}.json`) ||
      jsonFiles.find((f) => f === `${slugifyPlanName(slugHint!)}.json`)
    : undefined

  type Cand = { file: string; mtimeMs: number }
  const cands: Cand[] = []
  for (const file of jsonFiles) {
    const st = await fs.stat(path.join(root, file))
    if (st.isFile()) cands.push({ file, mtimeMs: st.mtimeMs })
  }
  if (!cands.length) return null

  // Prefer home slug over legacy *-Basement / *-Backyard when no hint
  cands.sort((a, b) => {
    const aHome = !/-(Basement|Backyard|Main|Second)\.json$/i.test(a.file)
    const bHome = !/-(Basement|Backyard|Main|Second)\.json$/i.test(b.file)
    if (aHome !== bHome) return aHome ? -1 : 1
    return b.mtimeMs - a.mtimeMs
  })

  const pick = preferred
    ? cands.find((c) => c.file === preferred) || cands[0]
    : cands[0]

  const full = path.join(root, pick.file)
  const raw = JSON.parse(await fs.readFile(full, 'utf8')) as unknown
  const home = normalizeToHome(raw, pick.file.replace(/\.json$/i, ''))
  const key = levelHint?.trim().toLowerCase()
  const matched = key
    ? home.levels.find(
        (l) =>
          l.id === levelHint ||
          l.id.toLowerCase() === key ||
          l.name.toLowerCase() === key ||
          (key === 'downstairs' && l.id === 'basement') ||
          (key === 'main-level' && l.id === 'main')
      )
    : undefined
  const level = matched || getActiveLevel(home)
  if (!level.floorplan?.walls?.length) {
    throw new Error(`Latest plan has no walls: ${pick.file}`)
  }

  const homeWithLevel: VdesignHome = { ...home, activeLevelId: level.id }

  return {
    project: levelToProject(level, home.meta),
    home: homeWithLevel,
    slug: pick.file.replace(/\.json$/i, ''),
    relativePath: path.posix.join('plans', pick.file),
    mtimeMs: pick.mtimeMs,
    levelId: level.id
  }
}

export async function listPlanVersions(slug: string): Promise<
  Array<{ file: string; at?: string; walls?: number; relativePath: string }>
> {
  const versionsDir = path.join(getPlansDir(), 'versions', slugifyPlanName(stripLevelSuffix(slug)))
  try {
    const manifestRaw = await fs.readFile(path.join(versionsDir, 'manifest.json'), 'utf8')
    const manifest = JSON.parse(manifestRaw) as {
      saves: Array<{ file: string; at: string; walls: number }>
    }
    return (manifest.saves || []).map((s) => ({
      ...s,
      relativePath: path.posix.join(
        'plans',
        'versions',
        slugifyPlanName(stripLevelSuffix(slug)),
        s.file
      )
    }))
  } catch {
    return []
  }
}
