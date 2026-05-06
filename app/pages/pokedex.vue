<script setup lang="ts">
import { TOTAL_POKEDEX, WILD_POKEMON, filterPokedex } from '~/utils/pokedex'
import type { Rarity } from '~/types/pokedex'

const filters = ref<{
  gen: 1 | 2 | 'all'
  type: string
  rarity: Rarity | 'all'
  query: string
  lang: 'fr' | 'en'
}>({
  gen: 'all',
  type: 'all',
  rarity: 'all',
  query: '',
  lang: 'fr',
})

const filtered = computed(() => filterPokedex(WILD_POKEMON, filters.value))

useHead({
  title: 'Pokédex · claude-pokemon arena',
  meta: [
    {
      name: 'description',
      content: `Browse all ${TOTAL_POKEDEX} Pokémon (Gen 1 + Gen 2) in the claude-pokemon wild pool.`,
    },
  ],
})
</script>

<template>
  <main class="max-w-6xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Back to leaderboard
      </NuxtLink>
    </div>

    <header class="mb-8">
      <h1 class="text-4xl font-bold text-primary">📖 Pokédex</h1>
      <p class="text-secondary mt-2">
        {{ filtered.length }} / {{ TOTAL_POKEDEX }} Pokémon
        <span v-if="filtered.length !== TOTAL_POKEDEX" class="text-muted">(filtered)</span>
      </p>
    </header>

    <PokedexFilters v-model="filters" />

    <div
      v-if="filtered.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      <PokedexCard
        v-for="pokemon in filtered"
        :key="pokemon.id"
        :pokemon="pokemon"
        :lang="filters.lang"
      />
    </div>

    <div v-else class="surface-card border surface-border rounded-lg p-12 text-center">
      <div class="text-6xl mb-4" aria-hidden="true">🔍</div>
      <p class="text-secondary">No Pokémon matches the filters.</p>
    </div>
  </main>
</template>
