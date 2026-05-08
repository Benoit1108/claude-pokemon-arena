<script setup lang="ts">
// Pokémon species detail page (Sprint 2.13 UA2). Reachable from any
// PokedexCard click. Shows :
//   - XL animated sprite (back + front side-by-side)
//   - National dex, generation, type (with the existing type color)
//   - Rarity badge (common / rare / legendary)
//   - Same-generation prev/next navigation
//
// Read-only ; no Worker call. Everything comes from the bundled wild_pool
// JSON via WILD_POKEMON, so the page is fully SSG-friendly.

import { nextPokemon, pokemonById, previousPokemon, typeColor } from '~/utils/pokedex'

const route = useRoute()

const id = computed(() => {
  const v = route.params.id
  return typeof v === 'string' ? v : ''
})

const species = computed(() => pokemonById(id.value))

if (!species.value && import.meta.server) {
  setResponseStatus(404)
}

const prev = computed(() => (species.value ? previousPokemon(species.value) : null))
const next = computed(() => (species.value ? nextPokemon(species.value) : null))

const generation = computed(() => {
  if (!species.value) return null
  return species.value.national_dex <= 151 ? 1 : 2
})

const region = computed(() => (generation.value === 1 ? 'Kanto' : 'Johto'))

const SHOWDOWN_BASE = 'https://play.pokemonshowdown.com/sprites'

const frontUrl = computed(() =>
  species.value ? `${SHOWDOWN_BASE}/ani/${species.value.id}.gif` : '',
)
const backUrl = computed(() =>
  species.value ? `${SHOWDOWN_BASE}/ani-back/${species.value.id}.gif` : '',
)
const shinyUrl = computed(() =>
  species.value ? `${SHOWDOWN_BASE}/ani-shiny/${species.value.id}.gif` : '',
)

const frontFailed = ref(false)
const backFailed = ref(false)
const shinyFailed = ref(false)

useHead({
  title: () =>
    species.value
      ? `${species.value.name_fr} · #${species.value.national_dex.toString().padStart(3, '0')} · pokédex`
      : 'Pokémon introuvable · pokédex',
  meta: [
    {
      name: 'description',
      content: () =>
        species.value
          ? `${species.value.name_fr} (${species.value.name_en}) · type ${species.value.type} · rareté ${species.value.rarity}`
          : '',
    },
  ],
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-6 py-12">
    <div class="mb-6 flex items-center gap-4">
      <NuxtLink to="/pokedex" class="text-secondary hover:text-primary text-sm transition">
        ← Pokédex
      </NuxtLink>
    </div>

    <div v-if="!species" class="surface-card border surface-border rounded-lg p-12 text-center">
      <div class="text-6xl mb-4" aria-hidden="true">🔍</div>
      <h1 class="text-2xl font-bold text-primary mb-2">Pokémon introuvable</h1>
      <p class="text-secondary">
        Aucune espèce avec l'id <code class="text-accent">{{ id }}</code> dans Gen 1 + Gen 2.
      </p>
    </div>

    <template v-else>
      <header class="text-center mb-8">
        <div class="text-xs uppercase tracking-widest text-muted mb-1">
          #{{ species.national_dex.toString().padStart(3, '0') }} · {{ region }} (Gen
          {{ generation }})
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-primary">
          {{ species.name_fr }}
          <span class="block text-lg text-muted font-normal mt-1">{{ species.name_en }}</span>
        </h1>
      </header>

      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <div class="surface-card border surface-border rounded-lg p-4 flex flex-col items-center">
          <div class="text-xs uppercase tracking-widest text-muted mb-2">Front</div>
          <img
            v-if="!frontFailed"
            :src="frontUrl"
            :alt="`${species.name_en} front sprite`"
            loading="lazy"
            decoding="async"
            class="w-32 h-32 object-contain pixel-render"
            @error="frontFailed = true"
          />
          <span v-else class="text-7xl" aria-hidden="true">{{ species.emoji }}</span>
        </div>

        <div class="surface-card border surface-border rounded-lg p-4 flex flex-col items-center">
          <div class="text-xs uppercase tracking-widest text-muted mb-2">Back</div>
          <img
            v-if="!backFailed"
            :src="backUrl"
            :alt="`${species.name_en} back sprite`"
            loading="lazy"
            decoding="async"
            class="w-32 h-32 object-contain pixel-render"
            @error="backFailed = true"
          />
          <span v-else class="text-7xl" aria-hidden="true">{{ species.emoji }}</span>
        </div>

        <div class="surface-card border surface-border rounded-lg p-4 flex flex-col items-center">
          <div class="text-xs uppercase tracking-widest text-muted mb-2">✦ Shiny</div>
          <img
            v-if="!shinyFailed"
            :src="shinyUrl"
            :alt="`${species.name_en} shiny sprite`"
            loading="lazy"
            decoding="async"
            class="w-32 h-32 object-contain pixel-render"
            @error="shinyFailed = true"
          />
          <span v-else class="text-7xl" aria-hidden="true">{{ species.emoji }}</span>
        </div>
      </div>

      <div class="surface-card border surface-border rounded-lg p-6 mb-8">
        <h2 class="text-sm uppercase tracking-wider text-muted mb-4">Caractéristiques</h2>
        <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div class="flex justify-between">
            <dt class="text-secondary">Type</dt>
            <dd class="font-semibold" :class="typeColor(species.type)">{{ species.type }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-secondary">Rareté</dt>
            <dd>
              <span
                v-if="species.rarity === 'legendary'"
                class="text-accent font-bold tracking-wider"
                >★ légendaire</span
              >
              <span
                v-else-if="species.rarity === 'rare'"
                class="text-purple-400 dark:text-purple-300 font-bold tracking-wider"
                >◆ rare</span
              >
              <span v-else class="text-primary">commune</span>
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-secondary">Numéro Pokédex</dt>
            <dd class="font-mono text-primary">
              #{{ species.national_dex.toString().padStart(3, '0') }} / 251
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-secondary">Région d'origine</dt>
            <dd class="text-primary">{{ region }}</dd>
          </div>
          <div class="flex justify-between sm:col-span-2">
            <dt class="text-secondary">Identifiant Showdown</dt>
            <dd>
              <code class="text-secondary text-xs">{{ species.id }}</code>
            </dd>
          </div>
        </dl>
      </div>

      <nav class="flex justify-between gap-3 mb-8 text-sm">
        <NuxtLink
          v-if="prev"
          :to="`/pokedex/${prev.id}`"
          class="surface-card border surface-border rounded-md px-4 py-2 surface-card-hover transition flex items-center gap-2 max-w-[45%]"
        >
          <span aria-hidden="true">←</span>
          <span class="text-muted text-xs"
            >#{{ prev.national_dex.toString().padStart(3, '0') }}</span
          >
          <span class="text-primary truncate">{{ prev.name_fr }}</span>
        </NuxtLink>
        <span v-else class="invisible">—</span>

        <NuxtLink
          v-if="next"
          :to="`/pokedex/${next.id}`"
          class="surface-card border surface-border rounded-md px-4 py-2 surface-card-hover transition flex items-center gap-2 max-w-[45%] ml-auto"
        >
          <span class="text-primary truncate">{{ next.name_fr }}</span>
          <span class="text-muted text-xs"
            >#{{ next.national_dex.toString().padStart(3, '0') }}</span
          >
          <span aria-hidden="true">→</span>
        </NuxtLink>
        <span v-else class="invisible">—</span>
      </nav>

      <div class="text-xs text-muted text-center">Sprite source : Pokémon Showdown.</div>
    </template>
  </main>
</template>
