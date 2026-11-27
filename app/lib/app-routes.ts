/** Path helpers: /projects → /projects/{slug} → /projects/{slug}/floor/{floor} */

export type AppRoute =
  | { kind: 'projects' }
  | { kind: 'project'; slug: string }
  | { kind: 'floor'; slug: string; floor: string }
  | { kind: 'other' }

function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'en' || parts[0] === 'zh' || parts[0] === 'tw') {
    return `/${parts.slice(1).join('/')}`
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function parseAppPath(pathname: string): AppRoute {
  const path = stripLocalePrefix(pathname).replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/projects') return { kind: 'projects' }

  const mFloor = path.match(/^\/projects\/([^/]+)\/floor\/([^/]+)$/i)
  if (mFloor) {
    return {
      kind: 'floor',
      slug: decodeURIComponent(mFloor[1]),
      floor: decodeURIComponent(mFloor[2])
    }
  }

  const mProject = path.match(/^\/projects\/([^/]+)$/i)
  if (mProject) {
    // Static seed assets live under /projects/{id}/home.json — not an app route
    const slug = decodeURIComponent(mProject[1])
    if (slug === 'index.json' || slug.endsWith('.json')) return { kind: 'other' }
    return { kind: 'project', slug }
  }

  return { kind: 'other' }
}

export function projectsListPath(): string {
  return '/projects'
}

export function projectPath(slug: string): string {
  return `/projects/${encodeURIComponent(slug)}`
}

export function floorPath(slug: string, floor: string): string {
  return `/projects/${encodeURIComponent(slug)}/floor/${encodeURIComponent(floor)}`
}

/** Prefer live plan slug casing when available. */
export function normalizeProjectSlug(raw: string): string {
  return raw.trim().replace(/\/+$/, '') || raw
}
