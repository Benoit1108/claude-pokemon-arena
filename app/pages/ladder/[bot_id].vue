<script setup lang="ts">
import { findBot, isFinalBoss } from '~/data/bot-trainers'
import { useBattlePlayer } from '~/composables/useBattlePlayer'
import { useSoundEffects } from '~/composables/useSoundEffects'
import { useLadderProgress } from '~/composables/useLadderProgress'
import { useManualBattle } from '~/composables/useManualBattle'
import { useBattleJuice } from '~/composables/useBattleJuice'
import { resolveBattle, hashSeed, LINEAGE_TO_TYPE } from '~/utils/battle-engine'
import { lineageGradient } from '~/utils/lineage'
import type { BattleParticipant, BattleSide } from '~/types/api'

definePageMeta({ ssr: false })

const route = useRoute()
const ladder = useLadderProgress()
const sfx = useSoundEffects()

const botId = route.params.bot_id as string
const bot = findBot(botId)

if (!bot) {
  throw createError({ statusCode: 404, statusMessage: 'Bot not found' })
}

// Mode toggle via query : ?mode=manual for interactive play, default = auto.
const mode = computed<'auto' | 'manual'>(() =>
  (route.query.mode as string) === 'manual' ? 'manual' : 'auto',
)

const playerSnapshot: BattleParticipant = {
  anon_id: '00000000',
  display_name: 'Vous',
  lineage: 'fire',
  level: Math.max(1, bot.level - 3),
  is_shiny: false,
}

const opponentSnapshot: BattleParticipant = {
  anon_id: bot.id
    .replace(/[^a-f0-9]/gi, '')
    .padEnd(8, '0')
    .slice(0, 8),
  display_name: `${bot.title} ${bot.name}`,
  lineage: bot.lineage,
  level: bot.level,
  is_shiny: bot.is_shiny,
}

// ── AUTO MODE ─────────────────────────────────────────────────────────────
const seed = hashSeed(`${bot.id}|${Date.now()}|${Math.random()}`)
const autoBattle = resolveBattle({
  challenger: playerSnapshot,
  defender: opponentSnapshot,
  seed,
  createdAt: new Date().toISOString(),
})

const autoPlayer = useBattlePlayer(autoBattle.turns, { autoPlay: true, speed: 1 })

watch(autoPlayer.lastTurn, t => {
  if (mode.value !== 'auto' || !t) return
  if (t.critical) sfx.playCritical()
  else if (t.effectiveness >= 2) sfx.playSuperEffective()
  else sfx.playHit()
})

let autoRecorded = false
watch(autoPlayer.isFinished, finished => {
  if (mode.value !== 'auto' || !finished || autoRecorded) return
  autoRecorded = true
  if (autoBattle.winner === 'challenger') {
    sfx.playWin()
    ladder.recordVictory(bot.id, autoBattle.turns.length, autoBattle.seed)
  } else if (autoBattle.winner === 'defender') {
    sfx.playDefeat()
  } else {
    sfx.playDraw()
  }
})

// ── MANUAL MODE ───────────────────────────────────────────────────────────
const manual = useManualBattle({
  challenger: playerSnapshot,
  defender: opponentSnapshot,
  seed,
  humanSide: 'challenger',
  difficulty: bot.level >= 36 ? 'hard' : bot.level >= 16 ? 'normal' : 'easy',
})

let manualRecorded = false
watch(
  () => manual.state.value.finished,
  finished => {
    if (mode.value !== 'manual' || !finished || manualRecorded) return
    manualRecorded = true
    if (manual.state.value.winner === 'challenger') {
      ladder.recordVictory(bot.id, manual.state.value.turns.length, manual.state.value.seed)
    }
  },
)

// Defender combat type for super-effective hint in AttackPicker.
const opponentCombatType = LINEAGE_TO_TYPE[opponentSnapshot.lineage]

// ── JUICE PACK — wired to whichever mode is active ────────────────────────
const autoWinner = computed<BattleSide | 'draw' | null>(() =>
  autoPlayer.isFinished.value ? autoBattle.winner : null,
)
const autoJuice = useBattleJuice({
  lastTurn: autoPlayer.lastTurn,
  isFinished: autoPlayer.isFinished,
  winner: autoWinner,
  cheerSide: 'challenger',
})

const manualWinner = computed<BattleSide | 'draw' | null>(() =>
  manual.state.value.finished ? manual.state.value.winner : null,
)
const manualFinished = computed(() => manual.state.value.finished)
const manualJuice = useBattleJuice({
  lastTurn: manual.lastTurn,
  isFinished: manualFinished,
  winner: manualWinner,
  cheerSide: 'challenger',
})

const tileGradient = lineageGradient(bot.lineage)

useHead({
  title: `vs ${bot.title} ${bot.name} · Trail`,
})
</script>

<template>
  <main
    class="max-w-4xl mx-auto px-6 py-12 relative"
    :class="{
      'crit-shake': mode === 'auto' ? autoJuice.shakeKey.value : manualJuice.shakeKey.value,
    }"
    :key="`shake-${mode === 'auto' ? autoJuice.shakeKey.value : manualJuice.shakeKey.value}`"
    :style="{ background: tileGradient }"
  >
    <div class="mb-6">
      <NuxtLink to="/ladder" class="text-secondary hover:text-primary text-sm transition">
        ← Trail
      </NuxtLink>
    </div>

    <header class="text-center mb-6">
      <div class="text-xs uppercase tracking-widest text-secondary mb-1">Trail challenge</div>
      <h1 class="text-3xl font-bold text-primary">
        {{ bot.title }} {{ bot.name }}
        <span v-if="bot.is_shiny" class="text-accent">★</span>
      </h1>
      <p class="text-muted text-sm italic mt-2">"{{ bot.quote }}"</p>
      <p
        v-if="isFinalBoss(bot.id) && !ladder.isBeaten(bot.id)"
        class="text-xs uppercase tracking-widest text-accent font-bold mt-3"
      >
        ⚠ Champion fight — beat to earn Trail Conqueror
      </p>
    </header>

    <!-- Mode toggle -->
    <div class="flex justify-center gap-2 mb-6">
      <NuxtLink
        :to="{ query: { mode: 'auto' } }"
        replace
        class="px-4 py-2 text-sm border surface-border rounded-md transition"
        :class="
          mode === 'auto'
            ? 'bg-accent text-zinc-900 font-bold border-accent'
            : 'surface-card-hover text-secondary'
        "
      >
        🎬 Auto
      </NuxtLink>
      <NuxtLink
        :to="{ query: { mode: 'manual' } }"
        replace
        class="px-4 py-2 text-sm border surface-border rounded-md transition"
        :class="
          mode === 'manual'
            ? 'bg-accent text-zinc-900 font-bold border-accent'
            : 'surface-card-hover text-secondary'
        "
      >
        ⚔️ Manual
      </NuxtLink>
    </div>

    <!-- ── AUTO MODE ───────────────────────────────────────────────── -->
    <template v-if="mode === 'auto'">
      <BattleStage
        :challenger="autoBattle.challenger"
        :defender="autoBattle.defender"
        :winner="autoBattle.winner"
        :current-turn="autoPlayer.lastTurn.value"
        :show-final-state="autoPlayer.isFinished.value"
        :floating-damages="autoJuice.floatingDamages.value"
      />

      <BattleControls
        :is-playing="autoPlayer.isPlaying.value"
        :is-finished="autoPlayer.isFinished.value"
        :speed="autoPlayer.speed.value"
        :progress="autoPlayer.progress.value"
        :current-turn-idx="autoPlayer.currentTurnIdx.value"
        :total-turns="autoPlayer.totalTurns"
        :sound-enabled="sfx.enabled.value"
        @toggle="autoPlayer.toggle()"
        @skip-to-end="autoPlayer.skipToEnd()"
        @restart="autoPlayer.restart()"
        @set-speed="s => autoPlayer.setSpeed(s)"
        @toggle-sound="sfx.toggle()"
      />

      <BattleResultBanner
        v-if="autoPlayer.isFinished.value"
        :winner="autoBattle.winner"
        :reason="autoBattle.reason"
        :challenger="autoBattle.challenger"
        :defender="autoBattle.defender"
        :total-turns="autoBattle.turns.length"
      />

      <div
        v-if="autoPlayer.isFinished.value && autoBattle.winner === 'challenger'"
        class="surface-card border-2 border-accent rounded-lg p-6 mb-6 text-center"
      >
        <div class="text-3xl mb-2">🎉</div>
        <p class="font-bold text-primary mb-1">Victory!</p>
        <p class="text-secondary text-sm">{{ bot.reward }}</p>
        <NuxtLink
          to="/ladder"
          class="inline-block mt-4 px-5 py-2.5 bg-accent text-zinc-900 font-bold rounded-md hover:opacity-90 transition"
        >
          ← Back to trail
        </NuxtLink>
      </div>

      <BattleLog
        :turns="autoPlayer.visibleTurns.value"
        :challenger="autoBattle.challenger"
        :defender="autoBattle.defender"
      />
    </template>

    <!-- ── MANUAL MODE ─────────────────────────────────────────────── -->
    <template v-else>
      <BattleStage
        :challenger="manual.result.value.challenger"
        :defender="manual.result.value.defender"
        :challenger-hp="manual.challengerHp.value"
        :challenger-max-hp="manual.challengerMaxHp.value"
        :defender-hp="manual.defenderHp.value"
        :defender-max-hp="manual.defenderMaxHp.value"
        :winner="manual.result.value.winner"
        :current-turn="manual.lastTurn.value"
        :show-final-state="manual.state.value.finished"
        :floating-damages="manualJuice.floatingDamages.value"
        :show-intro="false"
      />

      <!-- Live HP bars -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <HpBar
          :hp="manual.challengerHp.value"
          :max-hp="manual.challengerMaxHp.value"
          label="Vous"
        />
        <HpBar
          :hp="manual.defenderHp.value"
          :max-hp="manual.defenderMaxHp.value"
          :label="`${bot.title} ${bot.name}`"
        />
      </div>

      <!-- AttackPicker (only on player's turn) -->
      <AttackPicker
        v-if="manual.isHumanTurn.value"
        :moves="manual.movesAvailable.value"
        :defender-type="opponentCombatType"
        @pick="i => manual.pickAction(i)"
      />
      <div
        v-else-if="!manual.state.value.finished"
        class="surface-card border surface-border rounded-lg p-4 mb-4 text-center text-secondary"
      >
        <span class="inline-block animate-pulse">⏳ {{ bot.name }} réfléchit...</span>
      </div>

      <BattleResultBanner
        v-if="manual.state.value.finished"
        :winner="manual.result.value.winner"
        :reason="manual.result.value.reason"
        :challenger="manual.result.value.challenger"
        :defender="manual.result.value.defender"
        :total-turns="manual.state.value.turns.length"
      />

      <div
        v-if="manual.state.value.finished && manual.state.value.winner === 'challenger'"
        class="surface-card border-2 border-accent rounded-lg p-6 mb-6 text-center"
      >
        <div class="text-3xl mb-2">🎉</div>
        <p class="font-bold text-primary mb-1">Victory!</p>
        <p class="text-secondary text-sm">{{ bot.reward }}</p>
        <div class="flex gap-3 justify-center mt-4">
          <button
            type="button"
            class="px-5 py-2.5 border surface-border rounded-md surface-card-hover transition text-primary"
            @click="manual.reset()"
          >
            ↻ Rejouer
          </button>
          <NuxtLink
            to="/ladder"
            class="px-5 py-2.5 bg-accent text-zinc-900 font-bold rounded-md hover:opacity-90 transition"
          >
            ← Back to trail
          </NuxtLink>
        </div>
      </div>

      <div
        v-else-if="manual.state.value.finished"
        class="surface-card border surface-border rounded-lg p-6 mb-6 text-center"
      >
        <p class="text-secondary text-sm mb-3">{{ bot.name }} t'a vaincu·e cette fois.</p>
        <button
          type="button"
          class="px-5 py-2.5 bg-accent text-zinc-900 font-bold rounded-md hover:opacity-90 transition"
          @click="manual.reset()"
        >
          ↻ Réessayer
        </button>
      </div>

      <BattleLog
        :turns="manual.state.value.turns"
        :challenger="manual.result.value.challenger"
        :defender="manual.result.value.defender"
      />
    </template>
  </main>
</template>
