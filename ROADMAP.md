# Roadmap

The arena is **Phase 2** of the broader `claude-pokemon` ecosystem. The
authoritative roadmap (Phases 1 → 4 + decisions log) lives in the CLI repo :

→ **[claude-pokemon/ROADMAP.md](https://github.com/Benoit1108/claude-pokemon/blob/main/ROADMAP.md)**

## Where we are

- Phase 2.1 → 2.10 : **shipped** (Nuxt scaffolding through real-time PvP)
- Phase 2.11 (pokédex-driven achievements) + 2.12 (sound theme switcher, easter eggs, QR sync) : **not started**
- Phase 2.13+ stretch — partial : **i18n FR/EN web** done (Sprint 5)
- Sprint 5 polish + recovery-key sign-in : **shipped** (see [CHANGELOG.md](./CHANGELOG.md))
- Phase 2.14 (wild & traded Pokémon en arène, chart 18 types) — web side **shipped** : per-type rendering for non-starter lineages (`app/utils/lineage.ts`). Engine/worker side in the CLI repo.
- Phase 2.15 (refonte scène de combat) — **shipped** : `BattleStage` sur 9 décors anime-style par environnement (dérivés du type adverse / `scene="arena"`), Pokémon posés en diagonale sur le cercle de combat central (ancres communes, cohérentes sur tous les fonds). Sprites corrects pour les wilds (`trade-*` → species sprite) **shipped**. (Reste éventuel : même fix côté CLI `lib/` pour la statusline si un wild y est actif.)

## What's next for this repo

In rough order :

1. **Phase 2.11** — Pokédex-driven achievements. Cross-cutting badges tied to wild encounter data, surfaced on `/trainer/[anonId]`. Touches CLI (badge conditions) + worker (bitmap field on submit payload) + web (new section on the public trainer card).
2. **Phase 2.12** — Easter eggs + sound themes + CLI ↔ web QR sync. Partial : Konami code already in `app/pages/index.vue`. Remaining : 3-state sound theme cycle (8-bit / orchestral / silent), 10× logo click animation, `?secret=` URL param, QR pairing flow.
3. **Phase 3** — Discord bot (new repo `claude-pokemon-bot`, Cloudflare Workers + HTTP Interactions). Not started.

See [CHANGELOG.md](./CHANGELOG.md) for what's been delivered.
