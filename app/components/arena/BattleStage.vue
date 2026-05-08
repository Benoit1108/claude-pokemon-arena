<script setup lang="ts">
// Pokémon Black/White-inspired battle stage (Sprint 2.13 UA1) — replaces the
// flat 2-card BattleScene with a real arena scene :
//   - sky gradient backdrop tinted by the active winner's lineage
//   - two ground "platforms" : challenger bottom-left (back-view), defender
//     top-right (face-view)
//   - HP pills (BattleHpPill) above each combatant
//   - intro banner ("Un combat est lancé par X !") shown the first time we
//     mount with a non-empty challenger name, then auto-dismissed
//
// Wraps PokemonSprite (with the new `back` prop) so we don't reinvent the
// fallback / shiny / animated handling. Floating damages + critical-hit
// shake hooks are kept identical to the previous BattleScene API so callers
// upgrade by swapping the component name.

import { lineageGradient } from '~/utils/lineage'
import { stageNameFor } from '~/utils/sprites'
import type { BattleParticipant, BattleSide, BattleTurn } from '~/types/api'
import type { FloatingDamage } from '~/composables/useBattleJuice'

const props = defineProps<{
  challenger: BattleParticipant
  defender: BattleParticipant
  /** Current HP for each side. Optional — when omitted we treat both as
   * full-HP (replay mode where HP isn't tracked between turns). */
  challengerHp?: number
  challengerMaxHp?: number
  defenderHp?: number
  defenderMaxHp?: number
  winner: BattleSide | 'draw'
  currentTurn?: BattleTurn | null
  showFinalState?: boolean
  floatingDamages?: FloatingDamage[]
  /** When false, suppresses the BW intro banner (e.g. instant battle pages). */
  showIntro?: boolean
}>()

const challengerAttacking = computed(() => props.currentTurn?.actor === 'challenger')
const defenderAttacking = computed(() => props.currentTurn?.actor === 'defender')
const isCritical = computed(() => !!props.currentTurn?.critical)

const challengerName = computed(
  () => props.challenger.display_name || props.challenger.anon_id.slice(0, 8),
)
const defenderName = computed(
  () => props.defender.display_name || props.defender.anon_id.slice(0, 8),
)

const challengerStageName = computed(() =>
  stageNameFor(props.challenger.lineage, props.challenger.level),
)
const defenderStageName = computed(() => stageNameFor(props.defender.lineage, props.defender.level))

// Backdrop is a soft gradient using the winning side's lineage tint when the
// battle is finished, otherwise the challenger's lineage as a neutral base.
const backdropStyle = computed(() => {
  const tintLineage =
    props.showFinalState && props.winner !== 'draw'
      ? props.winner === 'defender'
        ? props.defender.lineage
        : props.challenger.lineage
      : props.challenger.lineage
  return {
    backgroundImage: lineageGradient(tintLineage),
  }
})

const challengerWinner = computed(() => props.showFinalState && props.winner === 'challenger')
const defenderWinner = computed(() => props.showFinalState && props.winner === 'defender')
const challengerLoser = computed(() => props.showFinalState && props.winner === 'defender')
const defenderLoser = computed(() => props.showFinalState && props.winner === 'challenger')

const challengerFloats = computed(
  () => props.floatingDamages?.filter(f => f.side === 'challenger') ?? [],
)
const defenderFloats = computed(
  () => props.floatingDamages?.filter(f => f.side === 'defender') ?? [],
)

// HP pill resolves max from props or derives the canonical maxHp (50 + 2×lvl).
function maxHpFor(level: number, override?: number): number {
  return override ?? 50 + level * 2
}
const cMax = computed(() => maxHpFor(props.challenger.level, props.challengerMaxHp))
const dMax = computed(() => maxHpFor(props.defender.level, props.defenderMaxHp))
// Default HP to max when the caller doesn't track it (replay mode).
const cHp = computed(() => props.challengerHp ?? cMax.value)
const dHp = computed(() => props.defenderHp ?? dMax.value)

const showIntroBanner = ref(props.showIntro !== false)
function dismissIntro() {
  showIntroBanner.value = false
}
</script>

<template>
  <div
    class="relative isolate w-full rounded-xl border surface-border overflow-hidden mb-6 stage-shadow"
    :style="backdropStyle"
    :class="{ 'crit-flash': isCritical }"
  >
    <!-- Sky / horizon backdrop layer (subtle decorative gradient). -->
    <div class="absolute inset-0 stage-sky pointer-events-none" aria-hidden="true" />

    <!-- Stage container. Aspect kept tight on mobile, wider on md+. -->
    <div class="relative h-[22rem] md:h-[26rem] grid grid-cols-2 grid-rows-2">
      <!-- Defender (top right, face-view). -->
      <div class="col-start-2 row-start-1 relative flex items-end justify-center pb-1">
        <div class="absolute -top-1 right-3">
          <BattleHpPill
            :name="defenderStageName"
            :level="defender.level"
            :is-shiny="defender.is_shiny"
            :hp="dHp"
            :max-hp="dMax"
            side="defender"
          />
        </div>
        <div
          class="relative z-10"
          :class="[
            defenderAttacking ? 'sprite-bump-defender' : '',
            challengerAttacking ? 'sprite-recoil' : '',
            defenderWinner ? 'sprite-victory' : '',
            defenderLoser ? 'sprite-defeat' : '',
          ]"
        >
          <PokemonSprite
            :lineage="defender.lineage"
            :level="defender.level"
            :is-shiny="defender.is_shiny"
            size="xl"
            animated
          />
        </div>
        <div
          class="absolute inset-0 pointer-events-none flex items-start justify-center pt-6"
          aria-hidden="true"
        >
          <FloatingDamage
            v-for="f in defenderFloats"
            :key="f.id"
            :damage="f.damage"
            :effectiveness="f.effectiveness"
            :critical="f.critical"
          />
        </div>
        <!-- Defender platform (oval shadow). -->
        <div class="absolute bottom-0 right-6 w-40 h-6 platform-defender" aria-hidden="true" />
      </div>

      <!-- Challenger (bottom left, back-view). -->
      <div class="col-start-1 row-start-2 relative flex items-end justify-center pb-1">
        <div class="absolute -bottom-2 left-3 z-20">
          <BattleHpPill
            :name="challengerStageName"
            :level="challenger.level"
            :is-shiny="challenger.is_shiny"
            :hp="cHp"
            :max-hp="cMax"
            side="challenger"
          />
        </div>
        <div
          class="relative z-10"
          :class="[
            challengerAttacking ? 'sprite-bump-challenger' : '',
            defenderAttacking ? 'sprite-recoil' : '',
            challengerWinner ? 'sprite-victory' : '',
            challengerLoser ? 'sprite-defeat' : '',
          ]"
        >
          <PokemonSprite
            :lineage="challenger.lineage"
            :level="challenger.level"
            :is-shiny="challenger.is_shiny"
            size="2xl"
            animated
            back
          />
        </div>
        <div
          class="absolute inset-0 pointer-events-none flex items-start justify-center pt-10"
          aria-hidden="true"
        >
          <FloatingDamage
            v-for="f in challengerFloats"
            :key="f.id"
            :damage="f.damage"
            :effectiveness="f.effectiveness"
            :critical="f.critical"
          />
        </div>
        <div class="absolute bottom-0 left-6 w-52 h-7 platform-challenger" aria-hidden="true" />
      </div>
    </div>

    <BattleIntroBanner
      v-if="showIntroBanner"
      :challenger-name="challengerName"
      @done="dismissIntro"
    />

    <!-- Names ribbon (always shown ; the BW intro overlays this for ~2.4s). -->
    <div
      class="absolute top-2 left-2 right-2 flex justify-between text-xs uppercase tracking-widest text-muted pointer-events-none"
    >
      <span class="bg-black/40 backdrop-blur px-2 py-0.5 rounded">{{ defenderName }}</span>
      <span class="bg-black/40 backdrop-blur px-2 py-0.5 rounded">{{ challengerName }} (toi)</span>
    </div>

    <!-- Draw banner. Win/loss tinting handled by the sprite-victory/defeat
         CSS classes + the backdrop gradient ; an explicit DRAW callout helps. -->
    <div
      v-if="showFinalState && winner === 'draw'"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="px-4 py-2 rounded-md bg-black/70 text-white text-2xl font-bold tracking-widest">
        ⊘ DRAW
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-shadow {
  box-shadow: inset 0 0 60px -10px rgba(0, 0, 0, 0.3);
}
.stage-sky {
  background:
    linear-gradient(
      to bottom,
      rgba(135, 206, 250, 0.1) 0%,
      rgba(135, 206, 250, 0.05) 40%,
      rgba(0, 0, 0, 0) 100%
    ),
    radial-gradient(ellipse at 70% 110%, rgba(80, 120, 60, 0.15) 0%, transparent 60%);
}

.platform-defender,
.platform-challenger {
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.15) 40%,
    transparent 70%
  );
  border-radius: 50%;
}

@keyframes sprite-bump-c {
  0%,
  100% {
    transform: translateX(0) translateY(0);
  }
  30% {
    transform: translateX(20px) translateY(-6px);
  }
}
@keyframes sprite-bump-d {
  0%,
  100% {
    transform: translateX(0) translateY(0);
  }
  30% {
    transform: translateX(-16px) translateY(4px);
  }
}
@keyframes sprite-recoil {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(6px);
  }
}
@keyframes sprite-victory {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
@keyframes sprite-defeat {
  0% {
    transform: translateY(0);
    opacity: 1;
    filter: grayscale(0);
  }
  100% {
    transform: translateY(8px);
    opacity: 0.55;
    filter: grayscale(0.85);
  }
}
@keyframes crit-flash {
  0%,
  100% {
    background-color: transparent;
  }
  20% {
    background-color: rgba(255, 224, 130, 0.25);
  }
}

.sprite-bump-challenger {
  animation: sprite-bump-c 600ms ease-out;
}
.sprite-bump-defender {
  animation: sprite-bump-d 600ms ease-out;
}
.sprite-recoil {
  animation: sprite-recoil 500ms ease-out;
}
.sprite-victory {
  animation: sprite-victory 1.6s ease-in-out infinite;
}
.sprite-defeat {
  animation: sprite-defeat 1.4s ease-out forwards;
}
.crit-flash::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  animation: crit-flash 450ms ease-out;
  z-index: 30;
}

@media (prefers-reduced-motion: reduce) {
  .sprite-bump-challenger,
  .sprite-bump-defender,
  .sprite-recoil,
  .sprite-victory,
  .sprite-defeat,
  .crit-flash::after {
    animation: none;
  }
}
</style>
