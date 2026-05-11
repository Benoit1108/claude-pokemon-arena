<script setup lang="ts">
// Sprint 4.9 — global app header. Replaces the floating UserMenu +
// ColorModeToggle that lived in fixed corners of app.vue. Sticky on top,
// shows primary nav tabs on desktop and collapses to a minimal bar on
// mobile (where BottomNav takes over the gameplay tabs).
//
// Inspiration : HeroUI's docs header (clean horizontal, theme + user on
// the right) but adapted to a *gameplay app* — tabs in the header itself,
// no ⌘K (we don't have enough searchable content to justify it yet),
// signature PokeballIcon that spins on hover.

const route = useRoute()

interface Tab {
  to: string
  label: string
  icon: string
  /** Routes whose prefix should mark this tab active. */
  match: string[]
}

const tabs: Tab[] = [
  { to: '/pokedex', label: 'Pokédex', icon: '📖', match: ['/pokedex'] },
  { to: '/arena', label: 'Arena', icon: '⚔️', match: ['/arena', '/battle'] },
  { to: '/ladder', label: 'Trail', icon: '🏞️', match: ['/ladder'] },
  { to: '/zones', label: 'Zones', icon: '🗺️', match: ['/zones'] },
]

function isActive(tab: Tab): boolean {
  return tab.match.some(prefix => route.path === prefix || route.path.startsWith(`${prefix}/`))
}
</script>

<template>
  <header
    class="sticky top-0 z-40 backdrop-blur-md bg-zinc-50/80 dark:bg-[#0d1117]/80 border-b surface-border"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
      <!-- LOGO + WORDMARK -->
      <NuxtLink
        to="/"
        class="flex items-center gap-2 logo-link shrink-0"
        :title="'claude-pokemon arena'"
      >
        <PokeballIcon size="md" />
        <span class="hidden sm:inline font-bold text-primary tracking-tight">claude-pokemon</span>
      </NuxtLink>

      <!-- DESKTOP NAV TABS — hidden on mobile (BottomNav handles it) -->
      <nav class="hidden md:flex items-center gap-1 ml-2">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="header-tab"
          :class="isActive(tab) ? 'header-tab-active' : ''"
        >
          <span aria-hidden="true">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </NuxtLink>
      </nav>

      <div class="flex-1" />

      <!-- RIGHT CLUSTER : theme + user -->
      <div class="flex items-center gap-2">
        <ColorModeToggle />
        <UserMenu />
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Tab base : pill-like, no border, weight bumps on active. Tabs sit in the
 * header so they need to feel "navigation" not "button" — subtle hover,
 * active state uses the accent underline so it reads as a tab and not a
 * pressed pill. */
.header-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--header-tab-fg, rgb(82 82 91 / 1));
  position: relative;
  transition:
    color 200ms ease-out,
    background 200ms ease-out;
}
.header-tab:hover {
  color: rgb(24 24 27 / 1);
  background: rgb(244 244 245 / 0.6);
}
:global(.dark) .header-tab {
  color: rgb(161 161 170 / 1);
}
:global(.dark) .header-tab:hover {
  color: rgb(244 244 245 / 1);
  background: rgb(255 255 255 / 0.04);
}
.header-tab-active {
  color: rgb(24 24 27 / 1);
  font-weight: 600;
}
:global(.dark) .header-tab-active {
  color: rgb(244 244 245 / 1);
}
/* Underline accent on active — uses the gold accent so it matches the brand
 * without competing with lineage colors that vary by trainer. */
.header-tab-active::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, #d4a017, #ef6c00);
  border-radius: 2px;
}
:global(.dark) .header-tab-active::after {
  background: linear-gradient(90deg, #ffd700, #ef6c00);
}

/* Logo Pokéball spins on hover. Targets the inner SVG via :deep() since
 * PokeballIcon scopes its own styles. Respects reduced-motion. */
@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}
.logo-link :deep(svg) {
  transition: transform 300ms ease-out;
}
.logo-link:hover :deep(svg) {
  animation: spin-slow 1.2s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .logo-link:hover :deep(svg) {
    animation: none;
  }
}
</style>
