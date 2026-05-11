<script setup lang="ts">
// /profile (Sprint 3.6.3) — the paired user's editable profile page.
// Distinct from /trainer/<anon_id> which is the public read-only view of
// any trainer (including their own). Here :
//   - shows the paired account's full record + identity (anon_id, paired_at)
//   - inline-edit display_name, quote, bio
//   - multi-select pinned_badges from owned badges
//   - "Regenerate arena_secret" (calls existing /v1/arena/regenerate) for
//     when the user thinks the secret leaked
//   - "Déconnecter ce navigateur" (clear localStorage)
//
// When NOT paired, redirects to /pair so the visitor knows how to log in.

import { badgeMeta } from '~/utils/badges'
import { LINEAGE_LABELS, lineageAccent } from '~/utils/lineage'

const router = useRouter()
const api = useApi()
const { session, isPaired, clear } = useArenaSession()
const { trainer, fetching, error: fetchError, refresh } = useTrainerProfile()

// SSR-safe redirect : router.push triggers a navigation on the client.
onMounted(() => {
  if (!isPaired.value) {
    void router.replace('/pair')
  }
})

// Form state — mirrors the editable fields. Initial values pulled from
// the trainer record once it loads.
const formDisplayName = ref('')
const formQuote = ref('')
const formBio = ref('')
const formPinned = ref<string[]>([])

const saving = ref(false)
const saveMessage = ref<string | null>(null)
const saveError = ref<string | null>(null)

// When the trainer record arrives (or refreshes), prime the form fields.
watch(
  trainer,
  t => {
    if (t) {
      formDisplayName.value = t.display_name ?? ''
      formQuote.value = t.quote ?? ''
      formBio.value = t.bio ?? ''
      formPinned.value = [...(t.pinned_badges ?? [])]
    }
  },
  { immediate: true },
)

const ownedBadges = computed(() => trainer.value?.stats.badges ?? [])
const accent = computed(() => lineageAccent(trainer.value?.stats.active.lineage ?? null))

// Live char counts for the textareas.
const bioCharCount = computed(() => formBio.value.length)
const quoteCharCount = computed(() => formQuote.value.length)
const bioLineCount = computed(() => formBio.value.split('\n').length)

const pinnedLimit = 3
const tooManyPinned = computed(() => formPinned.value.length > pinnedLimit)

function togglePin(badge: string) {
  const idx = formPinned.value.indexOf(badge)
  if (idx >= 0) {
    formPinned.value.splice(idx, 1)
  } else {
    if (formPinned.value.length >= pinnedLimit) return // hard cap
    formPinned.value.push(badge)
  }
}

async function save() {
  if (!session.value) return
  saving.value = true
  saveMessage.value = null
  saveError.value = null
  try {
    await api.trainerProfilePatch({
      anonId: session.value.anon_id,
      arenaSecret: session.value.arena_secret,
      patch: {
        display_name: formDisplayName.value.trim() || null,
        quote: formQuote.value.trim() || null,
        bio: formBio.value.trim() || null,
        pinned_badges: formPinned.value,
      },
    })
    saveMessage.value = '✓ Profil mis à jour.'
    await refresh()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Échec de la sauvegarde'
  } finally {
    saving.value = false
  }
}

function unpair() {
  clear()
  void router.push('/')
}

// Sprint 4.3 — Pair my CLI flow. Generates a 6-char code from the worker
// that the user types into `/pokemon arena link <code>` on their CLI. The
// CLI then receives this trainer's anon_id + secret, so the same account
// is usable from both sides.
const pairCode = ref<string | null>(null)
const pairExpiresAt = ref<string | null>(null)
const pairIssuing = ref(false)
const pairError = ref<string | null>(null)

async function issuePairCode() {
  if (!session.value) return
  pairIssuing.value = true
  pairError.value = null
  pairCode.value = null
  try {
    const res = await api.arenaPairInit({
      anonId: session.value.anon_id,
      arenaSecret: session.value.arena_secret,
    })
    pairCode.value = res.code
    pairExpiresAt.value = res.expires_at
  } catch (e) {
    pairError.value = e instanceof Error ? e.message : 'Échec de génération du code'
  } finally {
    pairIssuing.value = false
  }
}

useHead({
  title: 'Mon profil · claude-pokemon arena',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-6 py-12">
    <div class="mb-6">
      <NuxtLink to="/" class="text-secondary hover:text-primary text-sm transition">
        ← Retour
      </NuxtLink>
    </div>

    <header class="text-center mb-8">
      <h1 class="text-3xl font-bold text-primary flex items-center justify-center gap-3">
        <PokeballIcon size="lg" />
        <span>Mon profil</span>
      </h1>
      <p v-if="session" class="text-xs text-muted mt-2">
        anon_id <code class="text-secondary">{{ session.anon_id }}</code>
        · paired
        <time :datetime="session.paired_at">{{
          new Date(session.paired_at).toLocaleDateString()
        }}</time>
      </p>
    </header>

    <div v-if="!isPaired" class="card p-8 text-center">
      <p class="text-secondary">Redirection vers <code>/pair</code>...</p>
    </div>

    <div v-else-if="fetching && !trainer" class="card p-8 text-center">
      <p class="text-secondary">Chargement de ton profil...</p>
    </div>

    <div v-else-if="fetchError" class="card p-6 mb-6 text-center">
      <p class="text-red-400">⚠ {{ fetchError }}</p>
      <button
        type="button"
        class="mt-3 px-4 py-1.5 border surface-border rounded-md surface-card-hover text-sm"
        @click="refresh"
      >
        Réessayer
      </button>
    </div>

    <template v-else-if="trainer">
      <!-- Identity preview (read-only) -->
      <section class="card p-6 mb-6 text-center">
        <div class="flex justify-center mb-3">
          <div
            class="rounded-full p-1.5"
            :style="{ boxShadow: `0 0 0 2px ${accent}, 0 4px 18px ${accent}33` }"
          >
            <PokemonSprite
              v-if="trainer.stats.active.lineage"
              :lineage="trainer.stats.active.lineage"
              :level="trainer.stats.active.current_level"
              :is-shiny="trainer.stats.active.is_shiny"
              size="lg"
              animated
            />
          </div>
        </div>
        <p class="text-secondary">
          {{ trainer.stats.active.lineage ? LINEAGE_LABELS[trainer.stats.active.lineage] : '—' }}
          · Lv.{{ trainer.stats.active.current_level }}
          <span v-if="trainer.stats.active.is_shiny" class="text-accent" title="Shiny">✦</span>
        </p>
      </section>

      <!-- Editable form -->
      <section class="card p-6 mb-6 space-y-5">
        <h2 class="text-sm uppercase tracking-wider text-muted">Informations publiques</h2>

        <!-- Display name -->
        <div>
          <label for="display-name" class="block text-xs text-secondary mb-1">
            Display name <span class="text-muted">(2-24 chars, alphanum + _ - )</span>
          </label>
          <input
            id="display-name"
            v-model="formDisplayName"
            type="text"
            maxlength="24"
            placeholder="(laisse vide pour rester anonyme)"
            class="w-full px-3 py-2 rounded-md border surface-border surface-card text-primary"
          />
        </div>

        <!-- Quote -->
        <div>
          <label for="quote" class="block text-xs text-secondary mb-1">
            Citation
            <span class="text-muted">({{ quoteCharCount }}/80, single-line)</span>
          </label>
          <input
            id="quote"
            v-model="formQuote"
            type="text"
            maxlength="80"
            placeholder="Catch 'em all!"
            class="w-full px-3 py-2 rounded-md border surface-border surface-card text-primary"
            :class="quoteCharCount > 80 ? 'border-red-500' : ''"
          />
        </div>

        <!-- Bio -->
        <div>
          <label for="bio" class="block text-xs text-secondary mb-1">
            Bio
            <span class="text-muted"> ({{ bioCharCount }}/160, {{ bioLineCount }}/4 lignes) </span>
          </label>
          <textarea
            id="bio"
            v-model="formBio"
            rows="4"
            maxlength="160"
            placeholder="Dresseur de Pallet Town. Spécialiste feu depuis 2026."
            class="w-full px-3 py-2 rounded-md border surface-border surface-card text-primary font-mono text-sm"
            :class="bioCharCount > 160 || bioLineCount > 4 ? 'border-red-500' : ''"
          />
        </div>

        <!-- Pinned badges -->
        <div>
          <label class="block text-xs text-secondary mb-2">
            Badges épinglés
            <span class="text-muted"> ({{ formPinned.length }}/{{ pinnedLimit }} max) </span>
          </label>
          <div v-if="ownedBadges.length === 0" class="text-xs text-muted italic">
            Tu n'as pas encore débloqué de badge. Joue pour en gagner !
          </div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <button
              v-for="id in ownedBadges"
              :key="id"
              type="button"
              class="flex flex-col items-center p-2 rounded-md border surface-border transition text-xs"
              :class="
                formPinned.includes(id)
                  ? 'surface-card-hover ring-2 ring-accent'
                  : 'surface-card hover:surface-card-hover opacity-70'
              "
              :title="`${badgeMeta(id).label} — ${badgeMeta(id).description}`"
              :disabled="!formPinned.includes(id) && formPinned.length >= pinnedLimit"
              @click="togglePin(id)"
            >
              <span class="text-2xl mb-0.5">{{ badgeMeta(id).emoji }}</span>
              <span class="text-[10px] text-secondary leading-tight text-center">
                {{ badgeMeta(id).label }}
              </span>
            </button>
          </div>
          <p v-if="tooManyPinned" class="text-xs text-red-400 mt-1">
            Trop de badges épinglés (max {{ pinnedLimit }}).
          </p>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            class="px-5 py-2 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition disabled:opacity-50"
            :disabled="saving || tooManyPinned"
            @click="save"
          >
            {{ saving ? 'Sauvegarde...' : 'Enregistrer' }}
          </button>
          <NuxtLink
            v-if="session"
            :to="`/trainer/${session.anon_id}`"
            class="text-sm text-secondary hover:text-primary underline transition"
          >
            Voir ma trainer card publique
          </NuxtLink>
        </div>

        <p v-if="saveMessage" class="text-sm text-emerald-400">{{ saveMessage }}</p>
        <p v-if="saveError" class="text-sm text-red-400">⚠ {{ saveError }}</p>
      </section>

      <!-- Sprint 4.3 — Pair my CLI : the inverse of /pair. Generates a
           6-char code that the user types into `/pokemon arena link <code>`
           on their CLI to import this trainer's identity locally. -->
      <section class="card p-6 mb-6">
        <h2 class="text-sm uppercase tracking-wider text-muted mb-2">🔗 Lier mon CLI</h2>
        <p class="text-xs text-muted mb-4">
          Tu utilises aussi <code>claude-pokemon</code> en local ? Génère un code à 6 caractères
          puis lance <code class="text-secondary">/pokemon arena link &lt;code&gt;</code> sur ton
          CLI pour importer ce compte. Ton state.json local sera réécrit à partir du compte web.
        </p>
        <div v-if="!pairCode" class="text-center">
          <button
            type="button"
            class="px-5 py-2 bg-accent text-zinc-900 rounded-md font-bold hover:opacity-90 transition disabled:opacity-50"
            :disabled="pairIssuing"
            @click="issuePairCode"
          >
            {{ pairIssuing ? 'Génération...' : 'Générer un code de pairing' }}
          </button>
        </div>
        <div v-else class="text-center space-y-2">
          <p class="text-xs text-muted">Code à 6 caractères (expire dans 5 min) :</p>
          <div
            class="inline-block px-6 py-3 rounded-lg surface-card-hover border-2 border-accent text-3xl font-mono font-bold tracking-[0.4em] text-accent select-all"
          >
            {{ pairCode }}
          </div>
          <p class="text-xs text-secondary">
            Sur ton CLI : <code>/pokemon arena link {{ pairCode }}</code>
          </p>
          <p v-if="pairExpiresAt" class="text-[10px] text-muted">
            Expire à
            {{ new Date(pairExpiresAt).toLocaleTimeString() }}
          </p>
          <button
            type="button"
            class="text-xs text-secondary underline hover:text-primary transition"
            @click="
              () => {
                pairCode = null
                pairExpiresAt = null
              }
            "
          >
            Générer un nouveau code
          </button>
        </div>
        <p v-if="pairError" class="text-sm text-red-400 mt-3 text-center">⚠ {{ pairError }}</p>
      </section>

      <!-- Danger zone -->
      <section class="surface-card border border-red-500/30 rounded-lg p-6 text-center">
        <h2 class="text-sm uppercase tracking-wider text-red-400 mb-2">Zone sensible</h2>
        <p class="text-xs text-muted mb-4">
          Déconnecter ce navigateur retire ton arena_secret du localStorage. Tu pourras te re-pair
          quand tu veux via <code class="text-secondary">/pokemon arena pair</code>
          sur ton CLI.
        </p>
        <button
          type="button"
          class="px-4 py-2 border border-red-500/50 text-red-400 rounded-md hover:bg-red-500/10 transition text-sm"
          @click="unpair"
        >
          🚪 Déconnecter ce navigateur
        </button>
      </section>
    </template>
  </main>
</template>
