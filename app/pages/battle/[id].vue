<script setup lang="ts">
import type { BattleResponse } from '~/types/api'

const route = useRoute()
const api = useApi()

const battleId = computed(() => route.params.id as string)

const { data, error } = await useAsyncData<BattleResponse>(
  () => `battle-${battleId.value}`,
  () => api.arenaBattle(battleId.value),
)

if (error.value && import.meta.server) {
  setResponseStatus(404)
}

const battle = computed(() => data.value?.battle)

useHead({
  title: () =>
    battle.value
      ? `Battle ${battleId.value.slice(0, 8)} · claude-pokemon arena`
      : 'Battle not found',
  meta: [
    {
      name: 'description',
      content:
        'Replay an arena battle in claude-pokemon — turn-by-turn log, type effectiveness, winner.',
    },
  ],
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/arena" class="text-secondary hover:text-primary text-sm transition">
        ← Arena pool
      </NuxtLink>
    </div>

    <div v-if="error" class="surface-card border surface-border rounded-lg p-12 text-center">
      <div class="text-6xl mb-4" aria-hidden="true">🥺</div>
      <h1 class="text-2xl font-bold text-primary mb-2">Battle not found</h1>
      <p class="text-secondary">
        No battle with id <code class="text-accent">{{ battleId }}</code
        >.
      </p>
      <p class="text-muted text-sm mt-4">
        Battles are kept for 30 days. This one may have expired.
      </p>
    </div>

    <template v-else-if="battle">
      <header class="text-center mb-8">
        <div class="text-xs uppercase tracking-widest text-secondary mb-1">Battle replay</div>
        <h1 class="text-3xl font-bold text-primary">⚔️ Arena</h1>
        <p class="text-muted text-sm mt-2">
          <time :datetime="battle.created_at">{{
            battle.created_at.slice(0, 16).replace('T', ' ')
          }}</time>
          · seed
          <code class="text-secondary">{{ battle.seed }}</code>
        </p>
      </header>

      <BattleScene
        :challenger="battle.challenger"
        :defender="battle.defender"
        :winner="battle.winner"
      />

      <BattleResultBanner
        :winner="battle.winner"
        :reason="battle.reason"
        :challenger="battle.challenger"
        :defender="battle.defender"
        :total-turns="battle.turns.length"
      />

      <BattleLog
        :turns="battle.turns"
        :challenger="battle.challenger"
        :defender="battle.defender"
      />

      <footer class="text-center text-muted text-sm mt-12 pt-8 border-t surface-border">
        <p>
          Battles are deterministic — given the same seed + snapshots, the engine will always
          produce this exact log.
        </p>
      </footer>
    </template>
  </main>
</template>
