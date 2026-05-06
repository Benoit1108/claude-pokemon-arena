<script setup lang="ts">
import { typeColor } from '~/utils/pokedex'
import type { WildPokemon } from '~/types/pokedex'

const props = defineProps<{
  pokemon: WildPokemon
  lang?: 'fr' | 'en'
}>()

const displayName = computed(() =>
  props.lang === 'en' ? props.pokemon.name_en : props.pokemon.name_fr,
)

const rarityRing = computed(() => {
  if (props.pokemon.rarity === 'legendary') return 'ring-2 ring-accent'
  if (props.pokemon.rarity === 'rare') return 'ring-1 ring-purple-400 dark:ring-purple-500'
  return ''
})
</script>

<template>
  <div
    class="surface-card border surface-border rounded-lg p-3 transition surface-card-hover"
    :class="rarityRing"
    :title="`${pokemon.name_en} · ${pokemon.type} · ${pokemon.rarity}`"
  >
    <div class="text-xs text-muted text-right tabular-nums">
      #{{ pokemon.national_dex.toString().padStart(3, '0') }}
    </div>
    <div class="text-4xl text-center my-1" aria-hidden="true">{{ pokemon.emoji }}</div>
    <div class="text-center font-semibold text-primary text-sm truncate">
      {{ displayName }}
    </div>
    <div class="text-center text-xs mt-1" :class="typeColor(pokemon.type)">
      {{ pokemon.type }}
    </div>
    <div v-if="pokemon.rarity !== 'common'" class="text-center mt-1">
      <span
        class="text-xs uppercase tracking-wider"
        :class="
          pokemon.rarity === 'legendary' ? 'text-accent' : 'text-purple-400 dark:text-purple-300'
        "
      >
        {{ pokemon.rarity === 'legendary' ? '★ legendary' : '◆ rare' }}
      </span>
    </div>
  </div>
</template>
