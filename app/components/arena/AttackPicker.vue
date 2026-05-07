<script setup lang="ts">
// 2x2 grid of move buttons, shown during the player's turn in manual mode.
// Each button is tinted by the move's type and tagged with a super-effective
// / not-very-effective hint based on the defender's type (so the player can
// learn the matchup chart).

import { TYPE_CHART, type CombatType } from '~/utils/battle-engine'
import type { Move } from '~/data/moves'

const props = defineProps<{
  moves: Move[]
  defenderType: CombatType
  disabled?: boolean
}>()

const emit = defineEmits<{
  pick: [moveIndex: number]
}>()

const TYPE_BG: Record<CombatType, string> = {
  fire: 'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30',
  water: 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30',
  grass: 'bg-green-500/20 border-green-500/40 hover:bg-green-500/30',
  electric: 'bg-yellow-400/20 border-yellow-400/40 hover:bg-yellow-400/30',
  normal: 'bg-zinc-500/20 border-zinc-500/40 hover:bg-zinc-500/30',
}

const TYPE_LABEL: Record<CombatType, string> = {
  fire: 'Feu',
  water: 'Eau',
  grass: 'Plante',
  electric: 'Élec',
  normal: 'Normal',
}

function effectivenessFor(move: Move): number {
  return TYPE_CHART[move.type][props.defenderType]
}

function effectivenessLabel(eff: number): { text: string; color: string } {
  if (eff >= 2) return { text: '↑ super eff.', color: 'text-emerald-400' }
  if (eff <= 0.5) return { text: '↓ peu eff.', color: 'text-red-400' }
  return { text: '× neutre', color: 'text-zinc-400' }
}
</script>

<template>
  <div class="surface-card border surface-border rounded-lg p-4 mb-4">
    <div class="text-xs uppercase tracking-widest text-secondary mb-3 text-center">
      À toi de jouer — choisis ton attaque
    </div>
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="(move, i) in moves"
        :key="i"
        type="button"
        :disabled="disabled"
        class="border rounded-md px-3 py-3 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
        :class="TYPE_BG[move.type]"
        @click="!disabled && emit('pick', i)"
      >
        <div class="flex items-baseline justify-between gap-2 mb-1">
          <span class="font-bold text-primary truncate">{{ move.name }}</span>
          <span class="text-xs uppercase tracking-wider text-secondary flex-shrink-0">
            {{ TYPE_LABEL[move.type] }}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted">Puissance {{ move.power.toFixed(1) }}</span>
          <span :class="effectivenessLabel(effectivenessFor(move)).color">
            {{ effectivenessLabel(effectivenessFor(move)).text }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
