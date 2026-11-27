'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ArrowLeft, FolderOpen, Upload } from 'lucide-react'
import { type RoomType, roomTypeForLevel } from '@blueprint3d/types/room_types'
import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import { Button } from '@/components/ui/button'
import {
  normalizeAreas,
  normalizeUnderlay,
  parseHomeJson,
  parseProjectJson,
  toSerializedRoom
} from '@/lib/load-project'
import { getActiveLevel, isVdesignHome, levelToProject } from '@/lib/home'
import { floorPath, projectPath, projectsListPath } from '@/lib/app-routes'
import type {
  SeedProjectInfo,
  VdesignHome,
  VdesignProject,
  WallScheduleEntry
} from '@/types/project'

interface ProjectsViewProps {
  /** When set (from `/projects/{slug}`), skip straight to level picker for that home. */
  initialSlug?: string | null
  onBlueprintLoad: (
    layoutData: string,
    roomType: RoomType,
    id?: string,
    name?: string,
    underlay?: UnderlayConfig | null,
    areas?: AreaLabel[],
    wallSchedule?: WallScheduleEntry[],
    home?: VdesignHome | null
  ) => void
}

export function ProjectsView({ onBlueprintLoad, initialSlug = null }: ProjectsViewProps) {
  const t = useTranslations('BluePrint.seedProjects')
  const fileRef = useRef<HTMLInputElement>(null)
  const [seeds, setSeeds] = useState<SeedProjectInfo[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug)
  const [loadingLevels, setLoadingLevels] = useState(false)
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([])
  const [selectedName, setSelectedName] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  useEffect(() => {
    setSelectedSlug(initialSlug)
  }, [initialSlug])

  useEffect(() => {
    fetch('/projects/index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SeedProjectInfo[]) => setSeeds(Array.isArray(data) ? data : []))
      .catch(() => setSeeds([]))
  }, [])

  const selectedSeed = useMemo(
    () => seeds.find((s) => s.id === selectedSlug || s.name === selectedSlug) ?? null,
    [seeds, selectedSlug]
  )

  const loadProject = useCallback(
    async (
      project: VdesignProject,
      id?: string,
      name?: string,
      home?: VdesignHome | null
    ) => {
      const serialized = toSerializedRoom(project)
      const underlay = normalizeUnderlay(project.underlay)
      const areas = normalizeAreas(project.areas)
      const levelId = home?.activeLevelId || project.meta?.levelId
      const levelName =
        home?.levels.find((l) => l.id === levelId)?.name || project.meta?.level
      onBlueprintLoad(
        serialized,
        roomTypeForLevel(levelId, levelName),
        id,
        name || project.meta?.name || 'Imported project',
        underlay,
        areas,
        project.wallSchedule || [],
        home ?? null
      )
      toast.success(t('importSuccess'))
    },
    [onBlueprintLoad, t]
  )

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const project = parseProjectJson(text)
        await loadProject(
          project,
          undefined,
          project.meta?.name || file.name.replace(/\.json$/i, '')
        )
      } catch (e) {
        console.error(e)
        toast.error(t('importError'))
      }
    },
    [loadProject, t]
  )

  const resolveHome = useCallback(
    async (slug: string): Promise<{ home: VdesignHome; seedId: string } | null> => {
      const seed =
        seeds.find((s) => s.id === slug || s.name === slug) ||
        ({
          id: slug,
          name: slug,
          path: `/projects/${slug}/home.json`
        } satisfies SeedProjectInfo)

      const apiRes = await fetch(
        `/api/plans?latest=1&slug=${encodeURIComponent(seed.id)}`
      )
      if (apiRes.ok) {
        const api = (await apiRes.json()) as {
          ok?: boolean
          home?: VdesignHome
          slug?: string
        }
        if (api.ok && api.home && isVdesignHome(api.home)) {
          return { home: api.home, seedId: api.slug || seed.id }
        }
      }

      const res = await fetch(seed.path)
      if (!res.ok) return null
      const text = await res.text()
      const data = JSON.parse(text) as unknown
      const wrapped = data as { home?: unknown }
      if (wrapped?.home && isVdesignHome(wrapped.home)) {
        return { home: wrapped.home, seedId: seed.id }
      }
      if (isVdesignHome(data)) {
        return { home: parseHomeJson(text, seed.name), seedId: seed.id }
      }
      return null
    },
    [seeds]
  )

  useEffect(() => {
    if (!selectedSlug) {
      setLevels([])
      setSelectedName('')
      setSelectedAddress('')
      return
    }
    let cancelled = false
    setLoadingLevels(true)
    void resolveHome(selectedSlug)
      .then((resolved) => {
        if (cancelled) return
        if (!resolved) {
          toast.error(t('loadError'))
          setLevels(selectedSeed?.levels || [])
          setSelectedName(selectedSeed?.name || selectedSlug)
          setSelectedAddress(selectedSeed?.address || '')
          return
        }
        const { home } = resolved
        setLevels(home.levels.map((l) => ({ id: l.id, name: l.name })))
        setSelectedName(home.meta.name || selectedSeed?.name || selectedSlug)
        setSelectedAddress(home.meta.address || selectedSeed?.address || '')
      })
      .catch(() => {
        if (!cancelled) toast.error(t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoadingLevels(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedSlug, resolveHome, selectedSeed, t])

  const navigate = useCallback((path: string) => {
    try {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch {
      window.location.assign(path)
    }
  }, [])

  const handleSelectProject = useCallback(
    (seed: SeedProjectInfo) => {
      const slug = seed.id
      setSelectedSlug(slug)
      navigate(projectPath(slug))
    },
    [navigate]
  )

  const handleBackToProjects = useCallback(() => {
    setSelectedSlug(null)
    navigate(projectsListPath())
  }, [navigate])

  const handleLoadFloor = useCallback(
    async (levelId: string) => {
      if (!selectedSlug) return
      try {
        const resolved = await resolveHome(selectedSlug)
        if (!resolved) throw new Error('Home not found')
        const { home, seedId } = resolved
        const level =
          home.levels.find((l) => l.id === levelId) || getActiveLevel(home)
        const slugForUrl = home.meta.name || seedId
        navigate(floorPath(slugForUrl, level.id))
        await loadProject(
          levelToProject(level, home.meta),
          seedId,
          home.meta.name,
          { ...home, activeLevelId: level.id }
        )
      } catch (e) {
        console.error(e)
        toast.error(t('loadError'))
      }
    },
    [selectedSlug, resolveHome, loadProject, navigate, t]
  )

  return (
    <div className="h-full w-full bg-card overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-6 pt-14 pb-3 text-sm text-muted-foreground border-b" />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!selectedSlug ? (
          <section className="mx-auto max-w-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
                <p className="text-sm text-muted-foreground">{t('pickProject')}</p>
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleImportFile(file)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  {t('importFile')}
                </Button>
              </div>
            </div>

            {seeds.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              <ul className="space-y-2">
                {seeds.map((seed) => (
                  <li key={seed.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectProject(seed)}
                      className="flex w-full items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent/40"
                    >
                      <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block font-medium text-sm">{seed.name}</span>
                        {seed.address && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {seed.address}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="mx-auto max-w-xl space-y-4">
            <div className="flex items-start gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-0.5 h-8 px-2"
                onClick={handleBackToProjects}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {selectedName || selectedSlug}
                </h2>
                {selectedAddress && (
                  <p className="text-xs text-muted-foreground">{selectedAddress}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{t('pickLevel')}</p>
              </div>
            </div>

            {loadingLevels ? (
              <p className="text-sm text-muted-foreground">{t('loadingLevels')}</p>
            ) : levels.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('emptyLevels')}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {levels.map((lvl) => (
                  <li key={lvl.id}>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 w-full justify-start px-4 text-sm font-medium"
                      onClick={() => void handleLoadFloor(lvl.id)}
                    >
                      {lvl.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
