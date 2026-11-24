import { NextResponse } from 'next/server'
import {
  listPlanVersions,
  readLatestPlan,
  slugifyPlanName,
  writePlanToRepo
} from '@/lib/plans-fs'
import type { VdesignProject } from '@/types/project'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST — Save active level into plans/{home}.json (home format) + version stamp */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      project?: VdesignProject
      name?: string
      id?: string
      levelId?: string
      levelName?: string
      /** mtimeMs from Reload — enables skip-merge when still current */
      baseMtimeMs?: number
      /** Default true. false = full level replace without additive merge */
      merge?: boolean
    }
    if (!body.project?.floorplan?.walls?.length) {
      return NextResponse.json(
        { error: 'Missing project.floorplan.walls' },
        { status: 400 }
      )
    }
    const name = body.name || body.project.meta?.name || body.id || 'vdesign-plan'
    const result = await writePlanToRepo({
      project: body.project,
      name,
      id: body.id,
      levelId: body.levelId || body.project.meta?.levelId,
      levelName: body.levelName || body.project.meta?.level,
      baseMtimeMs: body.baseMtimeMs,
      merge: body.merge
    })
    return NextResponse.json({
      ok: true,
      ...result,
      // Don't echo full home+levels walls twice in huge payloads unless needed
      project: undefined,
      home: result.home
        ? {
            format: result.home.format,
            meta: result.home.meta,
            activeLevelId: result.home.activeLevelId,
            levels: result.home.levels.map((l) => ({
              id: l.id,
              name: l.name,
              order: l.order,
              walls: l.floorplan?.walls?.length ?? 0
            }))
          }
        : undefined
    })
  } catch (err) {
    console.error('[api/plans POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    )
  }
}

/**
 * GET ?latest=1[&slug=…] — load home (or legacy) from plans/
 * GET ?versions=1&slug=… — list version history
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug') || undefined

    if (url.searchParams.get('versions') === '1') {
      if (!slug) {
        return NextResponse.json({ error: 'slug required' }, { status: 400 })
      }
      const versions = await listPlanVersions(slug)
      return NextResponse.json({ slug: slugifyPlanName(slug), versions })
    }

    const latest = await readLatestPlan(slug)
    if (!latest) {
      return NextResponse.json({ error: 'No plans in plans/' }, { status: 404 })
    }
    return NextResponse.json({
      ok: true,
      slug: latest.slug,
      relativePath: latest.relativePath,
      mtimeMs: latest.mtimeMs,
      levelId: latest.levelId,
      home: latest.home,
      /** Active level payload for the canvas */
      project: latest.project
    })
  } catch (err) {
    console.error('[api/plans GET]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Load failed' },
      { status: 500 }
    )
  }
}
