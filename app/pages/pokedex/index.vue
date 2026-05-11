<script setup lang="ts">
import { TOTAL_POKEDEX, WILD_POKEMON, filterPokedex } from '~/utils/pokedex'
import type { Rarity } from '~/types/pokedex'
import type { TrainerResponse } from '~/types/api'

const route = useRoute()
const api = useApi()

// Sprint 2.11 — optional ?trainer=<anonId> query param drives a "seen by this
// trainer" overlay. When present we fetch the trainer's pokedex_seen_ids
// and grey out anything they haven't encountered yet.
const trainerAnonId = computed(() => {
  const q = route.query.trainer
  return typeof q === 'string' && /^[a-f0-9]{8,16}$/.test(q) ? q : null
})

// Sprint 2.13 (Q8) — distinguish "trainer doesn't exist" from "Worker error".
// The 404 path renders a friendly "Trainer not found" hint ; anything else
// (network, 5xx) surfaces a real error so we don't silently lie to the user.
type TrainerFetchState =
  | { kind: 'none' }
  | { kind: 'ok'; data: TrainerResponse }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

const { data: trainerState } = await useAsyncData<TrainerFetchState>(
  () => `pokedex-trainer-${trainerAnonId.value ?? 'none'}`,
  async () => {
    if (!trainerAnonId.value) return { kind: 'none' as const }
    try {
      const data = await api.trainer(trainerAnonId.value)
      return { kind: 'ok' as const, data }
    } catch (e) {
      const status =
        (e as { statusCode?: number; response?: { status?: number } } | undefined)?.statusCode ??
        (e as { response?: { status?: number } } | undefined)?.response?.status
      if (status === 404) return { kind: 'not_found' as const }
      const message = e instanceof Error ? e.message : 'unknown'
      return { kind: 'error' as const, message }
    }
  },
)

const trainer = computed<TrainerResponse | null>(() =>
  trainerState.value?.kind === 'ok' ? trainerState.value.data : null,
)
const trainerError = computed(() => {
  const s = trainerState.value
  if (!s) return null
  if (s.kind === 'not_found') return 'not_found' as const
  if (s.kind === 'error') return s.message
  return null
})

const seenSet = computed<Set<string> | null>(() => {
  const ids = trainer.value?.stats.pokedex_seen_ids
  return ids ? new Set(ids) : null
})

const seenCount = computed(() => seenSet.value?.size ?? 0)

const filters = ref<{
  gen: 1 | 2 | 'all'
  type: string
  rarity: Rarity | 'all'
  query: string
  lang: 'fr' | 'en'
  /** Sprint 2.11 — when true, hide species this trainer hasn't seen. */
  seenOnly: boolean
}>({
  gen: 'all',
  type: 'all',
  rarity: 'all',
  query: '',
  lang: 'fr',
  seenOnly: false,
})

const filtered = computed(() => {
  let list = filterPokedex(WILD_POKEMON, filters.value)
  if (filters.value.seenOnly && seenSet.value) {
    list = list.filter(p => seenSet.value!.has(p.id))
  }
  return list
})

useHead({
  title: () =>
    trainerAnonId.value
      ? `Pokédex · trainer ${trainerAnonId.value.slice(0, 8)}`
      : 'Pokédex · claude-pokemon arena',
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
      <p v-if="trainerAnonId && trainer" class="mt-2 text-sm text-accent">
        👀 Trainer view :
        <NuxtLink :to="`/trainer/${trainerAnonId}`" class="underline hover:text-primary">
          {{ trainer.display_name || trainerAnonId.slice(0, 8) }}
        </NuxtLink>
        — {{ seenCount }} / {{ TOTAL_POKEDEX }} encountered
      </p>
      <p v-else-if="trainerError === 'not_found'" class="mt-2 text-sm text-red-400">
        ⚠ Dresseur introuvable ({{ trainerAnonId }})
      </p>
      <p v-else-if="trainerError" class="mt-2 text-sm text-red-400">
        ⚠ Erreur de chargement ({{ trainerError }}). Réessaie dans un instant.
      </p>
    </header>

    <PokedexFilters v-model="filters" />

    <div v-if="seenSet" class="mb-4 flex items-center gap-2 text-sm">
      <input
        id="seen-only"
        v-model="filters.seenOnly"
        type="checkbox"
        class="rounded surface-border"
      />
      <label for="seen-only" class="text-secondary cursor-pointer">
        Show only species this trainer has seen
      </label>
    </div>

    <div
      v-if="filtered.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
    >
      <PokedexCard
        v-for="pokemon in filtered"
        :key="pokemon.id"
        :pokemon="pokemon"
        :lang="filters.lang"
        :seen-by-trainer="seenSet ? seenSet.has(pokemon.id) : undefined"
      />
    </div>

    <div v-else class="card p-12 text-center">
      <div class="text-6xl mb-4" aria-hidden="true">🔍</div>
      <p class="text-secondary">No Pokémon matches the filters.</p>
    </div>
  </main>
</template>
