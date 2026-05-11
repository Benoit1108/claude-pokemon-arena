<script setup lang="ts">
const api = useApi()

const { data: aggregate } = await useAsyncData('aggregate', () => api.aggregate())
const { data: leaderboard } = await useAsyncData('leaderboard', () =>
  api.leaderboard('total_tokens', 10),
)

// Sprint 2.12 — Konami code easter egg. ↑↑↓↓←→←→BA triggers a one-shot
// confetti shower. Tracks recent keys, resets on any non-matching key so the
// player has to type it cleanly. Confetti import is lazy so non-trigger
// sessions don't pay for the bundle.
const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]
const konamiBuffer: string[] = []
const konamiTriggered = ref(false)

async function fireKonami() {
  konamiTriggered.value = true
  const { default: confetti } = await import('canvas-confetti')
  // Three bursts in different directions for that arcade reveal feel.
  for (const origin of [
    { x: 0.2, y: 0.3 },
    { x: 0.8, y: 0.3 },
    { x: 0.5, y: 0.9 },
  ]) {
    confetti({
      particleCount: 100,
      spread: 80,
      origin,
      colors: ['#fbbf24', '#ef6c00', '#3d8de8', '#7eb858'],
    })
  }
  setTimeout(() => {
    konamiTriggered.value = false
  }, 3000)
}

function onKeydown(event: KeyboardEvent) {
  const expected = KONAMI_SEQUENCE[konamiBuffer.length]
  if (event.code === expected) {
    konamiBuffer.push(event.code)
    if (konamiBuffer.length === KONAMI_SEQUENCE.length) {
      konamiBuffer.length = 0
      void fireKonami()
    }
  } else if (konamiBuffer.length > 0) {
    konamiBuffer.length = 0
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main class="max-w-5xl mx-auto px-6 py-12">
    <!-- Hero -->
    <header class="text-center mb-16">
      <div
        class="inline-block px-3 py-1 mb-4 text-xs uppercase tracking-widest border surface-border rounded-full text-secondary"
      >
        Phase 2 · MVP preview
      </div>
      <h1
        class="text-display mb-4 transition-transform flex items-center justify-center gap-3"
        :class="konamiTriggered ? 'scale-110' : ''"
      >
        <PokeballIcon
          size="xl"
          :variant="konamiTriggered ? 'shiny' : 'default'"
          :spin="konamiTriggered"
          title="claude-pokemon arena"
        />
        <span
          class="bg-clip-text text-transparent bg-gradient-to-br from-gold-soft to-lineage-fire dark:from-gold dark:to-lineage-fire"
        >
          claude-pokemon arena</span
        >
        <span
          v-if="konamiTriggered"
          class="inline-block ml-2 text-2xl align-middle"
          aria-hidden="true"
          >✨</span
        >
      </h1>
      <p class="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
        Where Pokémon raised in your Claude Code statusline
        <em class="text-primary">battle, trade, and rank up</em>
        between trainers worldwide.
      </p>
      <div class="mt-8 flex justify-center gap-3 flex-wrap">
        <!-- Sprint 4.2 — two equal-weight CTAs : web signup OR CLI install.
             "Hero feature" = CLI (statusline pokémon), but web is now a full
             first-class entry point. -->
        <NuxtLink to="/signup" class="btn-primary"> 🎮 Crée ton dresseur </NuxtLink>
        <a href="https://www.npmjs.com/package/claude-pokemon" class="btn-secondary">
          💻 Install the CLI →
        </a>
        <NuxtLink to="/pokedex" class="btn-ghost"> 📖 Pokédex </NuxtLink>
        <NuxtLink to="/arena" class="btn-ghost"> ⚔️ Arena </NuxtLink>
        <NuxtLink to="/ladder" class="btn-ghost"> 🏞️ Trail </NuxtLink>
        <NuxtLink to="/zones" class="btn-ghost"> 🗺️ Zones sauvages </NuxtLink>
        <a href="https://github.com/Benoit1108/claude-pokemon" class="btn-ghost"> GitHub </a>
      </div>
    </header>

    <GlobalStatsCards :aggregate="aggregate" />
    <LeaderboardTable :entries="leaderboard?.top ?? []" />
    <LineageDistribution :distribution="aggregate?.active_lineage_distribution" />

    <footer class="text-center text-muted text-sm mt-16 pt-8 border-t surface-border">
      <p>
        ⚔️ Async battles, trades, and the full arena are coming in
        <a
          href="https://github.com/Benoit1108/claude-pokemon/blob/main/ROADMAP.md"
          class="text-accent hover:underline"
        >
          Phase 2.3
        </a>
      </p>
      <p class="mt-2 text-xs">Privacy first · Anonymous IDs · No tracking · Open source</p>
    </footer>
  </main>
</template>
