# Plan recovery backups

Snapshots of the basement floorplan taken before UI refactors, so edits are not lost if something goes wrong.

| File | Source |
|---|---|
| `floorplan-backup-2026-11-23-pre-menu-refactor.json` | Working tree copy before menu redesign |
| `floorplan-from-git-HEAD.json` | Last committed version from git HEAD |

## Browser recovery (runtime)

While editing, the app also writes:

1. **localStorage** key `vdesign-plan-recovery` — automatic every ~1.5s and on Save
2. **IndexedDB** (`blueprint3d_floorplans`) — when you click **Save Plan**
3. **Download** — menu download icon writes a `.json` file to disk

On load, if a localStorage recovery snapshot exists, a toast offers **Restore**.

## Restore a file backup into the app

1. Open the left menu → Import (upload icon)
2. Choose one of the JSON files in this folder
3. Or copy a backup over `projects/2713-s-224th-basement/floorplan.json` and reload
