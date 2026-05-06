// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@unocss/nuxt', '@nuxtjs/color-mode', '@nuxt/eslint'],
  devtools: { enabled: true },

  app: {
    // GameBoy-dither page transition — subtle scale + saturation/contrast
    // shift that mimics a pixelated fade between routes. CSS-only, ~250 ms,
    // 'out-in' mode so the leaving page finishes before the next enters.
    pageTransition: { name: 'gb-dither', mode: 'out-in' },
    head: {
      title: 'claude-pokemon arena',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            "Web arena for claude-pokemon — leaderboard, trainer cards, async battles between trainers raised in Claude Code's statusline.",
        },
        { name: 'theme-color', content: '#0d1117', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#fafafa', media: '(prefers-color-scheme: light)' },
        { property: 'og:title', content: 'claude-pokemon arena' },
        { property: 'og:type', content: 'website' },
      ],
    },
  },

  colorMode: {
    preference: 'system', // honor OS preference by default
    fallback: 'dark', // fallback when prefers-color-scheme is unavailable
    classSuffix: '', // produces class="dark" or class="light" on <html>
    storageKey: 'arena-color-mode',
  },

  // API base for the claude-pokemon Worker. Override with NUXT_PUBLIC_API_BASE
  // env var in CI / Cloudflare Pages.
  runtimeConfig: {
    public: {
      apiBase: 'https://claude-pokemon-api.benoit-dev.workers.dev',
    },
  },
  compatibilityDate: '2026-05-06',

  // Cloudflare Pages preset. Falls back to node-server in `npm run dev`.
  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server',
  },

  typescript: {
    strict: true,
  },

  // ESLint config : focus on logic + Vue rules. Formatting is delegated to
  // Prettier (single source of truth via .prettierrc.json) — stylistic disabled
  // here to avoid double-formatting conflicts.
  eslint: {
    config: {
      stylistic: false,
    },
  },

  // Flatten subdirectory prefixes — components are organized in folders for
  // human readability but used by their bare name : <LeaderboardTable />,
  // not <LeaderboardLeaderboardTable />.
  components: [{ path: '~/components', pathPrefix: false }],
})
