# Papercuts / lessons learned

Living list of agent mistakes that burned cycles. Read before adding UI fields or “helpful” features.

**Wall Editor contract:** [`docs/wall-editor.md`](docs/wall-editor.md) · rule `.cursor/rules/wall-editor.mdc`

---

## 2026-11-26 — Cabinets saved as `item_type: 7` became fake doors (walk-in "entrances", nuked walls)

**What happened**  
Master walk-in closet cabinets were saved with `item_type: 7` after a load error (`item_type: "procedural"` string). In `src/items/factory.ts`, **7 = `InWallFloorItem`** (wall-cutting door/opening class). Each cabinet snapped to the nearest wall, cut a hole in it, and drew an **E** arc in 2D. Looked like garage→walk-in doors, E arcs that could not be edited, and a "nuked" wall 80. No door entrance was ever added.

**Rules**  
- Procedural **cabinets / cabdrawers / openshelf / counter** use **`item_type: 8`** (`OnFloorItem`). Copy `item_type` from an existing cabinet of the same procedural kind — never from a door.
- `7` is for openings that cut walls (doors, slabs, cased openings). If E arcs appear where no door belongs, check `item_type` first.
- 2D **E badges** come from `wall.items`, not the `entrances[]` schedule. There is no E-badge click editor yet.

---

## 2026-11-23 — White breakthrough / floor z-fighting when orbiting 3D

**What happened**  
Orbiting showed jagged white triangles tearing through hardwood floors. Cause: wall **base fillers** (`edge.ts` `basePlanes` at `y=0`, white `MeshBasicMaterial`) sat on the same plane as room floors. Large cm-scale scenes + `far=200000` made depth fighting worse. Thin carpets (`FloorItem` bottom at exactly `y=0`) added more coplanar layers.

**Rules**  
- Wall foot strips must sit **below** the floor (`y < 0`), not coplanar.  
- Room floors: upward face only (`BackSide` after `rotation.x=+π/2`) + slight `position.y` lift + `polygonOffset`. Do **not** use `FrontSide` with that rotation — floors vanish.  
- Prefer `logarithmicDepthBuffer` on the WebGL renderer for big plans.  
- Floor items: small clearance above `y=0` (`halfSize.y + ε`).

---

## 2026-11-23 — Apply on wall N dragged neighbors (W12 moved W13/W17)

**What happened**  
`setSpanFrom` / `placeAgainstWall` used `moveCornerKeepAxis`: moving this wall’s free tip also translated every other wall on that corner. Editing W12 re-spanned its east tip and slid W13 and W17 with it.

**Rule**  
Wall Editor Apply mutates **only** the edited wall (plus joining its start to the Connect host tip). Shared free-end corners are **split** — never “keep axis” by dragging chain neighbors. Chain-neighbor move is opt-in (`bringAttached`) only on Offset.

**Fix**  
`setCornerIndependent` in `setSpanFrom`: wallCount > 1 → new corner for this wall; leave the old junction alone.

---

## 2026-11-23 — Wall Editor open/visibility hell (debug black hole)

**What happened**  
The Wall Editor became a multi-session debug sink: users could not find the panel at all. Causes stacked:

1. **Secret open gesture** — 2D required **double-click** on the `#` badge while hit-testing only the badge (not the wall body). Single-click did nothing. Docs/i18n still said conflicting things (“click badge” vs “double-click wall”).
2. **Nested `fixed`** — panel rendered **inside** `#floorplanner` (`absolute inset-0`). Viewport-`fixed` under transformed/overflow ancestors is unreliable; alignment papercut already said float to viewport, but the panel stayed a child of the canvas pane.
3. **Two mount sites** — separate copies for 2D vs 3D trees; easy to “fix” visibility in one mode and leave the other broken.
4. **No single “how do I open this?” contract** in `docs/wall-editor.md` — agents kept inventing gestures (double-click, body click, Place button) instead of one documented path.

**Why it was wrong**

- If the user cannot **see and open** the editor, every field/Apply/offset fix is untestable theater.
- Mystery gestures + badge-only hit-test = “clicking does nothing.”
- Modal chrome bugs (alignment, open, z-index) multiply every geometry bug because you cannot verify Apply.

**Rules (hard)**

1. **One open path, documented first.** Wall Editor opens by: **click the numbered `#` badge**, or **click the wall in the left list (Edit tab)**. Badge click **opens only** (never toggle-closes — double-click must not open-then-close). Close via empty canvas or panel **X**. No body-click-to-open.
2. **Portal to `document.body`.** Floating editors use `createPortal(..., document.body)` with `fixed right-3 top-14 z-[70]` — never mount as a descendant of `#floorplanner` / canvas wrappers.
3. **One panel instance.** Prefer a single `selectedWall && <WallPropertiesPanel />` at the app shell (ported), not duplicated under 2D and 3D branches.
4. **Empty canvas click closes; badge click toggles.** Do not invent a third gesture.
5. **Before changing Wall Editor internals**, verify open → visible on the right → Apply → close in the browser. If open is broken, fix open first — do not pile field work on an invisible modal.
6. **Keep i18n/hints in sync** with the real gesture (`clickHint`). Delete stale `doubleClickHint` copy.

**How not to let this happen again**

- `docs/wall-editor.md` must start with **How to open** before sections/fields.
- Any PR that moves the panel’s DOM parent or click handler must update this papercut’s open path and re-test visibility.
- Treat “where is my wall editor?” as a **P0 papercut**, not a user-education problem.

**Fix direction**  
Single-click badge (already badge-only hit-test) · portal panel to `body` · one mount · sync hints.

---

## 2026-11-23 — Modal state must map to app functions (no orphan fields / no diagonals)

**What happened**  
Wall Editor React state (`moveInches`, Connect tip, length, …) was not tied 1:1 to the real apply/persist path. The agent:

- Kept writing **Offset** into **two** schedule keys (`offsetInches` **and** legacy `fromEndInches`) “just in case”
- Restored Offset from whichever field looked populated, so Connect tip-distance and Offset were the same concept twice
- Called geometry helpers (`setLength` then `placeAgainstWall`) without checking what each does to **neighbors** — saving W3 moved/skewed W2
- Allowed **diagonal** wall segments (one corner moved, the other didn’t). Diagonals were **never** a product feature.

**Root failure**  
**We do not create fields (UI or schedule) without knowing exactly which application function reads and writes them.**  
`useState` / schedule keys are not decoration. Each one must answer:

| Question | Required answer before shipping |
|----------|----------------------------------|
| Who **sets** it? | One control or one migrate path |
| Who **reads** it on open? | One restore path |
| Who **writes** it on Apply? | One patch / one connect save |
| What **geometry function** does it drive? | Named call (`placeAgainstWall`, `relativeMoveIndependent`, …) |
| What must **not** change? | Host length, axis, unrelated walls |

If you cannot fill that table, **delete the field** — do not “also sync” it into a second key.

**Rules (hard)**

1. **Field → function map first.** Before adding or keeping a modal `const` / schedule property, document the single read + single write + single geometry call. No dual-write. No “legacy mirror.”
2. **Closed set.** User-outlined sections/fields are closed. Omitted = intentional. Leftover Connect keys (`fromEndInches` as mid-span) are not a second Offset.
3. **One concept, one key.** Mid-span = `offsetInches` + `offsetDir` only. Tip join = Connect host + tip + `fromEndInches: 0`. Never copy Offset into `fromEndInches`.
4. **Apply is a script, not a pile.** Ordered steps only: specs that don’t move corners → tip place + length → offset translate. No pre-pass that mutates joins.
5. **No diagonals. Ever.** Plan walls are **only** east–west or north–south until the user explicitly asks for angled walls. Any mutate that leaves `|dx|` and `|dy|` both large is a bug — snap/reject, don’t ship. Moving one corner of a wall without the matching axis-preserving update on that wall (or a rigid translate of a chain) is forbidden.
6. **Host is sacred.** Editing wall N must not change host length, host axis, or pull a 3+ junction unless the user opted into “chain neighbor.”

**How not to let this happen again**

- Before editing `WallPropertiesPanel` / schedule types: write or update the field→function rows in `docs/wall-editor.md`.
- After Apply code changes: mentally (or with a script) check **W2 unchanged when Apply W3**; both walls axis-aligned; schedule has **one** offset key.
- If a legacy field still exists on disk, **migrate on read** into the canonical key — do not keep writing the legacy key.

**Fix direction**  
Canonical Offset only; Connect tip always 0″ in save; length via place/span not a host-dragging `setLength`; enforce axis alignment after mutations.

---

## 2026-11-23 — Offset saved twice (`offsetInches` + `fromEndInches`)

Superseded by **Modal state must map to app functions** above. Same incident: dual-write Offset/`fromEndInches`, bad Apply order, host drag.

---

## 2026-11-23 — Duplicate “offset” on wall edit

**What happened**  
Wall properties got two inch boxes that both felt like “offset”:

1. Placement → “Inches from tip” (along-host distance for Place)
2. Offset → “Distance (inches)” (Move translate)

Same number (88) showed in both. User had already specified three sections:

- **Placement** — Connection · On tip · Start→finish  
- **Specs** — Length / Thickness · Type / Interior·Exterior  
- **Offset** — Move  

“Inches from tip” was **not** in that list. It was leftover Connect UX dumped into Placement anyway.

**Why it was wrong**

- Two controls, overlapping mental model, different verbs (Place vs Move).
- Added without proving the field’s **unique** job vs Offset/Move.
- Forced re-explain, re-test, rebuild loops.

**Rule**

1. Do **not** add a control unless you can state in one sentence what it does that **no existing control** does.
2. If the user gave a section outline, treat omitted fields as **intentionally omitted** — not forgotten.
3. Never put two inch inputs that a user would both call “offset” unless they live in one section with **distinct, non-synonym labels** and one shared mental model.
4. Prefer deleting / consolidating over “keep both just in case.”

**Fix direction**  
Placement = Connection · On tip · Start→finish only — **no** inches-from-tip, **no** Place button.  
Offset = Move direction + distance (default last saved or 0) — **no** Move button.  
**One Apply** commits placement + specs + offset.

---

## 2026-11-23 — Multiple apply paths (Place / Move / Apply)

**What happened**  
Wall edit had separate **Place**, **Move**, and **Apply** buttons. Same parameters could be committed three different ways. That meant three code paths, three toast/undo stories, and endless “did you click Place or Apply?” testing.

**Why it was wrong**

- Parameters are not verbs. Connection, tip, length, offset, etc. are **inputs**; committing them is **one** action.
- Extra commit buttons invite partial updates (Place without length, Move without connect) and duplicate bugs.
- Same anti-pattern applies to furniture, doors, and any entity: add ≠ edit ≠ delete, and edit has **one** save.

**Rule — one way each**

| Action | Count |
|--------|-------|
| **Add** | One way |
| **Edit / apply parameters** | One way (e.g. a single **Apply**) |
| **Delete** | One way |

No Place + Move + Apply. No “quick apply” beside a field if Apply already exists. No second modal that also writes the same wall.

**Fix direction**  
Panel fields only set state. **Apply** writes placement + specs + offset in one shot. Delete stays its own control. Add stays wherever Add already lives (sidebar / insert) — not a second Add inside the editor.

---

## 2026-11-23 — Helper text in body / under titles

**What happened**  
Hints lived as paragraphs under fields and inside modals (“Direction this wall runs…”, “Off = only this wall…”). They clutter the panel and compete with the real controls.

**Rule**  
Do **not** put helper text in the modal body or below titles/fields. Helper copy goes **on hover of the section (or dialog) title** only (tooltip / `title`). Saved measurement lineage under an inch field is data, not helper text — that stays.

---

## 2026-11-23 — Editor/modal alignment (not viewport-right)

**What happened**  
Wall Editor used `absolute right-3` inside `#floorplanner` (or another layout child). It looked hard-aligned / stuck mid-layout instead of floating on the **right of the window** at every width. Same risk for door/item inspectors nested under partial-width parents.

**Why it was wrong**

- `absolute` is relative to the nearest positioned ancestor — not the viewport. Sidebar, split panes, or `inset` children shift “right.”
- Users expect floating editors pinned to the **window** edge, independent of canvas/sidebar width.

**Rule**

1. Floating editors/inspectors (Wall Editor, item/door panels) pin to the **viewport**: prefer `fixed` + `right` / `top` (with safe gaps), not `absolute` inside a content pane.
2. Width is a fixed max (e.g. `w-[300px]`), never `w-full` / `min(100%, …)` that stretches with a weird parent.
3. Before shipping, resize the window and open/close the sidebar — the panel must stay on the right of the **window**.

**Fix direction**  
`fixed right-3 top-14 z-[70] w-[300px] max-h-[calc(100vh-4rem)]` (or equivalent). Render once at the edit-view (or app) root if needed — not buried under a non-full-bleed parent.

---

## 2026-11-23 — Rebuilding Docker for every UI tweak

**What happened**  
Iteration used the production `web` image (`NODE_ENV=production`). Every panel/CSS change needed a full rebuild (~40s+) because there is no hot reload.

**Rule**  
Day-to-day work uses the **default compose service** (Dockerfile.dev + bind mounts for `app/` and `src/`). Do **not** rebuild the production image for UI/editor iteration. Use `docker compose --profile prod up prod` only when verifying a prod build.

---

## 2026-11-23 — Entrances in plan JSON but invisible in 2D/3D after Load latest

**What happened**  
Agent wrote `entrances[]` + type-7 `procedural:box` items into `plans/*.json`. Load latest / IndexedDB had the doors attached to the right walls (`wall.items`), but the user saw **zero** openings in both views.

**Root causes (stacked)**

1. **3D holes dead on Three r181** — `Edge.makeWall` used `THREE.ShapeGeometry(shape)` after pushing `shape.holes`. In Three.js r152+, `ShapeGeometry` **silently ignores holes** (always an 8-vert quad). Wall meshes never cut openings; door boxes sat inside solid walls and looked like “nothing loaded.”
2. **2D never drew entrances** — `floorplanner_view` stroked solid walls only. No gaps, no glyphs, no badges — so Load latest in the default 2D mode looked identical with or without doors. Docs called 2D gap/badge “priority #3” but it was never shipped; agent treated “items in JSON” as done.
3. **“Visible in scene” ≠ “visible to user”** — DevTools showed 6 door meshes with correct positions. That is not a pass. Camera-facing culling + buried meshes without holes = false confidence.
4. **Agent verified the API/file, not the pixels** — POST `/api/plans` + `items.length === 6` was treated as success. No Load latest → 2D gap check → 3D hole check.

**Rules (hard)**

1. **Wall openings must use hole triangulation that works on the pinned Three version** — `ShapeUtils.triangulateShape` (or ExtrudeGeometry), **not** `ShapeGeometry` for holed walls. After any Three upgrade, assert a wall with one door has **> 8** plane vertices.
2. **Load latest is not done until openings are visible in both 2D and 3D** — 2D: wall stroke gaps + entrance badge/glyph; 3D: hole through the wall (+ leaf mesh). Schedule/`entrances[]` alone is not a render.
3. **Do not trust item counts** — Prove with a screenshot or by counting hole vertices / 2D gap spans after Load latest.
4. **After `floorplan.update()`, re-bind wall items and `fireRedraw`** — HalfEdges are recreated every update; stale edge refs + skipped redraw = openings vanish on 2D↔3D toggle.

**Fix direction**  
`shapeGeometryWithHoles` in `src/three/edge.ts` · 2D gaps/glyphs in `floorplanner_view` · `FloorplanThree.redraw` re-binds items + `fireRedraw` · Load path forces wall redraw after serialize load.

---

## Standing principles

| # | Principle |
|---|-----------|
| 1 | **Field → function or delete.** Every modal/schedule field has one setter, one reader, one Apply writer, one geometry call. No orphans, no dual-write. |
| 2 | **Unique usage or don’t ship.** If you can’t name the unique usage, don’t add the field. |
| 3 | **User outline wins.** Spec lists are closed sets until they say otherwise. |
| 4 | **One concept, one place.** Duplicate labels / twin inch boxes / twin schedule keys = papercut. |
| 5 | **Understand before inventing.** Ask or re-read the last clear layout before inventing UI. |
| 6 | **No diagonals** until explicitly requested. Walls stay E–W or N–S; skewed segments are bugs. |
| 7 | **Host is sacred.** Apply on a stub must not reshape the Connect host. |
| 8 | **One add, one edit/apply, one delete.** Never multiple ways to commit the same entity’s parameters. |
| 9 | **Helpers on title hover only.** No helper paragraphs in modals or under section titles. |
| 10 | **Float to the viewport.** Editor panels use `fixed` + **`createPortal` to `document.body`** — never under `#floorplanner`. |
| 11 | **One open path.** Wall Editor: single-click `#` badge or sidebar list. No double-click mystery. Document in `docs/wall-editor.md` first. |
| 12 | **Open before fields.** If the panel cannot be opened/seen, fix that before any Apply/geometry work. |
| 13 | **Hot reload for iteration.** Default Docker = Dockerfile.dev; rebuild prod only when needed. |
| 14 | **Openings must show in 2D and 3D.** Plan JSON / item counts are not a pass — holes + 2D gaps after Load latest are. |
