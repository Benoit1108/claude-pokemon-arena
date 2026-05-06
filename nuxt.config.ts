// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-05-06',
  devtools: { enabled: true },

  modules: ['@unocss/nuxt', '@nuxtjs/color-mode'],

  colorMode: {
    preference: 'system',     // honor OS preference by default
    fallback: 'dark',         // fallback when prefers-color-scheme is unavailable
    classSuffix: '',          // produces class="dark" or class="light" on <html>
    storageKey: 'arena-color-mode',
  },

  // API base for the claude-pokemon Worker. Override with NUXT_PUBLIC_API_BASE
  // env var in CI / Cloudflare Pages.
  runtimeConfig: {
    public: {
      apiBase: 'https://claude-pokemon-api.benoit-dev.workers.dev',
    },
  },

  app: {
    head: {
      title: 'claude-pokemon arena',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Web arena for claude-pokemon — leaderboard, trainer cards, async battles between trainers raised in Claude Code\'s statusline.' },
        { name: 'theme-color', content: '#0d1117', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#fafafa', media: '(prefers-color-scheme: light)' },
        { property: 'og:title', content: 'claude-pokemon arena' },
        { property: 'og:type', content: 'website' },
      ],
    },
  },

  // Cloudflare Pages preset. Falls back to node-server in `npm run dev`.
  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server',
  },

  typescript: {
    strict: true,
  },
})
