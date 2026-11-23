# Entrance Editor

Canonical UI for **entrances** on walls — not door-only. Doors and **stairs** (and later gates) are entrance kinds. Enforced by `.cursor/rules/entrance-editor.mdc` and `PAPERCUTS.md`.

## How to open (only these)

| Gesture | Result |
|---------|--------|
| **Add** | Select a wall `#` first → sidebar **Entrance** → pick **Door** or **Stairs** → places on that wall |
| **Edit** | Click entrance badge on 2D plan, or click entrance mesh in 3D, or Edit list row (priority #2) |
| **Close** | Empty canvas / **X** |

**Hard rule:** cannot Add without a host wall. No floating entrances.

**Position:** `createPortal` → `document.body`, `fixed right-3 top-14 z-[70] w-[300px]`.

## Kinds

| Kind | Catalog key | Model | Cuts wall hole |
|------|-------------|-------|----------------|
| `door` | `doorOne` (default) | GLB leaf | yes (`InWallFloorItem`) |
| `stairs` | `entranceStairs` | procedural box placeholder | yes (`InWallFloorItem`) |

Persist `kind` on item metadata (`entranceKind`) and later `entrances[]` schedule.

## Sections (order) — editor priority #2

1. **Host** — wall `#` · tip · inches from tip · **kind** (door / stairs)  
2. **Opening** — width · height · sill (doors/stairs default sill `0`)  
3. **Leaf / run** — door swing/hand · or stair notes (optional; opening still cuts wall)

## Field → function map

| UI / state | Persist key | Restore | Apply geometry |
|------------|-------------|---------|----------------|
| Kind | `kind` | schedule / metadata | catalog swap if needed |
| Host wall `#` | `wallN` | schedule | `placeOnWall(host, …)` |
| Tip | `fromTip` N/E/S/W | schedule | origin for along-wall measure |
| Inches from tip | `offsetInches` | schedule | position along wall centerline |
| Width / height | `widthInches` / `heightInches` | schedule | item scale / hole size |
| Sill | `sillInches` | schedule | vertical offset (0 = floor) |
| Name | `name` | schedule | item metadata |

**One Apply** writes opening + kind + schedule + IndexedDB. No Place + Move + Apply.

## Lifecycle

| Action | One way |
|--------|---------|
| **Add** | Sidebar **Entrance** → Door \| Stairs (wall selected) |
| **Edit** | Open editor → fields → **Apply** |
| **Delete** | Trash in header |

## Geometry

- Model: `InWallFloorItem` on `wall.items` → `Edge` rebuilds shape with holes.
- Place: `WallItem.placeOnWall(host, alongFraction)` — mid-span default `0.5`.
- 2D: gap / glyph on wall centerline + badge (priority #3).
- 3D: hole + mesh; clickable for editor (priority #2).

## Test — priority #1 (Add)

1. Click a wall `#` badge (wall selected).
2. Sidebar **Entrance** → **Door** or **Stairs** (no wall → error; no place).
3. App switches to **3D**; opening cut in that wall.
4. Host wall length/axis unchanged.
