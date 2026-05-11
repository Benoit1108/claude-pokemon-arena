<script setup lang="ts">
import type { OpponentsResponse } from '~/types/api'

const api = useApi()

const { data: opponents, refresh } = await useAsyncData<OpponentsResponse>('arena-opponents', () =>
  api.arenaOpponents(50),
)

const list = computed(() => opponents.value?.opponents ?? [])
const total = computed(() => opponents.value?.total ?? 0)

useHead({
  title: 'Arena · claude-pokemon arena',
  meta: [
    {
      name: 'description',
      content: 'Browse trainers in the claude-pokemon arena pool and challenge them async.',
    },
  ],
})
</script>

<template>
  <main class="max-w-5xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Home
      </NuxtLink>
    </div>

    <header class="text-center mb-10">
      <h1 class="text-4xl md:text-5xl font-bold text-primary mb-3">⚔️ Arena</h1>
      <p class="text-secondary max-w-2xl mx-auto">
        Async PvP. Trainers opt in from their CLI with
        <code class="text-accent">/pokemon arena enable --confirm</code>, then challenge each other
        from the terminal. Battles resolve deterministically and are replayable here.
      </p>
    </header>

    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-secondary">
        {{ list.length }} / {{ total }} trainer{{ total > 1 ? 's' : '' }} in the pool
      </span>
      <button
        type="button"
        class="px-3 py-1.5 text-sm border surface-border rounded-md surface-card-hover transition text-primary"
        @click="refresh()"
      >
        ↻ Refresh
      </button>
    </div>

    <div v-if="list.length === 0" class="card p-12 text-center">
      <div class="text-6xl mb-4" aria-hidden="true">🦗</div>
      <h2 class="text-xl font-semibold text-primary mb-2">No trainers yet</h2>
      <p class="text-secondary">
        Be the first to enable the arena from your CLI:
        <code class="text-accent">/pokemon arena enable --confirm</code>
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <OpponentRow v-for="o in list" :key="o.anon_id" :opponent="o" />
    </div>

    <footer class="text-center text-muted text-sm mt-12 pt-8 border-t surface-border">
      <p>
        Want to fight? Install the CLI and run
        <code class="text-secondary">/pokemon arena challenge &lt;anon_id&gt;</code>.
      </p>
    </footer>
  </main>
</template>
