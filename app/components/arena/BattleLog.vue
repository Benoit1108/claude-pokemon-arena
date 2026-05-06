<script setup lang="ts">
import { lineageEmoji } from '~/utils/lineage'
import type { BattleParticipant, BattleTurn } from '~/types/api'

defineProps<{
  turns: BattleTurn[]
  challenger: BattleParticipant
  defender: BattleParticipant
}>()

function effectivenessLabel(eff: number): string {
  if (eff >= 2) return 'super effective'
  if (eff <= 0.5) return 'not very effective'
  return ''
}
</script>

<template>
  <div class="surface-card border surface-border rounded-lg p-4 mb-6">
    <div class="text-xs uppercase tracking-widest text-secondary mb-3">Battle log</div>
    <ol class="space-y-1.5 font-mono text-sm">
      <li v-for="t in turns" :key="t.turn" class="flex flex-wrap gap-2 items-center">
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
    </ol>
  </div>
</template>
