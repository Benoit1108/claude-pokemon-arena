<script setup lang="ts">
import { lineageEmoji, LINEAGE_LABELS } from '~/utils/lineage'
import { trainerLabel } from '~/utils/format'
import type { ArenaOpponent } from '~/types/api'

defineProps<{
  opponent: ArenaOpponent
}>()
</script>

<template>
  <NuxtLink
    :to="`/trainer/${opponent.anon_id}`"
    class="block surface-card border surface-border rounded-lg p-3 transition surface-card-hover"
    :class="opponent.is_shiny ? 'ring-1 ring-accent' : ''"
  >
    <div class="flex items-center gap-3">
      <div class="text-3xl">{{ lineageEmoji(opponent.lineage) }}</div>
      <div class="flex-grow min-w-0">
        <div class="font-semibold text-primary truncate">
          {{ trainerLabel(opponent) }}
          <span v-if="opponent.is_shiny" class="text-accent">★</span>
        </div>
        <div class="text-xs text-secondary">
          {{ LINEAGE_LABELS[opponent.lineage] || opponent.lineage }}
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold text-primary tabular-nums">Lv.{{ opponent.level }}</div>
      </div>
    </div>
  </NuxtLink>
</template>
