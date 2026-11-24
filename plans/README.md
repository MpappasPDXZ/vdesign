# plans/ — git-backed home saves

**Save Plan** writes here automatically (via `/api/plans`):

| File | Role |
|------|------|
| `{Home-Name}.json` | **Latest home** — one address, many **levels** (basement, backyard, …) |
| `versions/{Home-Name}/{timestamp}.json` | **History** — one file per Save |
| `versions/{Home-Name}/manifest.json` | Index of recent saves |

## Home format (`vdesign-home-v1`)

```json
{
  "format": "vdesign-home-v1",
  "meta": { "name": "2713-S-224th", "address": "…" },
  "activeLevelId": "basement",
  "levels": [
    { "id": "basement", "name": "Basement", "floorplan": {…}, "items": […], … },
    { "id": "backyard", "name": "Backyard", "floorplan": {…}, "items": […], … }
  ]
}
```

Legacy single-level `*-Basement.json` / `*-Backyard.json` files still load (wrapped as a one-level home). Prefer the combined home slug.

## UI

- **Save Plan** → patches the **active level** into `plans/{home}.json` (+ version)
- **Level** dropdown → switch Basement / Backyard / … inside the same home
- **Reload** → re-read the home from `plans/` (keeps the level you’re on when possible)

## Parallel agents (theatre / stairs / gym)

Do **not** overwrite `{slug}.json` with a stale full document. Use `POST /api/plans` with `baseMtimeMs` + `merge: true` (default) and the correct `levelId`. Merge is **per level** — other levels on disk are preserved. See `docs/parallel-item-adds.md` and `.cursor/rules/parallel-item-adds.mdc`.

## Docker

`docker-compose` mounts `./plans` → `/app/plans` (`VDESIGN_PLANS_DIR`).  
Restart compose after pulling this change so the volume exists.

## Git

Commit `plans/*.json` and `plans/versions/**` when you want durable history on the remote.  
Cursor’s browser and Chrome share this folder once Save Plan succeeds — that is the cross-browser source of truth.
