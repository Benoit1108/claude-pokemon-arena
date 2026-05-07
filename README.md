# claude-pokemon-arena

Web arena for [`claude-pokemon`](https://github.com/Benoit1108/claude-pokemon) — leaderboard, trainer cards, async battles between trainers worldwide.

![arena demo](.demo/arena-demo.gif)

> Recorded via `.demo/record.mjs` (Playwright + tiny mock API server) → `.demo/build-gif.sh` (ffmpeg). See [`.demo/README.md`](.demo/README.md) to regenerate.

This is **Phase 2** of the [claude-pokemon roadmap](https://github.com/Benoit1108/claude-pokemon/blob/main/ROADMAP.md). The CLI raises the Pokémon, this site is where they compete.

## Stack

- **Nuxt 4** (Vue 3) with file-based routing + auto-imports
- **UnoCSS** with `preset-wind4` (Tailwind v4-compatible) — atomic CSS, fast build
- **TypeScript** strict mode
- **Cloudflare Pages** deployment (free tier, edge SSR)
- Backend : the existing [`claude-pokemon-api`](https://claude-pokemon-api.benoit-dev.workers.dev) Worker (REST, KV-backed)

## Local dev

```bash
npm install
npm run dev
```

Opens on http://localhost:3000.

The site fetches the live Worker API at `https://claude-pokemon-api.benoit-dev.workers.dev`. To point at a local Worker for development :

```bash
NUXT_PUBLIC_API_BASE=http://localhost:8787 npm run dev
```

## Project structure

```
claude-pokemon-arena/
├── app/
│   ├── app.vue                  # Root layout
│   ├── pages/
│   │   ├── index.vue            # Homepage : aggregate + leaderboard
│   │   ├── trainer/[anonId].vue # (Phase 2.2) Public trainer card
│   │   ├── battle/[id].vue      # (Phase 2.3) Battle replay
│   │   └── pokedex.vue          # (Phase 2.2) 251 Pokémon grid + shiny rates
│   ├── composables/
│   │   └── useApi.ts            # Typed Worker API wrappers
│   └── components/              # (TBD)
├── uno.config.ts                # UnoCSS theme : lineage accents + pixel-render
├── nuxt.config.ts               # Nuxt config + runtime API base
└── package.json
```

## Deployment

Cloudflare Pages, configured to build from this repo's `main` branch.

```bash
NITRO_PRESET=cloudflare-pages npm run build
# Output goes to .output/, served by CF Pages
```

Project name on Cloudflare : `claude-pokemon-arena` → `claude-pokemon-arena.pages.dev` (or custom domain at Phase 4).

## Roadmap

See [`claude-pokemon/ROADMAP.md`](https://github.com/Benoit1108/claude-pokemon/blob/main/ROADMAP.md) for the global plan. This repo addresses Phase 2 :

- **2.1** ✓ — Setup & infra (this commit)
- **2.2** ☐ — Trainer pages, pokédex grid
- **2.3** ☐ — Combat engine + battle replay (also touches the Worker repo)
- **2.4** ☐ — Animations & polish

## License

MIT — same as `claude-pokemon`.
