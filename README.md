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
# Production build + run
docker compose up --build web
```

Open [http://localhost:3000](http://localhost:3000).

Hot-reload development:

```bash
docker compose --profile dev up --build dev
```

Stop with `Ctrl+C`, or `docker compose down`.

## Quick start (local)

```bash
pnpm install
pnpm --dir app install
pnpm --dir app dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 15, React 19, TypeScript |
| State / UI | Zustand, Tailwind, Radix |
| 3D | Three.js |
| Core library | `src/` (Blueprint3D ES modules) |

## License

MIT. Upstream: Blueprint3D Modern by charmlinn. Furniture CDN assets remain under their original terms.
