<script setup lang="ts">
// Live PvP battle page. Polls /v1/arena/live/<id> every 2s and renders HP,
// turn log, and a final banner. When this browser is paired with a CLI
// install (Sprint 2.12) AND the paired anon_id matches one of the two
// participants, it also exposes a move picker so the user can commit
// directly from the page — no more CLI round-trips.

import { useLiveBattle } from '~/composables/useLiveBattle'
import { useArenaSession } from '~/composables/useArenaSession'
import { LINEAGE_LABELS, lineageGradient } from '~/utils/lineage'
import { stageFor } from '~/utils/sprites'
import { movesForStage, type Move } from '~/data/moves'
import { LINEAGE_TO_TYPE, type CombatType } from '~/utils/battle-engine'
import type { BattleSide, BattleTurn } from '~/types/api'

const route = useRoute()
const battleId = computed(() => route.params.id as string)
const api = useApi()

const { data, error, lastFetchAt } = useLiveBattle(battleId.value)
const { session, isPaired } = useArenaSession()

const live = computed(() => data.value)

// Identify which side (if any) the paired browser represents.
const mySide = computed<BattleSide | null>(() => {
  if (!isPaired.value || !live.value || !session.value) return null
  if (session.value.anon_id === live.value.challenger.anon_id) return 'challenger'
  if (session.value.anon_id === live.value.defender.anon_id) return 'defender'
  return null
})

const myAvailableMoves = computed<Move[]>(() => {
  if (!live.value || !mySide.value) return []
  const snap =
    mySide.value === 'challenger' ? live.value.challenger.snapshot : live.value.defender.snapshot
  if (!snap) return []
  return movesForStage(stageFor(snap.lineage, snap.level).showdown_id)
})

const opponentType = computed<CombatType>(() => {
  if (!live.value || !mySide.value) return 'normal'
  const opp =
    mySide.value === 'challenger' ? live.value.defender.snapshot : live.value.challenger.snapshot
  if (!opp) return 'normal'
  return LINEAGE_TO_TYPE[opp.lineage] ?? 'normal'
})

const myHasPendingAction = computed(() => {
  if (!live.value || !mySide.value) return false
  return mySide.value === 'challenger'
    ? live.value.challenger.has_pending_action
    : live.value.defender.has_pending_action
})

const canCommit = computed(
  () =>
    isPaired.value &&
    mySide.value !== null &&
    live.value?.state === 'active' &&
    !myHasPendingAction.value,
)

const commitInFlight = ref(false)
const commitError = ref<string | null>(null)

async function commitMove(move: Move) {
  if (!session.value || !mySide.value || commitInFlight.value) return
  commitInFlight.value = true
  commitError.value = null
  try {
    await api.arenaLiveCommit({
      battleId: battleId.value,
      anonId: session.value.anon_id,
      moveId: move.name,
      arenaSecret: session.value.arena_secret,
    })
    // The polling composable will pick up the new state on its next tick ;
    // no need to manually refetch.
  } catch (e) {
    commitError.value = e instanceof Error ? e.message : 'commit failed'
  } finally {
    commitInFlight.value = false
  }
}

const stateLabel = computed(() => {
  if (!live.value) return '…'
  switch (live.value.state) {
    case 'pending':
      return '⏳ En attente d’acceptation'
    case 'active':
      return '⚔️ Combat en cours'
    case 'finished':
      return '🏁 Combat terminé'
    case 'abandoned':
      return '🏳️ Abandon'
    case 'expired':
      return '💤 Expiré (inactivité)'
    default:
      return live.value.state
  }
})

const winner = computed<BattleSide | 'draw' | null>(() => live.value?.winner ?? null)

const recentTurns = computed<BattleTurn[]>(() => {
  if (!live.value) return []
  return live.value.turn_log.slice(-6)
})

const challengerMaxHp = computed(() => {
  const lvl = live.value?.challenger.snapshot?.level ?? 0
  return 50 + lvl * 2
})

const defenderMaxHp = computed(() => {
  const lvl = live.value?.defender.snapshot?.level ?? 0
  return 50 + lvl * 2
})

const backdropGradient = computed(() => {
  if (!live.value || !winner.value || winner.value === 'draw') {
    return lineageGradient(live.value?.challenger.snapshot?.lineage ?? null)
  }
  const tintLineage =
    winner.value === 'defender'
      ? live.value.defender.snapshot?.lineage
      : live.value.challenger.snapshot?.lineage
  return lineageGradient(tintLineage)
})

const fmtSide = (anonId: string) => `${anonId.slice(0, 8)}`

useHead({
  title: () => `Live ${battleId.value.slice(0, 8)} · claude-pokemon arena`,
  meta: [
    {
      name: 'description',
      content: 'Spectate a live PvP battle in claude-pokemon — turn-by-turn polling.',
    },
  ],
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-6 py-12 relative" :style="{ background: backdropGradient }">
    <div class="mb-6">
      <NuxtLink to="/arena" class="text-secondary hover:text-primary text-sm transition">
        ← Arena pool
      </NuxtLink>
    </div>

    <header class="text-center mb-8">
      <div class="text-xs uppercase tracking-widest text-secondary mb-1">Live battle</div>
      <h1 class="text-3xl font-bold text-primary">⚔️ Spectateur</h1>
      <p class="text-muted text-sm mt-2">
        battle <code class="text-secondary">{{ battleId.slice(0, 16) }}…</code>
      </p>
    </header>

    <div v-if="error" class="surface-card border surface-border rounded-lg p-4 mb-6 text-center">
      <p class="text-red-400">⚠ {{ error }}</p>
      <p v-if="lastFetchAt" class="text-xs text-muted mt-1">
        Dernier rafraîchissement : {{ Math.round((Date.now() - lastFetchAt) / 1000) }}s
      </p>
    </div>

    <div v-if="!live" class="surface-card border surface-border rounded-lg p-12 text-center">
      <div class="text-3xl mb-2" aria-hidden="true">⏳</div>
      <p class="text-secondary">Connexion au combat…</p>
    </div>

    <template v-else>
      <div class="surface-card border surface-border rounded-lg p-4 mb-6 text-center">
        <p class="text-lg font-semibold text-primary">{{ stateLabel }}</p>
        <p class="text-xs text-muted mt-1">
          tour {{ live.turn_no }} · dernière activité
          {{ new Date(live.last_activity_at).toLocaleTimeString() }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="surface-card border surface-border rounded-lg p-4">
          <div class="flex items-center gap-3 mb-3">
            <PokemonSprite
              v-if="live.challenger.snapshot"
              :lineage="live.challenger.snapshot.lineage"
              :level="live.challenger.snapshot.level"
              :is-shiny="live.challenger.snapshot.is_shiny"
              size="md"
              animated
            />
            <div>
              <div class="text-xs uppercase tracking-widest text-muted">Challenger</div>
              <div class="font-semibold text-primary">{{ fmtSide(live.challenger.anon_id) }}</div>
              <div v-if="live.challenger.snapshot" class="text-xs text-secondary">
                {{ LINEAGE_LABELS[live.challenger.snapshot.lineage] }} · Lv.{{
                  live.challenger.snapshot.level
                }}
              </div>
            </div>
          </div>
          <HpBar
            v-if="live.challenger.hp !== null"
            :hp="live.challenger.hp"
            :max-hp="challengerMaxHp"
            label="HP"
          />
          <p class="text-xs text-secondary mt-2 text-center">
            {{ live.challenger.has_pending_action ? '✓ commit verrouillé' : '… choisit son coup' }}
          </p>
        </div>

        <div class="surface-card border surface-border rounded-lg p-4">
          <div class="flex items-center gap-3 mb-3">
            <PokemonSprite
              v-if="live.defender.snapshot"
              :lineage="live.defender.snapshot.lineage"
              :level="live.defender.snapshot.level"
              :is-shiny="live.defender.snapshot.is_shiny"
              size="md"
              animated
            />
            <div v-else class="text-3xl">❓</div>
            <div>
              <div class="text-xs uppercase tracking-widest text-muted">Defender</div>
              <div class="font-semibold text-primary">{{ fmtSide(live.defender.anon_id) }}</div>
              <div v-if="live.defender.snapshot" class="text-xs text-secondary">
                {{ LINEAGE_LABELS[live.defender.snapshot.lineage] }} · Lv.{{
                  live.defender.snapshot.level
                }}
              </div>
              <div v-else class="text-xs text-muted">en attente d'acceptation…</div>
            </div>
          </div>
          <HpBar
            v-if="live.defender.hp !== null"
            :hp="live.defender.hp"
            :max-hp="defenderMaxHp"
            label="HP"
          />
          <p v-if="live.defender.snapshot" class="text-xs text-secondary mt-2 text-center">
            {{ live.defender.has_pending_action ? '✓ commit verrouillé' : '… choisit son coup' }}
          </p>
        </div>
      </div>

      <!-- Sprint 2.12 — move picker shown when this browser is paired to one
           of the participants and the battle is awaiting their commit. -->
      <div
        v-if="canCommit && myAvailableMoves.length"
        class="surface-card border surface-border rounded-lg p-4 mb-6"
      >
        <h2 class="text-sm uppercase tracking-wider text-muted mb-3 text-center">
          🎯 Choisis ton attaque
          <span class="text-accent"
            >({{ mySide === 'challenger' ? 'challenger' : 'defender' }})</span
          >
        </h2>
        <AttackPicker
          :moves="myAvailableMoves"
          :defender-type="opponentType"
          :disabled="commitInFlight"
          @pick="i => commitMove(myAvailableMoves[i]!)"
        />
        <p v-if="commitError" class="text-xs text-red-400 mt-2 text-center">⚠ {{ commitError }}</p>
      </div>

      <div
        v-else-if="myHasPendingAction && live.state === 'active'"
        class="surface-card border surface-border rounded-lg p-3 mb-6 text-center text-sm text-secondary"
      >
        ✓ Coup verrouillé — en attente de l'adversaire.
      </div>

      <div
        v-else-if="!isPaired && live.state === 'active'"
        class="surface-card border surface-border rounded-lg p-3 mb-6 text-center text-xs text-muted"
      >
        🔗 Pour jouer depuis le navigateur :
        <NuxtLink to="/pair" class="text-accent underline">appairer ce navigateur</NuxtLink>
        avec ton install CLI.
      </div>

      <div v-if="recentTurns.length" class="surface-card border surface-border rounded-lg p-4 mb-6">
        <h2 class="text-sm uppercase tracking-wider text-muted mb-2">Derniers échanges</h2>
        <ul class="space-y-1 text-sm">
          <li v-for="t in recentTurns" :key="t.turn" class="flex justify-between">
            <span class="text-secondary">
              tour {{ t.turn }} · {{ t.actor === 'challenger' ? 'C' : 'D' }}
              <span v-if="t.critical" class="text-red-400 font-bold">CRIT!</span>
              <span v-else-if="t.effectiveness >= 2" class="text-emerald-400">super</span>
              <span v-else-if="t.effectiveness <= 0.5" class="text-amber-400">peu efficace</span>
            </span>
            <span class="tabular-nums text-primary">−{{ t.damage }}</span>
          </li>
        </ul>
      </div>

      <div
        v-if="live.state === 'finished' || live.state === 'abandoned'"
        class="surface-card border surface-border rounded-lg p-6 text-center"
      >
        <div class="text-4xl mb-2" aria-hidden="true">
          {{ winner === 'draw' ? '🤝' : '🏆' }}
        </div>
        <p class="text-lg font-semibold text-primary">
          {{
            winner === 'draw'
              ? 'Match nul'
              : winner === 'challenger'
                ? `Victoire de ${fmtSide(live.challenger.anon_id)}`
                : winner === 'defender'
                  ? `Victoire de ${fmtSide(live.defender.anon_id)}`
                  : 'Combat clos'
          }}
        </p>
        <p v-if="live.reason" class="text-xs text-muted mt-1">raison : {{ live.reason }}</p>
        <p v-if="live.forfeit_by" class="text-xs text-muted">abandon par {{ live.forfeit_by }}</p>
      </div>

      <footer class="text-center text-muted text-sm mt-12 pt-8 border-t surface-border">
        <p v-if="isPaired">
          🔗 Browser appairé.
          <NuxtLink to="/pair" class="text-accent underline">Gérer le pairing.</NuxtLink>
        </p>
        <p v-else>
          Tu peux aussi jouer depuis le CLI :
          <code class="text-secondary">/pokemon arena live move</code>.
        </p>
      </footer>
    </template>
  </main>
</template>
