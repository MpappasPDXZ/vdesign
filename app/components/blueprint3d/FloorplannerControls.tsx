'use client'

import { Move, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FloorplannerControlsProps {
  /** Edit on — select / edit / move / delete allowed. Off = view only (pan / orbit / zoom). */
  editActive: boolean
  /** Active sidebar tool while editing (Wall = draw, Remove = delete) — label only. */
  mode: 'move' | 'draw' | 'delete'
  /** Plan has edits not yet written with Save Plan. */
  dirty: boolean
  saving?: boolean
  onEdit: () => void
  onSave: () => void
  onDone: () => void
  className?: string
}

const MODE_TAG: Record<FloorplannerControlsProps['mode'], string> = {
  move: 'Editing',
  draw: 'Drawing',
  delete: 'Deleting'
}

/**
 * Bottom-left toolbar (2D + 3D): Edit → Save → Done.
 * - Edit: turn editing on (click badges / furniture; edit, move, delete in their panels).
 * - Save: write the plan (repo + browser) — only enabled after an edit has been made.
 * - Done: leave edit mode, back to view mode.
 * Draw / Delete are not here; they live in the sidebar (Wall / Remove).
 */
export function FloorplannerControls({
  editActive,
  mode,
  dirty,
  saving = false,
  onEdit,
  onSave,
  onDone,
  className
}: FloorplannerControlsProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto relative flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-lg backdrop-blur-sm transition-shadow',
        // Edit mode indicator — orange outline (same color as the selected-item ring on the plan).
        editActive && 'border-orange-500 ring-2 ring-orange-500 shadow-orange-500/30',
        className
      )}
      data-edit-active={editActive ? 'true' : 'false'}
    >
      {editActive && (
        <span className="pointer-events-none absolute -top-2.5 left-2 rounded bg-orange-500 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white shadow">
          {MODE_TAG[mode]}
        </span>
      )}
      <Button
        size="sm"
        variant={editActive ? 'default' : 'ghost'}
        onClick={onEdit}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title="Edit — click walls, entrances and furniture to edit, move or delete"
        aria-label="Edit"
        aria-pressed={editActive}
      >
        <Move className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        variant={dirty ? 'default' : 'ghost'}
        onClick={onSave}
        disabled={!dirty || saving}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title={dirty ? 'Save plan' : 'Nothing to save — make an edit first'}
        aria-label="Save plan"
      >
        <Save className="h-3.5 w-3.5" />
        Save
      </Button>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <Button
        size="sm"
        variant="outline"
        onClick={onDone}
        disabled={!editActive}
        className="h-8 gap-1.5 px-2.5 text-xs"
        title="Done — back to view mode"
        aria-label="Done"
      >
        <Check className="h-3.5 w-3.5" />
        Done
      </Button>
    </div>
  )
}
