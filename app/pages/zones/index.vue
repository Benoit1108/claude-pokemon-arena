<script setup lang="ts">
// /zones (Sprint 4.7) — map of all 8 wild zones. Each tile shows :
//   - emoji + name + level bracket
//   - "Locked" overlay if trainer level < zone.level_min - 10
//   - "Outclassed" subtle hint if trainer level > zone.level_max + 10
//   - clickable → /zones/<id>
//
// When not paired : the page still works as a preview ; tiles are clickable
// but the explore button on the detail page will prompt for signup.

import type { ZoneSummary } from '~/types/api'

const api = useApi()
const { trainer } = useTrainerProfile()

const {
  data: zonesData,
  error: zonesError,
  pending: zonesPending,
} = await useAsyncData('zones-list', () => api.zonesList())

const zones = computed(() => zonesData.value?.zones ?? [])

// Sprint 4.8 fix — surface fetch failures clearly. Common cause :
// runtimeConfig.public.apiBase points at a worker that isn't running
// or doesn't have /v1/zones (pre-Sprint-4.5 prod). Show the error
// instead of a silent blank page.
const errorMessage = computed(() => {
  if (!zonesError.value) return null
  const e = zonesError.value as { message?: string; statusCode?: number }
  return e.message || `Erreur HTTP ${e.statusCode ?? '??'}`
})
const trainerLevel = computed(() => trainer.value?.stats.active.current_level ?? 0)

function statusFor(z: ZoneSummary): {
  state: 'locked' | 'sweet' | 'outclassed' | 'preview'
  label: string
} {
  if (!trainer.value) return { state: 'preview', label: 'Connecte-toi pour explorer' }
  if (trainerLevel.value < z.level_min - 10) {
    return {
      state: 'locked',
      label: `Verrouillé — niveau min ${Math.max(1, z.level_min - 10)}`,
    }
  }
  if (trainerLevel.value > z.level_max + 10) {
    return { state: 'outclassed', label: 'Trop facile — XP réduit' }
  }
  return { state: 'sweet', label: 'XP optimal' }
}

useHead({
  title: 'Zones sauvages · claude-pokemon arena',
  meta: [
    {
      name: 'description',
      content: "Explore les zones sauvages de claude-pokemon — capture, combat, gagne de l'XP.",
    },
  ],
})
</script>

<template>
  <main class="max-w-5xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Retour
      </NuxtLink>
    </div>

    <header class="text-center mb-8">
      <h1
        class="text-3xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3"
      >
        <span aria-hidden="true">🗺️</span>
        <span>Zones sauvages</span>
      </h1>
      <p class="text-sm text-secondary mt-2 max-w-xl mx-auto">
        8 zones thématiques, chacune avec son écosystème de Pokémon sauvages. Combat les pour gagner
        de l'XP et grimper en niveau.
      </p>
      <p v-if="trainer" class="text-xs text-muted mt-2">
        Tu es niveau {{ trainerLevel }} · XP optimal entre Lv. dans la zone
      </p>
    </header>

    <!-- Sprint 4.8 fix — explicit loading + error + empty states so we
         never show a silent blank page when /v1/zones can't be reached. -->
    <div v-if="zonesPending" class="surface-card border surface-border rounded-lg p-12 text-center">
      <div class="text-3xl mb-2 animate-pulse" aria-hidden="true">🗺️</div>
      <p class="text-secondary">Chargement de la carte des zones…</p>
    </div>

    <div
      v-else-if="errorMessage"
      class="surface-card border border-red-500/30 rounded-lg p-8 text-center"
    >
      <div class="text-3xl mb-2" aria-hidden="true">⚠️</div>
      <p class="text-red-400 font-bold">Impossible de charger les zones.</p>
      <p class="text-xs text-secondary mt-2">{{ errorMessage }}</p>
      <p class="text-[10px] text-muted mt-4 max-w-md mx-auto">
        Vérifie que le worker tourne (en local : <code>npm run dev</code> dans
        <code>claude-pokemon/api/</code>) et que l'URL
        <code>{{ String(useRuntimeConfig().public.apiBase) }}/v1/zones</code> répond.
      </p>
    </div>

    <div
      v-else-if="zones.length === 0"
      class="surface-card border surface-border rounded-lg p-8 text-center"
    >
      <div class="text-3xl mb-2" aria-hidden="true">🌵</div>
      <p class="text-secondary">Aucune zone catalog ée pour le moment.</p>
    </div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="z in zones"
        :key="z.id"
        :to="`/zones/${z.id}`"
        class="surface-card border surface-border rounded-lg p-5 surface-card-hover transition relative overflow-hidden"
      >
        <div class="text-5xl mb-3 text-center" aria-hidden="true">{{ z.emoji }}</div>
        <h2 class="text-lg font-bold text-primary text-center">{{ z.name_fr }}</h2>
        <p class="text-xs text-muted text-center mt-1">
          Lv.{{ z.level_min }} — Lv.{{ z.level_max }}
        </p>
        <p class="text-xs text-secondary mt-3 line-clamp-2">{{ z.flavor_fr }}</p>

        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-muted">
            {{ z.wild_pool_size }} communes
            <span v-if="z.rare_pool_size > 0">· {{ z.rare_pool_size }} rares</span>
            <span v-if="z.legendary_pool_size > 0" class="text-accent">
              · {{ z.legendary_pool_size }} ★
            </span>
          </span>
        </div>

        <!-- Status overlay -->
        <div
          v-if="statusFor(z).state === 'locked'"
          class="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"
        >
          <div class="text-center">
            <div class="text-4xl mb-2" aria-hidden="true">🔒</div>
            <p class="text-sm text-secondary">{{ statusFor(z).label }}</p>
          </div>
        </div>
        <div
          v-else-if="statusFor(z).state === 'outclassed'"
          class="absolute top-2 right-2 text-[10px] uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded"
        >
          ↓ XP réduit
        </div>
        <div
          v-else-if="statusFor(z).state === 'sweet'"
          class="absolute top-2 right-2 text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded"
        >
          ✓ Optimal
        </div>
        <div
          v-else-if="statusFor(z).state === 'preview'"
          class="absolute top-2 right-2 text-[10px] uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded"
        >
          Aperçu
        </div>
      </NuxtLink>
    </div>
  </main>
</template>
