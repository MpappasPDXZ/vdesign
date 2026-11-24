# Parallel plan agents (theatre / stairs / gym)

Agent rule: `.cursor/rules/parallel-item-adds.mdc` (`alwaysApply: true`).

## Why writes were clobbering

The filesystem lock only **serializes** writes. If three agents each Load the same snapshot, edit their own slice, then Save the **full** JSON, the last writer wins and the others’ work disappears.

Fix: **domain ownership + Load → edit → merge POST → verify**, with server **merge-on-write** under the lock.

## Sync layers

| Layer | Behavior |
|---|---|
| Scene `addItem` | Concurrent loads OK; `items[]` grows as each finishes |
| `persistPlanNow` | No-ops while `itemsLoadingRef > 0` |
| Recovery snapshot | When load counter hits 0 |
| `POST /api/plans` | Per-slug queue + `.write.lock`; merge with disk unless `baseMtimeMs` still matches |
| `mergePlanProjects` | Unions items / entrances / areas / floorFinishes; merges wallSchedule by `#` |

## Domain ownership

| Agent | Owns | Hands off |
|---|---|---|
| Theatre | Theatre items / area notes | Gym finishes, stair entrances |
| Stairs | Stair entrances + opening items | Theatre layout, Gym finishes |
| Gym | `floorFinishes` for Gym + gym items | Theatre items, stair entrances |

Wall geometry: **one agent at a time**.

## Sequence

1. `GET /api/plans?latest=1&slug=…` → keep `mtimeMs`
2. Apply **only** your domain delta
3. `POST /api/plans` with `{ project, name, baseMtimeMs, merge: true }`
4. `GET` latest again — confirm your rows **and** peers’ rows
5. On failure: re-fetch → re-apply your delta only → retry once

Never write `plans/{slug}.json` with the editor Write tool during parallel work.

## 3D on add

Entrances and catalog items must use `handleViewChange('3d')` so the 3D viewer unlocks orbit/resize — not a silent `setViewMode('3d')` alone.

## Intentional full replace

`merge: false` overwrites latest. Use only when you are the sole writer (e.g. restoring a known-good version).
