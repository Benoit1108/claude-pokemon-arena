<script setup lang="ts">
import { lineageEmoji } from '~/utils/lineage'
import type { BattleParticipant, BattleTurn } from '~/types/api'

const props = defineProps<{
  turns: BattleTurn[]
  challenger: BattleParticipant
  defender: BattleParticipant
}>()

function effectivenessLabel(eff: number): string {
  if (eff >= 2) return 'super effective'
  if (eff <= 0.5) return 'not very effective'
  return ''
}

// Track the last revealed turn so only IT plays the typewriter animation.
const lastRevealedTurn = computed(() => props.turns[props.turns.length - 1]?.turn ?? -1)
</script>

<template>
  <div class="card p-4 mb-6">
    <div class="text-label mb-3">Battle log</div>
    <ol v-if="turns.length > 0" class="space-y-1.5 font-mono text-sm">
      <TransitionGroup name="turn-fade" tag="div" class="space-y-1.5">
        <li
          v-for="t in turns"
          :key="t.turn"
          class="flex flex-wrap gap-2 items-center"
          :class="{ 'turn-typewriter': t.turn === lastRevealedTurn }"
        >
          <span class="text-muted w-12 tabular-nums"
            >Turn {{ t.turn.toString().padStart(2, '0') }}</span
          >
          <span class="text-2xl">
            {{ lineageEmoji(t.actor === 'challenger' ? challenger.lineage : defender.lineage) }}
          </span>
          <span class="text-primary">attacks for</span>
          <span class="font-bold text-accent">−{{ t.damage }} HP</span>
          <span v-if="t.effectiveness !== 1" class="text-secondary text-xs">
            ({{ effectivenessLabel(t.effectiveness) }} ×{{ t.effectiveness }})
          </span>
          <span v-if="t.critical" class="text-accent font-bold text-xs">CRIT!</span>
          <span class="text-muted text-xs ml-auto tabular-nums">
            → opp. HP {{ t.defender_hp_after }}
          </span>
        </li>
      </TransitionGroup>
    </ol>
    <p v-else class="text-secondary text-sm italic">Press ▶ to start the replay…</p>
  </div>
</template>

<style scoped>
.turn-fade-enter-active {
  transition:
    opacity 0.35s ease-out,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.turn-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
@keyframes typewriter-glow {
  0% {
    background-color: rgba(255, 200, 0, 0.18);
  }
  100% {
    background-color: transparent;
  }
}
.turn-typewriter {
  animation: typewriter-glow 0.7s ease-out;
  border-radius: 4px;
  padding-left: 4px;
  margin-left: -4px;
}
</style>
