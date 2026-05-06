<script setup lang="ts">
import { fmt, fmtPct } from '~/utils/format'
import type { AggregateResponse } from '~/types/api'

defineProps<{
  aggregate: AggregateResponse | null | undefined
}>()
</script>

<template>
  <section class="mb-12">
    <h2 class="text-sm uppercase tracking-wider text-muted mb-3">🌍 Global stats</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="surface-card border surface-border rounded-lg p-4">
        <div class="text-xs text-muted uppercase">Players</div>
        <div class="text-3xl font-bold text-accent mt-1">
          {{ aggregate?.total_players ?? '—' }}
        </div>
      </div>
      <div class="surface-card border surface-border rounded-lg p-4">
        <div class="text-xs text-muted uppercase">Tokens combined</div>
        <div class="text-3xl font-bold mt-1 text-primary">
          {{ fmt(aggregate?.total_tokens_combined) }}
        </div>
      </div>
      <div class="surface-card border surface-border rounded-lg p-4">
        <div class="text-xs text-muted uppercase">Shinies observed</div>
        <div class="text-3xl font-bold mt-1 text-primary">
          ⭐ {{ aggregate?.total_shinies_observed ?? '—' }}
        </div>
      </div>
      <div class="surface-card border surface-border rounded-lg p-4">
        <div class="text-xs text-muted uppercase">Real shiny rate</div>
        <div class="text-3xl font-bold mt-1 text-primary">
          {{ fmtPct(aggregate?.shiny_rate_observed) }}
        </div>
      </div>
    </div>
  </section>
</template>
