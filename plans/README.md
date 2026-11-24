# plans/ — git-backed floorplan saves

**Save Plan** writes here automatically (via `/api/plans`):

| File | Role |
|------|------|
| `{Plan-Name}.json` | **Latest** — always overwritten on Save |
| `versions/{Plan-Name}/{timestamp}.json` | **History** — one file per Save |
| `versions/{Plan-Name}/manifest.json` | Index of recent saves |

## UI

- **Save Plan** → IndexedDB + `plans/{name}.json` + new version file  
- **Load latest** → reads newest `plans/*.json` back into the editor  

## Parallel agents (theatre / stairs / gym)

Do **not** overwrite `{slug}.json` with a stale full document. Use `POST /api/plans` with `baseMtimeMs` + `merge: true` (default). See `docs/parallel-item-adds.md` and `.cursor/rules/parallel-item-adds.mdc`.

## Docker

`docker-compose` mounts `./plans` → `/app/plans` (`VDESIGN_PLANS_DIR`).  
Restart compose after pulling this change so the volume exists.

## Git

Commit `plans/*.json` and `plans/versions/**` when you want durable history on the remote.  
Cursor’s browser and Chrome share this folder once Save Plan succeeds — that is the cross-browser source of truth.
