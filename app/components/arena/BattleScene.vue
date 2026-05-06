<script setup lang="ts">
import type { BattleParticipant, BattleTurn } from '~/types/api'

const props = defineProps<{
  challenger: BattleParticipant
  defender: BattleParticipant
  winner: 'challenger' | 'defender' | 'draw'
  /** When provided, drives the per-turn animation (sprite bounce/shake). */
  currentTurn?: BattleTurn | null
  /** When true, treat winner ring/grayscale as final (= replay finished). */
  showFinalState?: boolean
}>()

const challengerAttacking = computed(() => props.currentTurn?.actor === 'challenger')
const defenderAttacking = computed(() => props.currentTurn?.actor === 'defender')
const isCritical = computed(() => !!props.currentTurn?.critical)

const challengerWinnerRing = computed(() => props.showFinalState && props.winner === 'challenger')
const challengerLoserGray = computed(() => props.showFinalState && props.winner === 'defender')
const defenderWinnerRing = computed(() => props.showFinalState && props.winner === 'defender')
const defenderLoserGray = computed(() => props.showFinalState && props.winner === 'challenger')
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-6">
    <BattleParticipantCard
      :participant="challenger"
      side="challenger"
      :is-winner="challengerWinnerRing"
      :is-loser="challengerLoserGray"
      :is-attacking="challengerAttacking"
      :is-defending="defenderAttacking"
      :is-critical="isCritical"
    />

    <div class="text-center">
      <div class="text-xs uppercase tracking-widest text-secondary mb-2">vs</div>
      <div v-if="showFinalState && winner === 'draw'" class="text-2xl font-bold text-secondary">
        ⊘
      </div>
      <div v-else-if="showFinalState" class="text-3xl">
        <span v-if="winner === 'challenger'">⚔️</span>
        <span v-else>🛡️</span>
      </div>
      <div v-else class="text-3xl text-secondary">⚔️</div>
    </div>

    <BattleParticipantCard
      :participant="defender"
      side="defender"
      :is-winner="defenderWinnerRing"
      :is-loser="defenderLoserGray"
      :is-attacking="defenderAttacking"
      :is-defending="challengerAttacking"
      :is-critical="isCritical"
    />
  </div>
</template>
