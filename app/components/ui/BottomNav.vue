<script setup lang="ts">
// Sprint 4.9 — mobile bottom navigation. Visible only below the `md`
// breakpoint ; on desktop the AppHeader tabs handle this. 5 entries is
// the UX sweet-spot for thumb-reach navigation (Twitter, Spotify, Pokémon
// GO all use 5). Profile is the 5th because it's the most-frequent
// destination for a paired user.

const route = useRoute()

interface NavEntry {
  to: string
  label: string
  icon: string
  match: string[]
}

const entries: NavEntry[] = [
  { to: '/pokedex', label: 'Dex', icon: '📖', match: ['/pokedex'] },
  { to: '/arena', label: 'Arena', icon: '⚔️', match: ['/arena', '/battle'] },
  { to: '/zones', label: 'Zones', icon: '🗺️', match: ['/zones'] },
  { to: '/ladder', label: 'Trail', icon: '🏞️', match: ['/ladder'] },
  { to: '/profile', label: 'Moi', icon: '👤', match: ['/profile', '/trainer', '/pair', '/signup'] },
]

function isActive(entry: NavEntry): boolean {
  return entry.match.some(prefix => route.path === prefix || route.path.startsWith(`${prefix}/`))
}
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-zinc-50/90 dark:bg-[#0d1117]/90 border-t surface-border"
    aria-label="Primary navigation"
  >
    <div class="grid grid-cols-5">
      <NuxtLink
        v-for="entry in entries"
        :key="entry.to"
        :to="entry.to"
        class="bottom-nav-entry"
        :class="isActive(entry) ? 'bottom-nav-entry-active' : ''"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ entry.icon }}</span>
        <span class="text-[10px] mt-1 font-medium">{{ entry.label }}</span>
      </NuxtLink>
    </div>
    <!-- Safe-area inset for notched devices. -->
    <div class="h-[env(safe-area-inset-bottom)]" />
  </nav>
</template>

<style scoped>
.bottom-nav-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.25rem;
  color: rgb(113 113 122 / 1);
  transition:
    color 200ms ease-out,
    transform 200ms ease-out;
}
.bottom-nav-entry:hover {
  color: rgb(24 24 27 / 1);
}
:global(.dark) .bottom-nav-entry {
  color: rgb(161 161 170 / 1);
}
:global(.dark) .bottom-nav-entry:hover {
  color: rgb(244 244 245 / 1);
}
.bottom-nav-entry-active {
  color: rgb(24 24 27 / 1);
}
.bottom-nav-entry-active span:first-child {
  transform: translateY(-2px);
}
:global(.dark) .bottom-nav-entry-active {
  color: rgb(244 244 245 / 1);
}
/* Accent dot below the active entry, matches the desktop tab gradient. */
.bottom-nav-entry-active::before {
  content: '';
  position: absolute;
  height: 3px;
  width: 24px;
  border-radius: 999px;
  background: linear-gradient(90deg, #d4a017, #ef6c00);
  transform: translateY(-0.5rem);
}
:global(.dark) .bottom-nav-entry-active::before {
  background: linear-gradient(90deg, #ffd700, #ef6c00);
}
.bottom-nav-entry {
  position: relative;
}
</style>
