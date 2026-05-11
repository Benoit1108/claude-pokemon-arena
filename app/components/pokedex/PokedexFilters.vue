<script setup lang="ts">
import { uniqueTypes, WILD_POKEMON } from '~/utils/pokedex'
import type { Rarity } from '~/types/pokedex'

const filters = defineModel<{
  gen: 1 | 2 | 'all'
  type: string
  rarity: Rarity | 'all'
  query: string
  lang: 'fr' | 'en'
}>({ required: true })

const types = ['all', ...uniqueTypes(WILD_POKEMON)]

function reset() {
  filters.value = { gen: 'all', type: 'all', rarity: 'all', query: '', lang: filters.value.lang }
}
</script>

<template>
  <div class="card p-4 mb-6">
    <div class="flex flex-wrap gap-3 items-center">
      <input
        v-model="filters.query"
        type="search"
        placeholder="Search name…"
        class="px-3 py-2 surface-card-hover border surface-border rounded-md text-sm flex-grow min-w-[200px] outline-none focus:ring-2 focus:ring-accent text-primary"
      />

      <select
        v-model="filters.gen"
        class="px-3 py-2 surface-card-hover border surface-border rounded-md text-sm text-primary cursor-pointer"
      >
        <option value="all">All gens</option>
        <option :value="1">Gen 1 (#1-151)</option>
        <option :value="2">Gen 2 (#152-251)</option>
      </select>

      <select
        v-model="filters.type"
        class="px-3 py-2 surface-card-hover border surface-border rounded-md text-sm text-primary cursor-pointer"
      >
        <option v-for="t in types" :key="t" :value="t">
          {{ t === 'all' ? 'All types' : t }}
        </option>
      </select>

      <select
        v-model="filters.rarity"
        class="px-3 py-2 surface-card-hover border surface-border rounded-md text-sm text-primary cursor-pointer"
      >
        <option value="all">All rarities</option>
        <option value="common">Common</option>
        <option value="rare">Rare</option>
        <option value="legendary">Legendary</option>
      </select>

      <select
        v-model="filters.lang"
        class="px-3 py-2 surface-card-hover border surface-border rounded-md text-sm text-primary cursor-pointer"
        title="Display language for Pokémon names"
      >
        <option value="fr">FR names</option>
        <option value="en">EN names</option>
      </select>

      <button
        type="button"
        class="px-3 py-2 text-sm text-secondary hover:text-primary transition"
        @click="reset"
      >
        Reset
      </button>
    </div>
  </div>
</template>
