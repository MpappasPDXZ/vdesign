'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { FolderOpen, Upload } from 'lucide-react'
import { RoomType } from '@blueprint3d/types/room_types'
import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import { Button } from '@/components/ui/button'
import { MyFloorplans } from './MyFloorplans'
import {
  normalizeAreas,
  normalizeUnderlay,
  parseProjectJson,
  toSerializedRoom
} from '@/lib/load-project'
import type { SeedProjectInfo, VdesignProject } from '@/types/project'

interface ProjectsViewProps {
  onBlueprintLoad: (
    layoutData: string,
    roomType: RoomType,
    id?: string,
    name?: string,
    underlay?: UnderlayConfig | null,
    areas?: AreaLabel[]
  ) => void
}

export function ProjectsView({ onBlueprintLoad }: ProjectsViewProps) {
  const t = useTranslations('BluePrint.seedProjects')
  const fileRef = useRef<HTMLInputElement>(null)
  const [seeds, setSeeds] = useState<SeedProjectInfo[]>([])

  useEffect(() => {
    fetch('/projects/index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SeedProjectInfo[]) => setSeeds(Array.isArray(data) ? data : []))
      .catch(() => setSeeds([]))
  }, [])

  const loadProject = useCallback(
    async (project: VdesignProject, id?: string, name?: string) => {
      const serialized = toSerializedRoom(project)
      const underlay = normalizeUnderlay(project.underlay)
      const areas = normalizeAreas(project.areas)
      onBlueprintLoad(
        serialized,
        RoomType.BEDROOM,
        id,
        name || project.meta?.name || 'Imported project',
        underlay,
        areas
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
        await loadProject(project, undefined, project.meta?.name || file.name.replace(/\.json$/i, ''))
      } catch (e) {
        console.error(e)
        toast.error(t('importError'))
      }
    },
    [loadProject, t]
  )

  const handleLoadSeed = useCallback(
    async (seed: SeedProjectInfo) => {
      try {
        const res = await fetch(seed.path)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const project = parseProjectJson(await res.text())
        await loadProject(project, seed.id, seed.name)
      } catch (e) {
        console.error(e)
        toast.error(t('loadError'))
      }
    },
    [loadProject, t]
  )

  return (
    <div className="h-full w-full bg-card overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-6 pt-14 pb-3 text-sm text-muted-foreground border-b" />

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
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
            <ul className="grid gap-3 sm:grid-cols-2">
              {seeds.map((seed) => (
                <li
                  key={seed.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{seed.name}</span>
                    </div>
                    {seed.address && (
                      <p className="mt-1 text-xs text-muted-foreground">{seed.address}</p>
                    )}
                    {seed.level && (
                      <p className="text-xs text-muted-foreground">{seed.level}</p>
                    )}
                  </div>
                  <Button type="button" size="sm" onClick={() => void handleLoadSeed(seed)}>
                    {t('load')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <MyFloorplans
          onLoadFloorplan={(data, roomType, id, name) =>
            onBlueprintLoad(data, roomType ?? RoomType.BEDROOM, id, name, null, [])
          }
        />
      </div>
    </div>
  )
}
