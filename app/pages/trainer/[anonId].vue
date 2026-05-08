<script setup lang="ts">
import type { TrainerResponse } from '~/types/api'

const route = useRoute()
const api = useApi()

const anonId = computed(() => route.params.anonId as string)

const { data: trainer, error } = await useAsyncData<TrainerResponse>(
  () => `trainer-${anonId.value}`,
  () => api.trainer(anonId.value),
)

// Set proper HTTP status when trainer not found (SEO + correctness).
if (error.value && import.meta.server) {
  setResponseStatus(404)
}

useHead({
  title: () =>
    trainer.value?.display_name
      ? `${trainer.value.display_name}#${trainer.value.anon_id.slice(0, 4)} · claude-pokemon arena`
      : `Trainer ${anonId.value} · claude-pokemon arena`,
  meta: [
    {
      name: 'description',
      content: trainer.value
        ? `Public trainer card for ${trainer.value.display_name || trainer.value.anon_id} — claude-pokemon arena`
        : 'Trainer not found',
    },
  ],
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Back to leaderboard
      </NuxtLink>
    </div>

    <div v-if="error" class="surface-card border surface-border rounded-lg p-12 text-center">
      <div class="text-6xl mb-4" aria-hidden="true">🥺</div>
      <h1 class="text-2xl font-bold text-primary mb-2">Trainer not found</h1>
      <p class="text-secondary">
        No trainer with anon_id <code class="text-accent">{{ anonId }}</code
        >.
      </p>
      <p class="text-muted text-sm mt-4">
        They might have opted out via <code>/pokemon stats-share forget</code>.
      </p>
    </div>

    <template v-else-if="trainer">
      <TrainerHero :trainer="trainer" />
      <TrainerStatsCards
        :lifetime="trainer.stats.lifetime"
        :pokedex-seen-count="trainer.stats.pokedex_seen_count"
      />
      <p v-if="trainer.stats.pokedex_seen_ids?.length" class="text-center -mt-8 mb-12 text-sm">
        <NuxtLink :to="`/pokedex?trainer=${anonId}`" class="text-accent hover:underline">
          → Voir leur pokédex (espèces rencontrées)
        </NuxtLink>
      </p>
      <TrainerBadges :earned="trainer.stats.badges" />

      <footer class="text-center text-muted text-sm mt-12 pt-8 border-t surface-border">
        <p>
          Last submit :
          <time :datetime="trainer.submitted_at">{{ trainer.submitted_at.slice(0, 10) }}</time>
          · CLI version <code class="text-secondary">{{ trainer.client_version }}</code>
        </p>
        <p class="mt-2 text-xs">
          Want your own trainer card?
          <a
            href="https://www.npmjs.com/package/claude-pokemon"
            class="text-accent hover:underline"
          >
            Install the CLI
          </a>
          and run <code>/pokemon stats-share enable --confirm</code>.
        </p>
      </footer>
    </template>
  </main>
</template>
