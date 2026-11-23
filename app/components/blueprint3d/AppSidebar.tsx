'use client'

import { useEffect } from 'react'
import {
  Menu,
  X,
  FilePlus,
  Upload,
  Download,
  Settings,
  Layers,
  ListOrdered,
  HelpCircle,
  Plus,
  Minus,
  Pencil,
  Move,
  DoorOpen,
  ArrowUpFromLine,
  Sofa,
  BetweenHorizonalStart,
  ListTree,
  ChevronDown,
  FolderInput
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { OverlayDescriptor } from '@blueprint3d/floorplanner/overlay'
import type { UnderlayConfig } from '@blueprint3d/floorplanner/underlay'
import type { EntranceKind, WallScheduleEntry } from '@/types/project'
import { BlueprintOverlayEditor } from './BlueprintOverlayEditor'

interface AppSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTab: 'projects' | 'edit' | 'items'
  onTabChange: (tab: 'projects' | 'edit' | 'items') => void
  overlays: OverlayDescriptor[]
  onOverlayToggle: (id: string, visible: boolean) => void
  underlay: UnderlayConfig | null
  onUnderlayChange: (next: UnderlayConfig) => void
  onUnderlayRemove: () => void
  onUnderlayAddFile: (file: File) => void
  wallSchedule: WallScheduleEntry[]
  selectedWallNumber?: number | null
  onSelectWallNumber?: (n: number) => void
  onSave: () => void
  onNew: () => void
  onImport?: () => void
  onDownload?: () => void
  /** Load newest JSON from repo plans/ */
  onLoadLatest?: () => void
  onSettingsClick: () => void
  projectName?: string | null
  onHelpClick?: () => void
  autosaveLabel?: string | null
  floorplannerMode?: 'move' | 'draw' | 'delete'
  onFloorplannerMode?: (mode: 'move' | 'draw' | 'delete') => void
  /** Add wall-hosted entrance (door or stairs). */
  onAddEntrance?: (kind: EntranceKind) => void
  /** @deprecated use onAddEntrance('door') */
  onAddDoor?: () => void
  onAddItem?: () => void
  onInsertWall?: () => void
  onOpenExteriorWalls?: () => void
}

export function AppSidebar({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  overlays,
  onOverlayToggle,
  underlay,
  onUnderlayChange,
  onUnderlayRemove,
  onUnderlayAddFile,
  wallSchedule,
  selectedWallNumber,
  onSelectWallNumber,
  onSave,
  onNew,
  onImport,
  onDownload,
  onLoadLatest,
  onSettingsClick,
  projectName,
  onHelpClick,
  autosaveLabel,
  floorplannerMode = 'move',
  onFloorplannerMode,
  onAddEntrance,
  onAddDoor,
  onAddItem,
  onInsertWall,
  onOpenExteriorWalls
}: AppSidebarProps) {
  const t = useTranslations('BluePrint.sidebar')
  const tMain = useTranslations('BluePrint.mainControls')
  const tOverlays = useTranslations('BluePrint.overlays')
  const tWalls = useTranslations('BluePrint.wallSchedule')
  const tFloor = useTranslations('BluePrint.floorplanner')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const tabs = [
    { id: 'projects' as const, label: t('projects') },
    { id: 'edit' as const, label: t('edit') },
    { id: 'items' as const, label: t('addItems') }
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'pointer-events-auto absolute left-3 top-3 z-[90] flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/95 shadow-md backdrop-blur-sm transition-colors hover:bg-accent',
          open && 'bg-accent'
        )}
        aria-label={open ? t('collapseSidebar') : t('openSidebar')}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={cn(
          'absolute inset-0 z-[80] bg-black/40 transition-opacity',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          'absolute left-0 top-0 z-[85] flex h-full w-[min(100%,17rem)] flex-col border-r border-border bg-background shadow-xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 pl-14">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold tracking-tight">vdesign</div>
            {projectName && (
              <div className="truncate text-[11px] text-muted-foreground">{projectName}</div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
          <div className="mb-3 grid grid-cols-3 gap-0.5 rounded-lg bg-muted/60 p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTabChange(tab.id)
                  if (tab.id !== 'edit') onOpenChange(false)
                }}
                className={cn(
                  'rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Compact file actions */}
          <section className="mb-3 space-y-1">
            <Button
              type="button"
              size="sm"
              className="h-8 w-full justify-start text-xs"
              onClick={onSave}
              title={tMain('savePlanHint')}
            >
              {tMain('savePlan')}
            </Button>
            {onLoadLatest && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 w-full justify-start gap-1.5 text-xs"
                onClick={onLoadLatest}
                title={tMain('loadLatestPlanHint')}
              >
                <FolderInput className="h-3.5 w-3.5" />
                {tMain('loadLatestPlan')}
              </Button>
            )}
            <div className="grid grid-cols-3 gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-1.5 text-[11px]"
                onClick={onNew}
                title={tMain('newPlan')}
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
              {onImport && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-1.5 text-[11px]"
                  onClick={onImport}
                  title={tMain('importPlan')}
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDownload && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-1.5 text-[11px]"
                  onClick={onDownload}
                  title={tMain('downloadPlanHint')}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {autosaveLabel && (
              <p className="px-0.5 text-[10px] text-muted-foreground">{autosaveLabel}</p>
            )}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 flex-1 justify-start text-xs"
                onClick={onSettingsClick}
              >
                <Settings className="h-3.5 w-3.5" />
                {t('settings')}
              </Button>
              {onHelpClick && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 flex-1 justify-start text-xs text-muted-foreground"
                  onClick={onHelpClick}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Help
                </Button>
              )}
            </div>
          </section>

          {activeTab === 'edit' && onOpenExteriorWalls && (
            <section className="mb-3 space-y-1">
              <Button
                type="button"
                size="sm"
                className="h-9 w-full justify-start gap-2 text-xs"
                onClick={() => {
                  onOpenExteriorWalls()
                  onOpenChange(false)
                }}
              >
                <ListTree className="h-4 w-4" />
                {t('exteriorWalls')}
              </Button>
            </section>
          )}

          {activeTab === 'edit' && onFloorplannerMode && (
            <section className="mb-3 space-y-1.5">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Plus className="h-3 w-3" />
                {t('tools')}
              </div>
              <p className="px-1 text-[10px] leading-snug text-muted-foreground">{t('toolsHint')}</p>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={floorplannerMode === 'draw' ? 'default' : 'outline'}
                  className="h-8 justify-start gap-1.5 px-2 text-[11px]"
                  title={tFloor('drawWalls')}
                  onClick={() => {
                    onFloorplannerMode('draw')
                    onOpenChange(false)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <Plus className="h-3 w-3 opacity-70" />
                  {t('addWall')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={floorplannerMode === 'delete' ? 'default' : 'outline'}
                  className="h-8 justify-start gap-1.5 px-2 text-[11px]"
                  title={tFloor('deleteWalls')}
                  onClick={() => {
                    onFloorplannerMode('delete')
                    onOpenChange(false)
                  }}
                >
                  <Minus className="h-3.5 w-3.5" />
                  {t('remove')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 justify-start gap-1.5 px-2 text-[11px]"
                  title={t('insertWallHint')}
                  disabled={!onInsertWall}
                  onClick={() => {
                    onInsertWall?.()
                    onOpenChange(false)
                  }}
                >
                  <BetweenHorizonalStart className="h-3.5 w-3.5" />
                  {t('insertWall')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 justify-start gap-1.5 px-2 text-[11px]"
                      title={t('addEntranceHint')}
                    >
                      <DoorOpen className="h-3.5 w-3.5" />
                      <Plus className="h-3 w-3 opacity-70" />
                      {t('addEntrance')}
                      <ChevronDown className="ml-auto h-3 w-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="z-[80]">
                    <DropdownMenuItem
                      onClick={() => {
                        if (onAddEntrance) onAddEntrance('door')
                        else onAddDoor?.()
                        onOpenChange(false)
                      }}
                    >
                      <DoorOpen className="h-3.5 w-3.5" />
                      {t('addEntranceDoor')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onAddEntrance?.('stairs')
                        onOpenChange(false)
                      }}
                    >
                      <ArrowUpFromLine className="h-3.5 w-3.5" />
                      {t('addEntranceStairs')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 justify-start gap-1.5 px-2 text-[11px]"
                  title={t('addItem')}
                  onClick={() => {
                    onAddItem?.()
                    onOpenChange(false)
                  }}
                >
                  <Sofa className="h-3.5 w-3.5" />
                  <Plus className="h-3 w-3 opacity-70" />
                  {t('addItem')}
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant={floorplannerMode === 'move' ? 'secondary' : 'ghost'}
                className="h-7 w-full justify-start gap-1.5 px-2 text-[11px]"
                title={tFloor('moveWalls')}
                onClick={() => {
                  onFloorplannerMode('move')
                  onOpenChange(false)
                }}
              >
                <Move className="h-3.5 w-3.5" />
                {t('moveEdit')}
              </Button>
            </section>
          )}

          {activeTab === 'edit' && (
            <section className="mb-3 space-y-1.5">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3 w-3" />
                {tOverlays('title')}
              </div>

              <BlueprintOverlayEditor
                underlay={underlay}
                visible={overlays.find((o) => o.id === 'blueprint')?.visible ?? !!underlay}
                onToggleVisible={(visible) => onOverlayToggle('blueprint', visible)}
                onChange={onUnderlayChange}
                onRemove={onUnderlayRemove}
                onAddFile={onUnderlayAddFile}
              />

              {overlays.filter((o) => o.id !== 'blueprint').length > 0 && (
                <ul className="space-y-1 rounded-lg border border-border p-1.5">
                  {overlays
                    .filter((o) => o.id !== 'blueprint')
                    .map((o) => (
                      <li key={o.id}>
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={o.visible}
                            onChange={(e) => onOverlayToggle(o.id, e.target.checked)}
                            className="size-3.5 accent-primary"
                          />
                          <span className="truncate">{o.label}</span>
                        </label>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          )}

          {wallSchedule.length > 0 && activeTab === 'edit' && (
            <section className="mb-2 space-y-1.5">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ListOrdered className="h-3 w-3" />
                {tWalls('title')}
              </div>
              <p className="px-1 text-[10px] text-muted-foreground">{tWalls('clickHint')}</p>
              <ol className="max-h-[32vh] space-y-0 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {wallSchedule.map((w) => (
                  <li key={w.n}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60',
                        selectedWallNumber === w.n && 'bg-accent'
                      )}
                      onClick={() => {
                        onSelectWallNumber?.(w.n)
                        onOpenChange(false)
                      }}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold text-white">
                        {w.n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium leading-tight">
                          {w.name || w.role}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {w.outerLength || '—'}
                          {w.thickness ? ` · ${w.thickness}` : ''}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </aside>
    </>
  )
}
