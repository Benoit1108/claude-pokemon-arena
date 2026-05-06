// Playwright-driven recording of a scripted browser session demonstrating
// the arena features. Mocks the Worker API responses so the demo doesn't
// depend on live state (no need to deploy + seed a real battle).
//
// Usage :
//   1. npm i -D playwright
//   2. npx playwright install chromium
//   3. NUXT_PUBLIC_API_BASE=http://mock.local npm run dev   (in another terminal)
//   4. node .demo/record.mjs
//   5. bash .demo/build-gif.sh                              (requires ffmpeg)
//
// Output : .demo/output/*.webm → .demo/output/arena-demo.gif

import { chromium } from 'playwright'
import { mkdirSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'

const VIEWPORT = { width: 960, height: 600 }
const BASE_URL = process.env.DEMO_BASE_URL ?? 'http://localhost:3000'
const OUTPUT_DIR = path.join(process.cwd(), '.demo', 'output')

// Reset the output dir on each run so old recordings don't pile up.
if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true })
mkdirSync(OUTPUT_DIR, { recursive: true })

// ── Mock data ─────────────────────────────────────────────────────────────
const mockAggregate = {
  total_players: 12,
  total_tokens_combined: 24_500_000,
  total_shinies_observed: 4,
  shiny_rate_observed: 0.0083,
  active_lineage_distribution: {
    fire: 4,
    water: 3,
    grass: 2,
    eevee: 2,
    cyndaquil: 1,
  },
}

const mockLeaderboard = {
  metric: 'total_tokens',
  total_players: 12,
  top: [
    {
      anon_id: 'aaaaaaaa',
      display_name: 'AshKetchum',
      value: 8_400_000,
      lineage: 'fire',
      level: 32,
      is_shiny: true,
      submitted_at: '2026-05-06T08:00:00Z',
    },
    {
      anon_id: 'bbbbbbbb',
      display_name: 'MistyW',
      value: 5_120_000,
      lineage: 'water',
      level: 24,
      is_shiny: false,
      submitted_at: '2026-05-06T07:30:00Z',
    },
    {
      anon_id: 'cccccccc',
      display_name: 'Erika',
      value: 3_910_000,
      lineage: 'grass',
      level: 18,
      is_shiny: false,
      submitted_at: '2026-05-06T06:55:00Z',
    },
  ],
}

const mockOpponents = {
  opponents: [
    {
      anon_id: 'aaaaaaaa',
      display_name: 'AshKetchum',
      lineage: 'fire',
      level: 32,
      is_shiny: true,
      updated_at: '2026-05-06T08:00:00Z',
    },
    {
      anon_id: 'bbbbbbbb',
      display_name: 'MistyW',
      lineage: 'water',
      level: 24,
      is_shiny: false,
      updated_at: '2026-05-06T07:30:00Z',
    },
    {
      anon_id: 'cccccccc',
      display_name: 'Erika',
      lineage: 'grass',
      level: 18,
      is_shiny: false,
      updated_at: '2026-05-06T06:55:00Z',
    },
  ],
  total: 3,
}

const challenger = {
  anon_id: 'aaaaaaaa',
  display_name: 'AshKetchum',
  lineage: 'fire',
  level: 32,
  is_shiny: true,
}
const defender = {
  anon_id: 'cccccccc',
  display_name: 'Erika',
  lineage: 'grass',
  level: 28,
  is_shiny: false,
}

// 8-turn battle ending in challenger victory (fire vs grass = ×2 boost).
const mockBattle = {
  battle: {
    battle_id: 'd'.repeat(32),
    challenger,
    defender,
    seed: 4242424242,
    created_at: '2026-05-06T18:00:00Z',
    winner: 'challenger',
    reason: 'ko',
    turns: [
      { turn: 1, actor: 'challenger', damage: 32, effectiveness: 2, critical: false, defender_hp_after: 88 },
      { turn: 2, actor: 'defender', damage: 11, effectiveness: 0.5, critical: false, defender_hp_after: 121 },
      { turn: 3, actor: 'challenger', damage: 47, effectiveness: 2, critical: true, defender_hp_after: 41 },
      { turn: 4, actor: 'defender', damage: 9, effectiveness: 0.5, critical: false, defender_hp_after: 112 },
      { turn: 5, actor: 'challenger', damage: 30, effectiveness: 2, critical: false, defender_hp_after: 11 },
      { turn: 6, actor: 'defender', damage: 12, effectiveness: 0.5, critical: false, defender_hp_after: 100 },
      { turn: 7, actor: 'challenger', damage: 11, effectiveness: 2, critical: false, defender_hp_after: 0 },
    ],
  },
}

const mockTrainer = {
  anon_id: 'cccccccc',
  display_name: 'Erika',
  submitted_at: '2026-05-06T06:55:00Z',
  client_version: '1.0.0-beta.6',
  stats: {
    lifetime: {
      total_tokens: 3_910_000,
      total_evolutions: 5,
      total_shinies: 0,
      max_level: 28,
      total_compagnons: 2,
      lineages_completed: ['grass'],
      games_won: 4,
      games_played: 7,
    },
    active: { lineage: 'grass', current_level: 18, is_shiny: false },
    badges: ['hatch', 'first_evolution', 'master_grass'],
    pokedex_seen_count: 47,
  },
}

// ── Recording ─────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT },
  colorScheme: 'dark',
})

// Intercept all Worker API calls and return mocks.
await context.route('**/v1/aggregate', r => r.fulfill({ json: mockAggregate }))
await context.route('**/v1/leaderboard*', r => r.fulfill({ json: mockLeaderboard }))
await context.route('**/v1/arena/opponents*', r => r.fulfill({ json: mockOpponents }))
await context.route('**/v1/arena/battle/*', r => r.fulfill({ json: mockBattle }))
await context.route('**/v1/trainer/*', r => r.fulfill({ json: mockTrainer }))

const page = await context.newPage()

// 1) Home — leaderboard + global stats (~3s)
await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

// 2) Arena pool (~3s)
await page.click('text=⚔️ Arena')
await page.waitForTimeout(2500)

// 3) Click on an opponent → trainer card (~2.5s)
await page.click('text=Erika')
await page.waitForTimeout(2500)

// 4) Battle replay — full animation (~10s)
await page.goto(`${BASE_URL}/battle/${'d'.repeat(32)}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(10000)

await page.close()
await context.close()
await browser.close()
console.log(`✓ Video recorded in ${OUTPUT_DIR}`)
