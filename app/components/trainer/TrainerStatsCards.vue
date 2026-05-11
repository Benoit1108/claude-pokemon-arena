<script setup lang="ts">
import { fmt } from '~/utils/format'
import type { LifetimeStats } from '~/types/api'

defineProps<{
  lifetime: LifetimeStats
  pokedexSeenCount: number
}>()
</script>

<template>
  <section class="mb-12">
    <h2 class="text-sm uppercase tracking-wider text-muted mb-3">📊 Lifetime stats</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div class="card p-4">
        <div class="text-xs text-muted uppercase">Tokens consumed</div>
        <div class="text-2xl font-bold text-accent mt-1 tabular-nums">
          {{ fmt(lifetime.total_tokens) }}
        </div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted uppercase">Max level reached</div>
        <div class="text-2xl font-bold text-primary mt-1">
          {{ lifetime.max_level }}<span class="text-sm text-muted">/100</span>
        </div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted uppercase">Shinies found</div>
        <div class="text-2xl font-bold text-primary mt-1">⭐ {{ lifetime.total_shinies }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted uppercase">Companions raised</div>
        <div class="text-2xl font-bold text-primary mt-1">{{ lifetime.total_compagnons }}</div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted uppercase">Lineages completed</div>
        <div class="text-2xl font-bold text-primary mt-1">
          {{ lifetime.lineages_completed.length }}<span class="text-sm text-muted">/8</span>
        </div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-muted uppercase">Quizzes won</div>
        <div class="text-2xl font-bold text-primary mt-1">
          {{ lifetime.games_won
          }}<span class="text-sm text-muted">/{{ lifetime.games_played }}</span>
        </div>
      </div>
      <div class="card p-4 col-span-2 md:col-span-3">
        <div class="text-xs text-muted uppercase">Wild pokédex seen</div>
        <div class="text-2xl font-bold text-primary mt-1">
          🌍 {{ pokedexSeenCount }}<span class="text-sm text-muted">/251</span>
        </div>
      </div>
    </div>
  </section>
</template>
