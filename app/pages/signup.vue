<script setup lang="ts">
// /signup (Sprint 4.2) — web-native trainer creation. Lets a visitor
// without Claude Code create a full first-class account that can do
// everything a CLI-paired user can : edit profile, ladder PvE, live PvP,
// future wild zones (Sprint 4.5+).
//
// Flow :
//   1. Visitor picks one of 4 starters (one per Gen-1 lineage)
//   2. Optionally sets a display_name (else stays anonymous)
//   3. Submit → generates a random anon_id client-side, hits
//      POST /v1/arena/enable with origin='web'
//   4. Worker returns arena_secret ; we stash {anon_id, secret} in
//      localStorage via useArenaSession.set
//   5. Redirect to /profile so the user can immediately customize
//
// If already paired → redirect to /profile (no duplicate accounts).

import { useArenaSession } from '~/composables/useArenaSession'
import { LINEAGE_LABELS } from '~/utils/lineage'

const router = useRouter()
const api = useApi()
const { isPaired, set } = useArenaSession()

onMounted(() => {
  if (isPaired.value) {
    void router.replace('/profile')
  }
})

type Starter = {
  lineage:
    | 'fire'
    | 'water'
    | 'grass'
    | 'electric'
    | 'eevee'
    | 'chikorita'
    | 'cyndaquil'
    | 'totodile'
  label: string
  emoji: string
  description: string
}

// MVP : the 4 canonical Gen-1 starters + Eevee for the 5th option. The
// Johto starters are accessible later via lineage transition events in
// the CLI's mechanic — we keep web signup focused for clarity.
const starters: Starter[] = [
  {
    lineage: 'fire',
    label: 'Salamèche',
    emoji: '🔥',
    description: 'Type Fire. Strong vs Grass, weak vs Water.',
  },
  {
    lineage: 'water',
    label: 'Carapuce',
    emoji: '💧',
    description: 'Type Water. Strong vs Fire, weak vs Grass + Electric.',
  },
  {
    lineage: 'grass',
    label: 'Bulbizarre',
    emoji: '🌿',
    description: 'Type Grass. Strong vs Water, weak vs Fire.',
  },
  {
    lineage: 'electric',
    label: 'Pichu',
    emoji: '⚡',
    description: 'Type Electric. Strong vs Water, weak vs Grass.',
  },
  {
    lineage: 'eevee',
    label: 'Évoli',
    emoji: '🦊',
    description: 'Type Normal. Evolves into 5 forms at Lv.30.',
  },
]

const selectedLineage = ref<Starter['lineage'] | null>(null)
const displayName = ref('')
const submitting = ref(false)
const errorMsg = ref<string | null>(null)

const DISPLAY_NAME_RE = /^[a-zA-Z0-9_-]{2,24}$/

const displayNameValid = computed(() => {
  const v = displayName.value.trim()
  return v === '' || DISPLAY_NAME_RE.test(v)
})

// Generate a fresh anon_id client-side. The Worker accepts any
// 8-16 hex value matching ANON_ID_RE — we pick 16 for collision safety.
function generateAnonId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function signup() {
  if (!selectedLineage.value) {
    errorMsg.value = 'Choisis un starter pour commencer.'
    return
  }
  if (!displayNameValid.value) {
    errorMsg.value =
      'Display name invalide (2-24 chars, alphanumérique + _ -). Laisse vide pour rester anonyme.'
    return
  }
  submitting.value = true
  errorMsg.value = null
  try {
    const anonId = generateAnonId()
    const dn = displayName.value.trim() || null
    const res = await api.arenaEnable({
      anon_id: anonId,
      display_name: dn,
      lineage: selectedLineage.value,
      level: 1, // Web signup starts at Lv.1 ; future endpoints can level up.
      is_shiny: false,
      origin: 'web',
    })
    const stored = set({
      anon_id: anonId,
      arena_secret: res.arena_secret,
      paired_at: new Date().toISOString(),
    })
    if (!stored) {
      throw new Error('localStorage refused the session (private browsing ?)')
    }
    // First-time bootstrap : the trainer record won't exist until the
    // first /v1/submit or profile PATCH. Send the user to /profile so
    // they can edit + the PATCH bootstrap will create their KVRecord.
    await router.push('/profile')
  } catch (e) {
    const status =
      (e as { statusCode?: number; response?: { status?: number } } | undefined)?.statusCode ??
      (e as { response?: { status?: number } } | undefined)?.response?.status
    if (status === 409) {
      errorMsg.value =
        'Cet anon_id existe déjà (collision rarissime). Réessaie — un nouveau sera tiré.'
    } else {
      errorMsg.value = e instanceof Error ? e.message : 'Échec de la création'
    }
  } finally {
    submitting.value = false
  }
}

useHead({
  title: 'Créer un compte · claude-pokemon arena',
  meta: [
    {
      name: 'description',
      content:
        "Crée ton dresseur dans l'arène claude-pokemon — sans installer le CLI. Choisis un starter, joue, progresse.",
    },
  ],
})
</script>

<template>
  <main class="max-w-2xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Retour à l'accueil
      </NuxtLink>
    </div>

    <header class="text-center mb-8">
      <h1
        class="text-3xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3"
      >
        <PokeballIcon size="lg" />
        <span>Créer mon dresseur</span>
      </h1>
      <p class="text-sm text-secondary mt-2 max-w-md mx-auto">
        Pas besoin de Claude Code. Choisis un starter, joue contre les bots de l'arène et fais
        progresser ton Pokémon dans les zones sauvages (à venir).
      </p>
    </header>

    <section class="card p-6 mb-6">
      <h2 class="text-sm uppercase tracking-wider text-muted mb-4">1. Choisis ton starter</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          v-for="s in starters"
          :key="s.lineage"
          type="button"
          class="flex flex-col items-center p-3 rounded-lg border transition"
          :class="
            selectedLineage === s.lineage
              ? 'surface-card-hover ring-2 ring-accent border-accent'
              : 'surface-card surface-border hover:surface-card-hover'
          "
          :title="s.description"
          @click="selectedLineage = s.lineage"
        >
          <PokemonSprite :lineage="s.lineage" :level="1" :is-shiny="false" size="md" animated />
          <div class="mt-2 text-xs font-bold text-primary">{{ s.label }}</div>
          <div class="text-[10px] text-muted text-center mt-0.5">
            {{ LINEAGE_LABELS[s.lineage] }}
          </div>
        </button>
      </div>
      <p v-if="selectedLineage" class="mt-4 text-xs text-secondary text-center">
        {{ starters.find(s => s.lineage === selectedLineage)?.description }}
      </p>
    </section>

    <section class="card p-6 mb-6">
      <h2 class="text-sm uppercase tracking-wider text-muted mb-4">
        2. Display name <span class="text-muted">(optionnel)</span>
      </h2>
      <input
        v-model="displayName"
        type="text"
        maxlength="24"
        placeholder="(laisse vide pour rester anonyme)"
        autocomplete="off"
        class="w-full px-3 py-2 rounded-md border surface-border surface-card text-primary"
        :class="!displayNameValid ? 'border-red-500' : ''"
      />
      <p class="text-xs text-muted mt-1">
        2-24 caractères, alphanumérique + <code>_</code> <code>-</code>. Tu peux le changer plus
        tard depuis ton profil.
      </p>
    </section>

    <section
      class="surface-card border border-accent/30 rounded-lg p-4 mb-6 text-xs text-secondary"
    >
      <p>
        🔒 Ton compte est <strong>anonyme</strong> par défaut — on génère un
        <code>anon_id</code> aléatoire côté navigateur, aucun email requis. La clé
        d'authentification (<code>arena_secret</code>) est stockée dans le localStorage. Tu pourras
        plus tard lier ton install CLI <code>claude-pokemon</code> à ce compte.
      </p>
    </section>

    <div class="flex flex-col items-center gap-3">
      <button
        type="button"
        class="px-8 py-3 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition disabled:opacity-50"
        :disabled="submitting || !selectedLineage || !displayNameValid"
        @click="signup"
      >
        {{ submitting ? 'Création en cours...' : 'Créer mon dresseur' }}
      </button>
      <p v-if="errorMsg" class="text-sm text-red-400">⚠ {{ errorMsg }}</p>
      <NuxtLink to="/pair" class="text-xs text-secondary underline hover:text-primary transition">
        J'ai déjà un compte CLI — je veux pair
      </NuxtLink>
    </div>
  </main>
</template>
