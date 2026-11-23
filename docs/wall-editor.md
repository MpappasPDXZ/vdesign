# Wall Editor

Canonical UI contract for editing an existing wall. Enforced by `.cursor/rules/wall-editor.mdc` and `PAPERCUTS.md`.

## How to open (only these)

| Gesture | Result |
|---------|--------|
| **Click** the blue numbered `#` badge on the 2D plan | Opens Wall Editor for that wall (stays open on double-click — does not toggle closed) |
| **Click** the wall row in the left sidebar **Edit** → wall list | Opens the same editor |
| Click empty plan, or **X** on the panel | Closes editor |

**Not supported:** clicking the wall body/centerline (badge-only hit-test). Do not toggle-close on badge re-click — that made double-clicks look like “nothing happened.”

If the panel is missing, fix **open + portal** before any field/Apply work — see papercut *Wall Editor open/visibility hell*.

## What it is

A single panel titled **Wall Editor** (`#n` when numbered). Not an add flow. Not a second place to commit geometry.

**Position:** `createPortal` → `document.body`, then `fixed right-3 top-14 z-[70] w-[300px]`. Never a child of `#floorplanner`. **Connect host #** is a compact control (not a full-width row).

## Function → data collection

Apply is one script. Each step collects only the fields it needs — no dual keys.

| Apply step | Function | Reads (UI state) | Writes (model / schedule) |
|------------|----------|------------------|---------------------------|
| Specs | assign on `Wall` | length*, thickness, type, exposure, name | `wall.thickness/wallType/exposure/name`; schedule `outerLength`, `thickness`, `wallType`, `exposure`, `name`, lineages |
| Tip join | `placeAgainstWall(host, 0, false, tip, span, lengthCm)` | connect #, tip, span, length | geometry; schedule via `onConnectSaved`: `connectsToWall`, `connectsAt`, `extends` |
| Highlight host | `setConnectHostWall` | connect # | plan stroke orange `#ea580c` (session only) |
| Offset | `relativeMoveWithAttached` | move dir, inches, chain-neighbor | geometry; schedule `offsetInches`, `offsetDir`, `offsetLineage` |

\*Length is passed into `placeAgainstWall` / `setSpanFrom` as `lengthCm` — **not** a pre-pass `setLength` on a joined stub.

**Do not persist:** `fromEndInches`, `fromEndIn`, `fromTopIn`, `connectsTo`, `orientation` (read-only migrate on open only).

## UI → state → keys (closed set)

| UI | React state | Schedule key |
|----|-------------|--------------|
| Connects to `#` | `connectTo` | `connectsToWall` |
| On tip | `hostTip` | `connectsAt` |
| Start→finish | `spanDir` | `extends` |
| Length / thickness / type / exposure / name | matching state | matching keys |
| Carpenter square → length | `lengthLineage` | `lengthLineage` (`lines` + `totalInches`) — persist on **Use sum** and on **Apply** |
| Carpenter square → thickness | `thicknessLineage` | `thicknessLineage` |
| Carpenter square → offset | `moveLineage` | `offsetLineage` |
| Offset dir + distance | `moveDir`, `moveInches` | `offsetInches`, `offsetDir` |
| Chain neighbor | `bringAttached` | — (session) |

## Sections (order)

1. **Placement** — host # · tip · start→finish  
2. **Specs** — length · thickness · type · exposure · name  
3. **Offset** — move dir · inches  

## Geometry invariants

- Walls stay **E–W or N–S** (no diagonals unless product asks).  
- Apply on a stub must not reshape the Connect host (unless chain-neighbor).  
- Zero-length walls are invalid (load skips / repairs; half-edge guards NaNs).

## Lifecycle

| Action | One way |
|--------|---------|
| **Add** | Sidebar / Insert / Exterior walls |
| **Edit** | Open → fields → **Apply** |
| **Delete** | Trash in header |

Helpers: section title **hover** only.

## Carpenter’s square (measurement lineage)

| Action | What happens |
|--------|----------------|
| Open square · enter lines · **Use sum** | Fills the inch field; writes `lengthLineage` / `thicknessLineage` / `offsetLineage` on that wall’s schedule row; **persists to IndexedDB immediately** |
| **Apply** | Re-writes the same lineage keys with the wall (null clears) |
| Reload | Schedule restored from IndexedDB → lineage shown under the inch field |

Lineage shape: `{ lines: string[], totalInches: number }`. Editing the inch box by hand clears lineage for that field.
