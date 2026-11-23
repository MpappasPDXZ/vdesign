# Interior fit-out roadmap

Papercut-aligned plan. Every phase ships with: **How to open**, **field→function map**, **one Add / one Apply / one Delete**, portal editors to `document.body`. See `PAPERCUTS.md` and `docs/wall-editor.md`.

**Invariant:** no entrance/window/switch/fixture without a host (wall or ceiling plane). No area without a closed wall cycle. No flooring without an area.

---

## Phase order (do not skip)

| Phase | Deliverable | Depends on |
|-------|-------------|------------|
| **0** | Walls stable (done) | — |
| **1** | **Entrance Editor** — doors as wall openings, 2D + 3D | walls |
| **2** | Windows (same host model as entrances) | Phase 1 patterns |
| **3** | **Area Editor** — click wall corners → congruent closed polygon | walls |
| **4** | **Flooring** — type/material per area | Phase 3 |
| **5** | Wall / ceiling finishes (paint, tile) | walls + areas |
| **6** | Light switches (on-wall, height + offset) | walls |
| **7** | Light fixtures (ceiling / wall-mounted) | areas + walls |
| **8** | Furniture / equipment (floor items) | areas preferred |

---

## Phase 1 — Entrance Editor (now)

**Test slices (easiest → harder):** #1 Add on selected wall · #2 Edit/Apply/Delete · #3 2D badge/gap.

**Product rule:** No entrance without a drawn wall. Entrance kinds include **door** and **stairs** (opening cut in that wall + optional leaf/run mesh in 3D).

| Action | One way |
|--------|---------|
| **Add** | Sidebar **Door** / **Entrance** — requires selected wall `#`, or pick wall first |
| **Edit** | Click entrance badge (2D) or door mesh (3D) → **Entrance Editor** → **Apply** |
| **Delete** | Trash in Entrance Editor |

**Open path (only):** entrance `#` badge on wall · or 3D click door · or list under Edit. Panel: `createPortal` → body, `fixed right-3 top-14 z-[70]`.

**Canonical schedule keys** (see `docs/entrance-editor.md`):

- `wallN` — host wall number (required)
- `fromEndInches` / tip — distance along wall from chosen tip (single mid-span concept for entrances; not dual with Offset)
- `widthInches`, `heightInches`, `sillInches` (sill usually 0 for doors)
- `swing` / `hand` (optional leaf)
- `name`, lineages for width/height

**Geometry:** place `InWallFloorItem` (type 7) on host wall; `Edge` already cuts holes from `wall.items`. Persist in project `entrances[]` + item serialization.

---

## Phase 3 — Area Editor

- Click existing wall **corners** (or wall tip points) in order → close polygon when returning to start.
- Congruent = axis-aligned edges only (E–W / N–S), matching wall invariant.
- Store `areas[]`: `{ id, name, cornerIds[] | pointCm[], floorFinish? }`.
- Replace/extend today’s label-only `AreaLabel` with real polygons + 2D fill + 3D floor mesh.

---

## Phase 4 — Flooring

- Area Editor section **Flooring**: type (concrete, carpet, tile, …), optional lineage.
- One Apply writes finish → updates 3D floor material for that room/area.

---

## Phases 5–8 (sketch)

- **Finishes:** wall face / ceiling material refs; no second Apply path.
- **Switches:** on-wall item, height + inches-from-tip; host wall required.
- **Fixtures:** ceiling host = area; wall sconce = wall host.
- **Furniture:** floor items; snap to area optional.

---

## Engineering rules (every phase)

1. Field → function table in that phase’s `docs/*-editor.md` **before** UI.
2. No dual schedule keys for one concept.
3. Host sacred — placing a door must not move the wall.
4. Hot-reload Docker (`Dockerfile.dev`); wipe `.next` volume if stack traces show deleted symbols.
5. Ship Phase 1 vertical slice before Area Editor.
