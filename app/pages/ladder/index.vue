<script setup lang="ts">
import { BOT_TRAINERS } from '~/data/bot-trainers'
import { useLadderProgress } from '~/composables/useLadderProgress'

const ladder = useLadderProgress()

useHead({
  title: 'Ladder · claude-pokemon arena',
  meta: [
    {
      name: 'description',
      content:
        'Battle through 15 NPC trainers to earn the Trail Conqueror title. Solo gameplay loop, offline-friendly.',
    },
  ],
})

function isLocked(idx: number): boolean {
  // A tile is locked if any earlier tile hasn't been beaten yet (linear path).
  for (let i = 0; i < idx; i++) {
    if (!ladder.isBeaten(BOT_TRAINERS[i]!.id)) return true
  }
  return false
}

function confirmReset() {
  if (typeof window === 'undefined') return
  if (window.confirm('Reset all ladder progress? This cannot be undone.')) {
    ladder.reset()
  }
}
</script>

<template>
  <main class="max-w-5xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Home
      </NuxtLink>
    </div>

    <header class="text-center mb-10">
      <h1 class="text-4xl md:text-5xl font-bold text-primary mb-3">🏞️ Trail Ladder</h1>
      <p class="text-secondary max-w-2xl mx-auto mb-4">
        Battle through 15 NPC trainers, each tougher than the last. Beat the Champion to earn the
        <strong class="text-accent">Trail Conqueror</strong> title — displayed on your public
        trainer card and the leaderboard. Progress is saved locally (offline-friendly).
      </p>
    </header>

    <!-- Progress bar -->
    <div class="card p-4 mb-6">
      <div class="flex items-center justify-between text-sm text-secondary mb-2">
        <span class="font-mono">
          {{ ladder.beatenCount.value }} / {{ ladder.totalCount }} beaten
        </span>
        <span v-if="ladder.isComplete.value" class="text-accent font-bold">
          🏆 Trail Conqueror
        </span>
        <span v-else-if="ladder.beatenCount.value > 0">
          <button
            type="button"
            class="text-xs text-muted hover:text-secondary underline"
            @click="confirmReset"
          >
            Reset progress
          </button>
        </span>
      </div>
      <div class="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-accent transition-all duration-500 ease-out"
          :style="{ width: `${ladder.progress.value * 100}%` }"
        />
      </div>
    </div>

    <!-- Tiles grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <BotTrainerTile
        v-for="(bot, i) in BOT_TRAINERS"
        :key="bot.id"
        :bot="bot"
        :index="i"
        :is-beaten="ladder.isBeaten(bot.id)"
        :is-locked="isLocked(i)"
        :is-next="i === ladder.nextIndex.value"
      />
    </div>

    <footer class="text-center text-muted text-sm mt-12 pt-8 border-t surface-border">
      <p>
        Solo ladder battles run entirely client-side — no Worker roundtrip, no internet required
        once the page is loaded.
      </p>
    </footer>
  </main>
</template>
