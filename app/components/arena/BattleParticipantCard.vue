<script setup lang="ts">
import { lineageEmoji, LINEAGE_LABELS } from '~/utils/lineage'
import { trainerLabel } from '~/utils/format'
import type { BattleParticipant } from '~/types/api'

const props = defineProps<{
  participant: BattleParticipant
  side: 'challenger' | 'defender'
  isWinner: boolean
  isLoser: boolean
}>()

const ringClass = computed(() => {
  if (props.isWinner) return 'ring-2 ring-accent'
  if (props.isLoser) return 'opacity-60 grayscale'
  return ''
})

const sideLabel = computed(() => (props.side === 'challenger' ? 'Challenger' : 'Defender'))
</script>

<template>
  <NuxtLink
    :to="`/trainer/${participant.anon_id}`"
    class="block surface-card border surface-border rounded-lg p-4 transition surface-card-hover"
    :class="ringClass"
  >
    <div class="text-xs uppercase tracking-widest text-muted mb-1">{{ sideLabel }}</div>
    <div class="text-4xl text-center mb-2">{{ lineageEmoji(participant.lineage) }}</div>
    <div class="text-center font-bold text-primary truncate">
      {{ trainerLabel(participant) }}
      <span v-if="participant.is_shiny" class="text-accent">★</span>
    </div>
    <div class="text-center text-xs text-secondary mt-1">
      {{ LINEAGE_LABELS[participant.lineage] || participant.lineage }} · Lv.{{ participant.level }}
    </div>
  </NuxtLink>
</template>
