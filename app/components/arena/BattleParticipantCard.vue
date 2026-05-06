<script setup lang="ts">
import { lineageEmoji, LINEAGE_LABELS } from '~/utils/lineage'
import { trainerLabel } from '~/utils/format'
import type { BattleParticipant } from '~/types/api'

const props = defineProps<{
  participant: BattleParticipant
  side: 'challenger' | 'defender'
  isWinner: boolean
  isLoser: boolean
  /** When set, this card is currently the actor of the visible turn → bounce. */
  isAttacking?: boolean
  /** When set, this card is being hit on the visible turn → shake (+ optional crit flash). */
  isDefending?: boolean
  isCritical?: boolean
}>()

const ringClass = computed(() => {
  if (props.isWinner) return 'ring-2 ring-accent'
  if (props.isLoser) return 'opacity-60 grayscale'
  return ''
})

const sideLabel = computed(() => (props.side === 'challenger' ? 'Challenger' : 'Defender'))

// Build a unique animation key combining attacking/defending state — Vue's
// :key trick to retrigger the CSS animation on each turn change without
// ending up in stale state.
const animKey = computed(
  () =>
    `${props.isAttacking ? 'a' : '_'}${props.isDefending ? 'd' : '_'}${props.isCritical ? 'c' : '_'}`,
)
</script>

<template>
  <NuxtLink
    :to="`/trainer/${participant.anon_id}`"
    class="block surface-card border surface-border rounded-lg p-4 transition surface-card-hover relative overflow-hidden"
    :class="[ringClass, isCritical && isDefending ? 'crit-flash' : '']"
  >
    <div class="text-xs uppercase tracking-widest text-muted mb-1">{{ sideLabel }}</div>
    <div
      :key="`emoji-${animKey}`"
      class="text-4xl text-center mb-2"
      :class="{
        'sprite-bounce': isAttacking,
        'sprite-shake': isDefending,
      }"
    >
      {{ lineageEmoji(participant.lineage) }}
    </div>
    <div class="text-center font-bold text-primary truncate">
      {{ trainerLabel(participant) }}
      <span v-if="participant.is_shiny" class="text-accent">★</span>
    </div>
    <div class="text-center text-xs text-secondary mt-1">
      {{ LINEAGE_LABELS[participant.lineage] || participant.lineage }} · Lv.{{ participant.level }}
    </div>
  </NuxtLink>
</template>

<style scoped>
@keyframes sprite-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  30% {
    transform: translateY(-12px) scale(1.15);
  }
  60% {
    transform: translateY(0) scale(1.05);
  }
}
@keyframes sprite-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(-6px);
  }
  30% {
    transform: translateX(6px);
  }
  45% {
    transform: translateX(-4px);
  }
  60% {
    transform: translateX(4px);
  }
  75% {
    transform: translateX(-2px);
  }
}
@keyframes crit-flash {
  0%,
  100% {
    background-color: transparent;
  }
  20% {
    background-color: rgba(255, 235, 0, 0.35);
  }
}
.sprite-bounce {
  animation: sprite-bounce 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.sprite-shake {
  animation: sprite-shake 0.5s linear;
}
.crit-flash {
  animation: crit-flash 0.4s ease-out;
}
</style>
