# vdesign

**2D/3D floor planner for dimensions and layout.** Draw walls in 2D with typed lengths, place furniture and venue equipment, then flip to 3D.

Built on [Blueprint3D Modern](https://github.com/charmlinn/blueprint3d-modern) (MIT) — Next.js 15, React 19, Three.js, Zustand, Tailwind.

## Features

- **2D / 3D toggle** — one scene model drives both views
- **Wall drawing** — snap, move, delete, and typed lengths (`26'`, `41'-4"`, `800cm`)
- **Imperial & metric** — ft/in, m, cm, mm
- **Furniture catalog** — beds, seating, storage, doors, windows
- **Venue / layout objects** — turf mats, netting, L-screen, pitching machine (procedural)
- **Local save** — IndexedDB, no account required

## Quick start (Docker)

With Docker Desktop running:

```bash
# Hot-reload development (default) — edits to app/ and src/ apply without rebuild
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

Production image (no hot reload):

```bash
docker compose --profile prod up --build prod
```

Stop with `Ctrl+C`, or `docker compose down`.

## Quick start (local)

```bash
pnpm install
pnpm --dir app install
pnpm --dir app dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cursor AI workflow (no app API keys)

Vision runs **in Cursor**, not inside the Docker app — so you don’t pay per-request cloud vision fees from the product.

### Blueprint → walls

1. Paste a floor blueprint into this chat.
2. Ask the agent to write a project under `app/public/projects/<slug>/`:
   - `blueprint.png` — source image (underlay)
   - `floorplan.json` — `{ meta, underlay, areas, floorplan, items }` (cm units)
3. **Wall order:** always start with the **North** wall, then **clockwise** (N → E → S → W). Origin = NW corner; +X east, +Y south.
4. Add an entry to [`app/public/projects/index.json`](app/public/projects/index.json).
5. Rebuild/restart Docker if needed, open **Projects** → load the seed, verify in **2D** with **Show blueprint**.

Example seed: [`app/public/projects/2713-s-224th-basement/`](app/public/projects/2713-s-224th-basement/).

### Photo + specs → catalog item

1. Paste a product photo and dimensions (W×D×H) into Cursor.
2. Agent appends an entry to [`src/constants.ts`](src/constants.ts) (often `procedural:box:…` / `plane` / `cylinder`) plus an SVG under `app/public/icons/`, and i18n keys in `app/messages/*.json`.
3. Rebuild, then **Add Items** → place and resize in 3D.

### Import any project JSON

**Projects** → **Import JSON file…**, or the top-bar **Import** button. Same format as seed `floorplan.json`.

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 15, React 19, TypeScript |
| State / UI | Zustand, Tailwind, Radix |
| 3D | Three.js |
| Core library | `src/` (Blueprint3D ES modules) |

## License

MIT. Upstream: Blueprint3D Modern by charmlinn. Furniture CDN assets remain under their original terms.
