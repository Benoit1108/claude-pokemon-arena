<script setup lang="ts">
import type { BattleParticipant } from '~/types/api'

defineProps<{
  challenger: BattleParticipant
  defender: BattleParticipant
  winner: 'challenger' | 'defender' | 'draw'
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-center mb-6">
    <BattleParticipantCard
      :participant="challenger"
      side="challenger"
      :is-winner="winner === 'challenger'"
      :is-loser="winner === 'defender'"
    />

    <div class="text-center">
      <div class="text-xs uppercase tracking-widest text-secondary mb-2">vs</div>
      <div v-if="winner === 'draw'" class="text-2xl font-bold text-secondary">⊘</div>
      <div v-else class="text-3xl">
        <span v-if="winner === 'challenger'">⚔️</span>
        <span v-else>🛡️</span>
      </div>
    </div>

    <BattleParticipantCard
      :participant="defender"
      side="defender"
      :is-winner="winner === 'defender'"
      :is-loser="winner === 'challenger'"
    />
  </div>
</template>
