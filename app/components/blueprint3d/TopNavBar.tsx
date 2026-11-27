'use client'

import { useState } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
  Camera,
  Layers,
  X,
  ArrowDownToLine
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'
import type { ViewMode } from '@/types/view-mode'

interface TopNavBarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  /** When false, hide the view toggle (e.g. projects tab) */
  showViewToggle?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  /** 3D measure mode — click two points for a length */
  measureActive?: boolean
  onMeasureToggle?: () => void
  /** Copy chrome-free viewport screenshot (header/footer) to clipboard */
  onCopyScreenshot?: () => void
  /** Blueprint: green landscaping / movable footprints */
  landscapingVisible?: boolean
  onLandscapingVisibleChange?: (visible: boolean) => void
  /** 3D: show/hide tree meshes */
  treesVisible?: boolean
  onTreesVisibleChange?: (visible: boolean) => void
  /** 3D: walls at 10% height (cabinets stay full) */
  shortWalls?: boolean
  onShortWallsChange?: (on: boolean) => void
  /** 3D: named areas for layer toggles */
  areaNames?: string[]
  /** Area names currently hidden (unchecked) */
  hiddenAreas?: string[]
  onHiddenAreasChange?: (hidden: string[]) => void
}

const VIEW_OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: '2d', label: '2D' },
  { mode: 'blueprint', label: 'Blueprint' },
  { mode: '3d', label: '3D' }
]

/** Minimal chrome: 2D / Blueprint / 3D (+ 3D zoom) pinned top-right. */
export function TopNavBar({
  viewMode,
  onViewModeChange,
  showViewToggle = true,
  onZoomIn,
  onZoomOut,
  onFitView,
  measureActive = false,
  onMeasureToggle,
  onCopyScreenshot,
  landscapingVisible = true,
  onLandscapingVisibleChange,
  treesVisible = true,
  onTreesVisibleChange,
  shortWalls = false,
  onShortWallsChange,
  areaNames = [],
  hiddenAreas = [],
  onHiddenAreasChange
}: TopNavBarProps) {
  const isMobile = useIsMobile()
  /** Collapse the Trees/Areas layer card without leaving 3D. */
  const [layersOpen, setLayersOpen] = useState(true)

  if (!showViewToggle) return null

  const showZoom = !!(onZoomIn || onZoomOut || onFitView)
  const showMeasure = viewMode === '3d' && !!onMeasureToggle
  const showShortWallsToggle = viewMode === '3d' && typeof onShortWallsChange === 'function'
  const showScreenshot = !!onCopyScreenshot
  const showBlueprintPanel =
    viewMode === 'blueprint' && typeof onLandscapingVisibleChange === 'function'
  const show3dPanel =
    viewMode === '3d' &&
    (typeof onTreesVisibleChange === 'function' ||
      typeof onHiddenAreasChange === 'function' ||
      typeof onShortWallsChange === 'function')
  const hiddenSet = new Set(hiddenAreas)
  const sortedAreas = [...areaNames].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )
  const hiddenCount = hiddenAreas.length

  return (
    // h-0 so a tall Layers card cannot vertically-center the toolbar off-screen
    <div className="pointer-events-none relative h-0">
      <div className="pointer-events-auto absolute right-3 top-3 z-[100] flex flex-col items-end gap-2 md:right-4">
        <div
          className={cn(
            'flex items-center rounded-full border border-border/50 bg-background/80 shadow-sm backdrop-blur-sm',
            isMobile ? 'gap-1 px-2 py-1.5' : 'gap-1.5 px-2.5 py-1.5'
          )}
        >
          {showZoom && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(isMobile ? 'h-7 w-7' : 'h-8 w-8')}
                    onClick={onZoomOut}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(isMobile ? 'h-7 w-7' : 'h-8 w-8')}
                    onClick={onZoomIn}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom in</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(isMobile ? 'h-7 w-7' : 'h-8 w-8')}
                    onClick={onFitView}
                    aria-label="Fit plan"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Fit plan</TooltipContent>
              </Tooltip>
              <div className="mx-0.5 h-5 w-px bg-border/60" aria-hidden />
            </>
          )}
          <div
            role="group"
            aria-label="View mode"
            className={cn(
              'flex items-center rounded-full bg-muted/60 p-0.5',
              isMobile ? 'gap-0' : 'gap-0.5'
            )}
          >
            {VIEW_OPTIONS.map(({ mode, label }) => {
              const active = viewMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full font-medium transition-colors',
                    isMobile ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-sm',
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              )
            })}
            {showMeasure && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border/60" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onMeasureToggle}
                      aria-pressed={measureActive}
                      aria-label="Measure"
                      title="Measure — click two points"
                      className={cn(
                        'rounded-full flex items-center justify-center transition-colors',
                        isMobile ? 'h-7 w-7' : 'h-8 w-8',
                        measureActive
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Ruler className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {measureActive ? 'Exit measure' : 'Measure — click two points'}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {showShortWallsToggle && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border/60" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onShortWallsChange?.(!shortWalls)}
                      aria-pressed={shortWalls}
                      aria-label="Short walls"
                      title="Short walls — walls & doors at 10% height; cabinets stay full"
                      className={cn(
                        'rounded-full flex items-center justify-center gap-0.5 transition-colors',
                        isMobile ? 'h-7 px-1.5' : 'h-8 px-2',
                        shortWalls
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      <span className={cn('font-medium', isMobile ? 'text-[10px]' : 'text-xs')}>
                        10%
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {shortWalls
                      ? 'Short walls on — click for full height'
                      : 'Short walls — see into rooms; cabinets stay full'}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {showScreenshot && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border/60" aria-hidden />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onCopyScreenshot}
                      aria-label="Copy screenshot"
                      title="Copy screenshot — no toolbar chrome"
                      className={cn(
                        'rounded-full flex items-center justify-center transition-colors',
                        isMobile ? 'h-7 w-7' : 'h-8 w-8',
                        'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Copy screenshot (clean view + header/footer)
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        {showBlueprintPanel && (
          <div
            className="w-max rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
            role="dialog"
            aria-label="Blueprint layers"
          >
            <label
              className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
              title="Green footprints: plants, rocks, planters, chairs, loungers"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-emerald-700"
                checked={landscapingVisible}
                onChange={(e) => onLandscapingVisibleChange?.(e.target.checked)}
              />
              Landscaping / movable
            </label>
          </div>
        )}
        {show3dPanel && !layersOpen && (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm hover:bg-accent"
            onClick={() => setLayersOpen(true)}
            aria-label="Show layers"
            title="Show Trees & Areas"
          >
            <Layers className="h-3.5 w-3.5" />
            Layers
            {hiddenCount > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                {hiddenCount} off
              </span>
            )}
          </button>
        )}
        {show3dPanel && layersOpen && (
          <div
            className="w-max max-w-[14rem] rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
            role="dialog"
            aria-label="3D layers"
            title="Turn areas off to declutter — floors, walls, and fixtures in that zone hide"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Layers
              </span>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setLayersOpen(false)}
                aria-label="Hide layers"
                title="Hide panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {typeof onShortWallsChange === 'function' && (
              <label
                className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                title="Walls and doors at 10% height from the floor — cabinets and appliances stay full size"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-zinc-800"
                  checked={shortWalls}
                  onChange={(e) => onShortWallsChange(e.target.checked)}
                />
                Short walls (10%)
              </label>
            )}
            {typeof onTreesVisibleChange === 'function' && (
              <label
                className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                title="Pine, palm, cypress, and other trees"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-zinc-800"
                  checked={treesVisible}
                  onChange={(e) => onTreesVisibleChange(e.target.checked)}
                />
                Trees
              </label>
            )}
            {typeof onHiddenAreasChange === 'function' && sortedAreas.length > 0 && (
              <div className="mt-2 border-t border-border/60 pt-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                    Areas
                  </span>
                  <span className="flex gap-1.5 text-[10px] font-bold">
                    <button
                      type="button"
                      className="text-foreground/70 hover:text-foreground"
                      onClick={() => onHiddenAreasChange([])}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="text-foreground/70 hover:text-foreground"
                      onClick={() => onHiddenAreasChange([...sortedAreas])}
                    >
                      None
                    </button>
                  </span>
                </div>
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-0.5">
                  {sortedAreas.map((name) => {
                    const on = !hiddenSet.has(name)
                    return (
                      <label
                        key={name}
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 shrink-0 accent-zinc-800"
                          checked={on}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onHiddenAreasChange(hiddenAreas.filter((n) => n !== name))
                            } else {
                              onHiddenAreasChange(
                                hiddenAreas.includes(name) ? hiddenAreas : [...hiddenAreas, name]
                              )
                            }
                          }}
                        />
                        <span className="truncate">{name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
