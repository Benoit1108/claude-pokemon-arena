<script setup lang="ts">
import { LINEAGE_LABELS } from '~/utils/lineage'
import type { TrainerResponse } from '~/types/api'

const props = defineProps<{
  trainer: TrainerResponse
}>()

const label = computed(() =>
  props.trainer.display_name
    ? `${props.trainer.display_name}#${props.trainer.anon_id.slice(0, 4)}`
    : props.trainer.anon_id,
)

const lineage = computed(() => props.trainer.stats.active.lineage)
const level = computed(() => props.trainer.stats.active.current_level)
const isShiny = computed(() => props.trainer.stats.active.is_shiny)
const lineageLabel = computed(() => (lineage.value ? LINEAGE_LABELS[lineage.value] : '—'))
</script>

<template>
  <header class="text-center mb-12">
    <div
      class="inline-block px-3 py-1 mb-4 text-xs uppercase tracking-widest border surface-border rounded-full text-secondary"
    >
      Trainer card
    </div>

    <div class="flex justify-center mb-4">
      <PokemonSprite
        v-if="lineage"
        :lineage="lineage"
        :level="level"
        :is-shiny="isShiny"
        size="xl"
        animated
      />
    </div>

    <h1 class="text-4xl md:text-5xl font-bold mb-2 text-primary">
      🎮 {{ label }}
      <span v-if="isShiny" class="text-accent" title="Active companion is shiny">✦</span>
    </h1>

    <p class="text-lg text-secondary">
      {{ lineageLabel }} ·
      {{ level === 0 ? '🥚 Egg' : `Lv.${level}` }}
    </p>
  </header>
</template>
