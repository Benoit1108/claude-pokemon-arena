<script setup lang="ts">
import { findBot, isFinalBoss } from '~/data/bot-trainers'
import { useBattlePlayer } from '~/composables/useBattlePlayer'
import { useSoundEffects } from '~/composables/useSoundEffects'
import { useLadderProgress } from '~/composables/useLadderProgress'
import { resolveBattle, hashSeed } from '~/utils/battle-engine'
import { lineageGradient } from '~/utils/lineage'
import type { BattleParticipant } from '~/types/api'

// Solo ladder is offline-first : no Worker fetches, no SSR. Everything
// (player snapshot, battle resolution, progress tracking) lives in the
// browser. Future sprint will wire the player snapshot to their real
// CLI stats via anon_id sync.
definePageMeta({ ssr: false })

const route = useRoute()
const ladder = useLadderProgress()
const sfx = useSoundEffects()

const botId = route.params.bot_id as string
const bot = findBot(botId)

if (!bot) {
  throw createError({ statusCode: 404, statusMessage: 'Bot not found' })
}

// MVP : a generic Charmander level-matched to the bot. Slight handicap
// (-3 levels) so the fight is winnable but not trivial. Future sprint will
// pull from the CLI's actual active state.
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

// Seed = stable per (bot, run) so each fresh visit gets a new fight, but
// any single playthrough is deterministic from start to finish.
const seed = hashSeed(`${bot.id}|${Date.now()}|${Math.random()}`)
const battle = resolveBattle({
  challenger: playerSnapshot,
  defender: opponentSnapshot,
  seed,
  createdAt: new Date().toISOString(),
})

const player = useBattlePlayer(battle.turns, { autoPlay: true, speed: 1 })

// Wire SFX to player events.
watch(player.lastTurn, t => {
  if (!t) return
  if (t.critical) sfx.playCritical()
  else if (t.effectiveness >= 2) sfx.playSuperEffective()
  else sfx.playHit()
})

let recorded = false
watch(player.isFinished, finished => {
  if (!finished || recorded) return
  recorded = true
  if (battle.winner === 'challenger') {
    sfx.playWin()
    ladder.recordVictory(bot.id, battle.turns.length, battle.seed)
  } else if (battle.winner === 'defender') {
    sfx.playDefeat()
  } else {
    sfx.playDraw()
  }
})

const tileGradient = lineageGradient(bot.lineage)

useHead({
  title: `vs ${bot.title} ${bot.name} · Trail`,
})
</script>

<template>
  <main class="max-w-4xl mx-auto px-6 py-12 relative" :style="{ background: tileGradient }">
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

    <BattleScene
      :challenger="battle.challenger"
      :defender="battle.defender"
      :winner="battle.winner"
      :current-turn="player.lastTurn.value"
      :show-final-state="player.isFinished.value"
    />

    <BattleControls
      :is-playing="player.isPlaying.value"
      :is-finished="player.isFinished.value"
      :speed="player.speed.value"
      :progress="player.progress.value"
      :current-turn-idx="player.currentTurnIdx.value"
      :total-turns="player.totalTurns"
      :sound-enabled="sfx.enabled.value"
      @toggle="player.toggle()"
      @skip-to-end="player.skipToEnd()"
      @restart="player.restart()"
      @set-speed="s => player.setSpeed(s)"
      @toggle-sound="sfx.toggle()"
    />

    <BattleResultBanner
      v-if="player.isFinished.value"
      :winner="battle.winner"
      :reason="battle.reason"
      :challenger="battle.challenger"
      :defender="battle.defender"
      :total-turns="battle.turns.length"
    />

    <div
      v-if="player.isFinished.value && battle.winner === 'challenger'"
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
      :turns="player.visibleTurns.value"
      :challenger="battle.challenger"
      :defender="battle.defender"
    />
  </main>
</template>
