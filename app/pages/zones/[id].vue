<script setup lang="ts">
// /zones/<id> (Sprint 4.7) — explore + encounter + fight UI for a single
// wild zone. The flow :
//
//   1. Visit page → fetch zone detail (public)
//   2. Click "Explorer" → POST /v1/zone/<id>/explore
//      → may yield encounter / item / nothing
//   3. If encounter : show wild sprite + "Combattre" or "Fuir"
//      - "Combattre" → POST /v1/zone/<id>/fight → battle replay via
//        BattleStage + XP gain banner
//      - "Fuir" → POST /v1/zone/<id>/flee → back to explore
//   4. After battle resolves : button to keep exploring (refreshes
//      useTrainerProfile to update header level)

import { useArenaSession } from '~/composables/useArenaSession'
import { useTrainerProfile } from '~/composables/useTrainerProfile'
import { lineageGradient } from '~/utils/lineage'
import type {
  ExploreOutcome,
  ItemDrop,
  PendingEncounter,
  ZoneDetail,
  ZoneFightResult,
} from '~/types/api'

definePageMeta({ ssr: false })

const route = useRoute()
const router = useRouter()
const api = useApi()
const { session, isPaired } = useArenaSession()
const { trainer, refresh: refreshTrainer } = useTrainerProfile()

const zoneId = computed(() => route.params.id as string)

const { data: zoneData, error: zoneError } = await useAsyncData(
  () => `zone-${zoneId.value}`,
  () => api.zoneDetail(zoneId.value),
)
const zone = computed<ZoneDetail | null>(() => zoneData.value ?? null)

// UI state machine — simple linear progression.
const exploreState = ref<
  | { kind: 'idle' }
  | { kind: 'exploring' }
  | { kind: 'cooldown'; secondsLeft: number }
  | { kind: 'encounter'; encounter: PendingEncounter }
  | { kind: 'item'; item: ItemDrop }
  | { kind: 'nothing' }
  | { kind: 'fighting' }
  | { kind: 'fight-result'; result: ZoneFightResult }
  | { kind: 'error'; message: string }
>({ kind: 'idle' })

// Cooldown ticker — decrements every second so the UI shows a live countdown.
let cooldownTimer: ReturnType<typeof setInterval> | null = null
function startCooldownTicker(seconds: number) {
  stopCooldownTicker()
  exploreState.value = { kind: 'cooldown', secondsLeft: seconds }
  cooldownTimer = setInterval(() => {
    if (exploreState.value.kind !== 'cooldown') {
      stopCooldownTicker()
      return
    }
    const next = exploreState.value.secondsLeft - 1
    if (next <= 0) {
      stopCooldownTicker()
      exploreState.value = { kind: 'idle' }
    } else {
      exploreState.value = { kind: 'cooldown', secondsLeft: next }
    }
  }, 1000)
}
function stopCooldownTicker() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}
onBeforeUnmount(stopCooldownTicker)

const trainerLevel = computed(() => trainer.value?.stats.active.current_level ?? 0)
const isLocked = computed(() => {
  if (!zone.value) return false
  return trainerLevel.value < zone.value.level_min - 10
})

async function startExplore() {
  if (!session.value) {
    void router.push('/signup')
    return
  }
  if (!zone.value) return
  exploreState.value = { kind: 'exploring' }
  try {
    const res = (await api.zoneExplore({
      zoneId: zone.value.id,
      anonId: session.value.anon_id,
      arenaSecret: session.value.arena_secret,
    })) as ExploreOutcome
    if (res.kind === 'encounter') {
      exploreState.value = { kind: 'encounter', encounter: res.encounter }
    } else if (res.kind === 'item') {
      exploreState.value = { kind: 'item', item: res.item }
    } else {
      exploreState.value = { kind: 'nothing' }
    }
  } catch (e) {
    // Parse the worker's structured error body — different 403 codes need
    // different user-facing messages (arena_not_enabled ≠ zone_locked).
    const errObj = e as
      | {
          statusCode?: number
          data?: { error?: string; cooldown_remaining_s?: number; message?: string }
          response?: {
            status?: number
            _data?: { error?: string; cooldown_remaining_s?: number; message?: string }
          }
          message?: string
        }
      | undefined
    const status = errObj?.statusCode ?? errObj?.response?.status
    const data = errObj?.data ?? errObj?.response?._data
    const code = data?.error

    if (status === 429 && data?.cooldown_remaining_s) {
      startCooldownTicker(data.cooldown_remaining_s)
      return
    }
    if (code === 'arena_not_enabled') {
      exploreState.value = {
        kind: 'error',
        message:
          "Ton compte n'existe pas sur ce serveur. En local, crée un compte via /signup d'abord (les comptes prod n'existent pas dans le KV local).",
      }
      return
    }
    if (code === 'zone_locked') {
      exploreState.value = {
        kind: 'error',
        message: data?.message ?? 'Cette zone est verrouillée — ton niveau est trop bas.',
      }
      return
    }
    if (code === 'invalid_secret') {
      exploreState.value = {
        kind: 'error',
        message: 'Ton arena_secret est rejeté. Re-pair ton CLI ou crée un nouveau compte.',
      }
      return
    }
    exploreState.value = {
      kind: 'error',
      message: e instanceof Error ? e.message : "Échec de l'exploration",
    }
  }
}

async function fight() {
  if (!session.value || !zone.value || exploreState.value.kind !== 'encounter') return
  exploreState.value = { kind: 'fighting' }
  try {
    const result = await api.zoneFight({
      zoneId: zone.value.id,
      anonId: session.value.anon_id,
      arenaSecret: session.value.arena_secret,
    })
    exploreState.value = { kind: 'fight-result', result }
    await refreshTrainer() // refresh header level / XP
  } catch (e) {
    exploreState.value = {
      kind: 'error',
      message: e instanceof Error ? e.message : 'Échec du combat',
    }
  }
}

async function flee() {
  if (!session.value || !zone.value) return
  try {
    await api.zoneFlee({
      zoneId: zone.value.id,
      anonId: session.value.anon_id,
      arenaSecret: session.value.arena_secret,
    })
  } catch {
    /* idempotent — just continue */
  }
  // Cooldown was set on explore so we're still gated.
  startCooldownTicker(20)
}

function backToIdle() {
  exploreState.value = { kind: 'idle' }
  startCooldownTicker(20) // explore re-enables after the 20s cooldown
}

// Fallback to a static PNG if the animated GIF doesn't exist for this
// species on Showdown's CDN. Kept as a plain handler (typed via the event
// generic) rather than inline JS in the template so vue-tsc is happy.
function spriteOnError(e: Event, fallback: string) {
  const target = e.target
  if (target instanceof HTMLImageElement) {
    target.src = fallback
  }
}

const backdropStyle = computed(() => {
  if (!zone.value) return 'none'
  return lineageGradient(null)
})

useHead({
  title: () => (zone.value ? `${zone.value.name_fr} · zones` : 'Zone introuvable'),
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-6 py-12" :style="{ background: backdropStyle }">
    <div class="mb-6">
      <NuxtLink to="/zones" class="text-secondary hover:text-primary text-sm transition">
        ← Toutes les zones
      </NuxtLink>
    </div>

    <div v-if="zoneError || !zone" class="card p-8 text-center">
      <div class="text-4xl mb-2" aria-hidden="true">🗺️</div>
      <p class="text-secondary">Zone introuvable.</p>
    </div>

    <template v-else>
      <header class="text-center mb-8">
        <div class="text-6xl mb-2" aria-hidden="true">{{ zone.emoji }}</div>
        <h1 class="text-3xl font-bold text-primary">{{ zone.name_fr }}</h1>
        <p class="text-sm text-secondary mt-2">{{ zone.flavor_fr }}</p>
        <p class="text-xs text-muted mt-2">
          Niveaux :
          <strong class="text-primary">Lv.{{ zone.level_min }} — Lv.{{ zone.level_max }}</strong>
          <span v-if="trainerLevel"> · ton niveau : Lv.{{ trainerLevel }}</span>
        </p>
      </header>

      <!-- Signup / pair prompt -->
      <div
        v-if="!isPaired"
        class="surface-card border border-accent/40 rounded-lg p-6 mb-6 text-center"
      >
        <p class="text-secondary mb-3">
          Pour explorer cette zone, tu as besoin d'un compte trainer.
        </p>
        <div class="flex justify-center gap-2 flex-wrap">
          <NuxtLink
            to="/signup"
            class="px-4 py-2 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition text-sm"
          >
            🎮 Créer mon dresseur
          </NuxtLink>
          <NuxtLink
            to="/pair"
            class="px-4 py-2 border surface-border rounded-md surface-card-hover transition text-sm"
          >
            🔗 Pair mon CLI
          </NuxtLink>
        </div>
      </div>

      <!-- Locked zone -->
      <div
        v-else-if="isLocked"
        class="surface-card border border-red-500/30 rounded-lg p-8 text-center"
      >
        <div class="text-4xl mb-2" aria-hidden="true">🔒</div>
        <p class="text-secondary">
          Cette zone exige au moins le niveau <strong>{{ zone.level_min - 10 }}</strong
          >. Tu es niveau {{ trainerLevel }}. Explore les zones plus faciles pour monter en niveau.
        </p>
        <NuxtLink to="/zones" class="text-accent underline text-sm mt-4 inline-block">
          ← Choisir une autre zone
        </NuxtLink>
      </div>

      <!-- Idle : explore button -->
      <div v-else-if="exploreState.kind === 'idle'" class="card p-8 text-center">
        <p class="text-sm text-secondary mb-4">
          Plonge dans les hautes herbes pour rencontrer un Pokémon sauvage.
        </p>
        <button
          type="button"
          class="px-8 py-3 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition"
          @click="startExplore"
        >
          🌿 Explorer
        </button>
      </div>

      <!-- Exploring -->
      <div v-else-if="exploreState.kind === 'exploring'" class="card p-8 text-center">
        <div class="text-3xl mb-2 animate-pulse" aria-hidden="true">🌿</div>
        <p class="text-secondary">Tu fouilles les hautes herbes…</p>
      </div>

      <!-- Cooldown -->
      <div v-else-if="exploreState.kind === 'cooldown'" class="card p-8 text-center">
        <div class="text-3xl mb-2" aria-hidden="true">⏳</div>
        <p class="text-secondary">
          Repos avant la prochaine exploration :
          <strong class="text-primary">{{ exploreState.secondsLeft }}s</strong>
        </p>
      </div>

      <!-- Encounter -->
      <div
        v-else-if="exploreState.kind === 'encounter'"
        class="surface-card border-2 border-accent rounded-lg p-6 text-center"
      >
        <div class="text-xs uppercase tracking-widest text-muted mb-2">
          {{
            exploreState.encounter.pool === 'legendary'
              ? '★ Pokémon légendaire !'
              : exploreState.encounter.pool === 'rare'
                ? '◆ Pokémon rare'
                : 'Pokémon sauvage'
          }}
        </div>
        <h2 class="text-2xl font-bold text-primary mb-1 capitalize">
          {{ exploreState.encounter.species_id }}
          <span v-if="exploreState.encounter.is_shiny" class="text-accent" title="Shiny">✦</span>
        </h2>
        <p class="text-sm text-secondary mb-4">Lv.{{ exploreState.encounter.level }}</p>
        <div class="flex justify-center mb-6">
          <img
            :src="`https://play.pokemonshowdown.com/sprites/ani${exploreState.encounter.is_shiny ? '-shiny' : ''}/${exploreState.encounter.species_id}.gif`"
            :alt="exploreState.encounter.species_id"
            class="w-32 h-32 object-contain pixel-render"
            @error="
              e =>
                spriteOnError(
                  e,
                  `https://play.pokemonshowdown.com/sprites/gen5/${exploreState.kind === 'encounter' ? exploreState.encounter.species_id : ''}.png`,
                )
            "
          />
        </div>
        <div class="flex justify-center gap-3 flex-wrap">
          <button
            type="button"
            class="px-5 py-2 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition"
            @click="fight"
          >
            ⚔️ Combattre
          </button>
          <button
            type="button"
            class="px-5 py-2 border surface-border rounded-md surface-card-hover transition text-sm text-secondary"
            @click="flee"
          >
            💨 Fuir
          </button>
        </div>
      </div>

      <!-- Item -->
      <div v-else-if="exploreState.kind === 'item'" class="card p-8 text-center">
        <div class="text-5xl mb-2" aria-hidden="true">{{ exploreState.item.emoji }}</div>
        <p class="text-primary font-bold">Tu as trouvé un objet !</p>
        <p class="text-xs text-secondary mt-1 capitalize">{{ exploreState.item.kind }}</p>
        <p class="text-[10px] text-muted mt-2 italic">
          (système d'inventaire à venir — l'objet est purement décoratif pour l'instant)
        </p>
        <button
          type="button"
          class="mt-4 px-5 py-2 border surface-border rounded-md surface-card-hover transition text-sm"
          @click="backToIdle"
        >
          Continuer
        </button>
      </div>

      <!-- Nothing -->
      <div v-else-if="exploreState.kind === 'nothing'" class="card p-8 text-center">
        <div class="text-3xl mb-2" aria-hidden="true">🍃</div>
        <p class="text-secondary">Rien n'a bougé dans les herbes…</p>
        <button
          type="button"
          class="mt-4 px-5 py-2 border surface-border rounded-md surface-card-hover transition text-sm"
          @click="backToIdle"
        >
          Réessayer
        </button>
      </div>

      <!-- Fighting -->
      <div v-else-if="exploreState.kind === 'fighting'" class="card p-8 text-center">
        <div class="text-3xl mb-2 animate-pulse" aria-hidden="true">⚔️</div>
        <p class="text-secondary">Combat en cours…</p>
      </div>

      <!-- Fight result -->
      <div v-else-if="exploreState.kind === 'fight-result'" class="space-y-4">
        <BattleStage
          v-if="trainer"
          :challenger="exploreState.result.battle.challenger"
          :defender="exploreState.result.battle.defender"
          :winner="exploreState.result.battle.winner"
          :visible-turns="exploreState.result.battle.turns"
          :show-final-state="true"
          :show-intro="false"
        />
        <div
          v-if="exploreState.result.won"
          class="surface-card border-2 border-emerald-500/40 rounded-lg p-5 text-center"
        >
          <p class="text-emerald-400 font-bold text-lg">🎉 Victoire !</p>
          <p class="text-sm text-secondary mt-2">
            +{{ exploreState.result.xp.amount }} XP
            <span class="text-xs text-muted">
              ({{ exploreState.result.xp.breakdown.base }} base ×
              {{ exploreState.result.xp.breakdown.effectiveness_modifier }} eff ×
              {{ exploreState.result.xp.breakdown.pool_modifier }} pool)
            </span>
          </p>
          <p v-if="exploreState.result.leveled_up" class="mt-3 text-accent font-bold">
            ⬆ Niveau {{ exploreState.result.new_level }} atteint !
          </p>
        </div>
        <div v-else class="surface-card border border-red-500/30 rounded-lg p-5 text-center">
          <p class="text-red-400 font-bold">💔 Défaite</p>
          <p class="text-xs text-secondary mt-1">
            Pas de XP cette fois. Le Pokémon sauvage s'enfuit.
          </p>
        </div>
        <div class="text-center">
          <button
            type="button"
            class="px-5 py-2 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition"
            @click="backToIdle"
          >
            Continuer à explorer
          </button>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="exploreState.kind === 'error'"
        class="surface-card border border-red-500/30 rounded-lg p-6 text-center"
      >
        <p class="text-red-400">⚠ {{ exploreState.message }}</p>
        <button
          type="button"
          class="mt-3 px-4 py-2 border surface-border rounded-md surface-card-hover transition text-sm"
          @click="backToIdle"
        >
          Retour
        </button>
      </div>
    </template>
  </main>
</template>
