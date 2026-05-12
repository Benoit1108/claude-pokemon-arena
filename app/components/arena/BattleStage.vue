<script setup lang="ts">
// Pokémon Black/White-inspired battle stage (Sprint 2.13 UA1, polish 2.14).
// Renders a single arena scene :
//   - sky gradient backdrop tinted by the active winner's lineage
//   - two combatants : challenger bottom-left (back-view), defender top-right
//     (face-view)
//   - concentric battle circles under each sprite, tinted by lineage accent,
//     spinning when that side attacks
//   - HP pills (BattleHpPill) above each combatant — replay mode derives
//     current HP from `visibleTurns` via deriveHpFromTurns()
//   - intro banner ("Un combat est lancé par X !") fades in on mount and
//     auto-dismisses after ~2.4s (suppressed via :show-intro="false")
//
// Wraps PokemonSprite (with the `back` prop) so we don't reinvent the
// fallback / shiny / animated handling. Floating damages + critical-hit
// shake hooks reuse the existing BattleJuice composable.

import { deriveHpFromTurns } from '~/utils/battle-engine'
import { lineageAccent, lineageGradient } from '~/utils/lineage'
import { stageNameFor } from '~/utils/sprites'
import type { BattleParticipant, BattleSide, BattleTurn } from '~/types/api'
import type { FloatingDamage } from '~/composables/useBattleJuice'

const { t } = useI18n()

const props = defineProps<{
  challenger: BattleParticipant
  defender: BattleParticipant
  /** Current HP for each side. Manual mode passes these directly. */
  challengerHp?: number
  challengerMaxHp?: number
  defenderHp?: number
  defenderMaxHp?: number
  /** Replay mode : pass the visible turn slice and we'll derive each side's
   * current HP by reducing through `defender_hp_after`. Sprint 2.14 fix. */
  visibleTurns?: BattleTurn[]
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

// Sprint 2.14 fix — replay/auto mode doesn't pass hp directly ; we reduce
// through the visible turn log via deriveHpFromTurns (extracted to utils
// for unit testing).
const cHp = computed(() =>
  props.challengerHp !== undefined
    ? props.challengerHp
    : deriveHpFromTurns('challenger', props.visibleTurns, cMax.value),
)
const dHp = computed(() =>
  props.defenderHp !== undefined
    ? props.defenderHp
    : deriveHpFromTurns('defender', props.visibleTurns, dMax.value),
)

// Sprint 2.14 polish — type-colored accent under each sprite (concentric
// circles + glow).
const challengerAccent = computed(() => lineageAccent(props.challenger.lineage))
const defenderAccent = computed(() => lineageAccent(props.defender.lineage))

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
        <div class="absolute -top-1 right-3 z-20">
          <BattleHpPill
            :name="defenderStageName"
            :level="defender.level"
            :is-shiny="defender.is_shiny"
            :hp="dHp"
            :max-hp="dMax"
            side="defender"
          />
        </div>
        <!-- Sprint 2.14 — concentric battle circles under the defender,
             tinted by their lineage type. The outer + middle ring slowly
             rotate when the defender is attacking. -->
        <div
          class="absolute bottom-3 right-10 battle-circle defender-circle pointer-events-none"
          :class="defenderAttacking ? 'circle-spin' : ''"
          :style="{ '--accent': defenderAccent }"
          aria-hidden="true"
        >
          <span class="circle-outer" />
          <span class="circle-middle" />
          <span class="circle-inner" />
        </div>
        <div
          class="relative z-10"
          :class="[
            defenderAttacking ? 'sprite-bump-defender' : '',
            challengerAttacking ? 'sprite-recoil' : '',
            defenderWinner ? 'sprite-victory' : '',
            defenderLoser ? 'sprite-defeat' : '',
          ]"
          :style="{ filter: `drop-shadow(0 0 14px ${defenderAccent}66)` }"
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
        <!-- Concentric battle circles for the challenger (a tad larger). -->
        <div
          class="absolute bottom-3 left-10 battle-circle challenger-circle pointer-events-none"
          :class="challengerAttacking ? 'circle-spin' : ''"
          :style="{ '--accent': challengerAccent }"
          aria-hidden="true"
        >
          <span class="circle-outer" />
          <span class="circle-middle" />
          <span class="circle-inner" />
        </div>
        <div
          class="relative z-10"
          :class="[
            challengerAttacking ? 'sprite-bump-challenger' : '',
            defenderAttacking ? 'sprite-recoil' : '',
            challengerWinner ? 'sprite-victory' : '',
            challengerLoser ? 'sprite-defeat' : '',
          ]"
          :style="{ filter: `drop-shadow(0 0 18px ${challengerAccent}88)` }"
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
      <span class="bg-black/40 backdrop-blur px-2 py-0.5 rounded"
        >{{ challengerName }} {{ t('battle_stage.you_suffix') }}</span
      >
    </div>

    <!-- Draw banner. Win/loss tinting handled by the sprite-victory/defeat
         CSS classes + the backdrop gradient ; an explicit DRAW callout helps. -->
    <div
      v-if="showFinalState && winner === 'draw'"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="px-4 py-2 rounded-md bg-black/70 text-white text-2xl font-bold tracking-widest">
        {{ t('battle_stage.draw_label') }}
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
    /* sky horizon */
    linear-gradient(
      to bottom,
      rgba(135, 206, 250, 0.12) 0%,
      rgba(135, 206, 250, 0.04) 35%,
      rgba(0, 0, 0, 0) 60%
    ),
    /* ground glow */
    radial-gradient(ellipse at 50% 105%, rgba(255, 200, 120, 0.18) 0%, transparent 55%),
    /* subtle scanline-ish hex pattern (BW-style stadium floor). The two
     * radial-gradient stops give a faint dotted texture without an SVG. */
    radial-gradient(circle at 25% 80%, rgba(255, 255, 255, 0.05) 0 1px, transparent 1.5px),
    radial-gradient(circle at 75% 90%, rgba(255, 255, 255, 0.05) 0 1px, transparent 1.5px);
  background-size:
    100% 100%,
    100% 100%,
    32px 32px,
    32px 32px;
}
/* Bottom-of-stage horizon line — a soft luminous band that suggests the
 * arena floor edge in BW battles. */
.stage-sky::before {
  content: '';
  position: absolute;
  inset: auto 0 38% 0;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
}

/* Sprint 2.14 — concentric battle circles under each combatant, tinted by
 * the lineage accent color (passed in via the --accent CSS var on the
 * .battle-circle host element).
 * Three rings : outer (faint, large), middle (visible), inner (compact +
 * brighter). Outer + middle subtly rotate when the side is attacking. */
.battle-circle {
  position: absolute;
  pointer-events: none;
  display: grid;
  place-items: center;
}
.defender-circle {
  width: 11rem;
  height: 11rem;
  bottom: -0.5rem;
  right: 1rem;
  transform: translate(0, 35%);
}
.challenger-circle {
  width: 14rem;
  height: 14rem;
  bottom: -0.75rem;
  left: 1rem;
  transform: translate(0, 30%);
}
.battle-circle .circle-outer,
.battle-circle .circle-middle,
.battle-circle .circle-inner {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.battle-circle .circle-outer {
  inset: 0;
  border: 2px dashed var(--accent, #fbbf24);
  opacity: 0.35;
  animation: ring-pulse 5s ease-in-out infinite;
}
.battle-circle .circle-middle {
  inset: 12%;
  border: 1px solid var(--accent, #fbbf24);
  opacity: 0.55;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.04) 0%, transparent 70%);
}
.battle-circle .circle-inner {
  inset: 28%;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--accent, #fbbf24) 35%, transparent) 0%,
    color-mix(in srgb, var(--accent, #fbbf24) 10%, transparent) 50%,
    transparent 80%
  );
  filter: blur(2px);
}
@keyframes ring-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.35;
  }
  50% {
    transform: scale(1.04);
    opacity: 0.55;
  }
}
@keyframes ring-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.circle-spin .circle-outer {
  animation:
    ring-pulse 1.2s ease-in-out infinite,
    ring-spin 1.5s linear infinite;
}
.circle-spin .circle-middle {
  animation: ring-spin 2.5s linear infinite reverse;
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
/* Sprint 2.14 — crit pulse upgraded from a flat overlay to a radial
 * burst : starts from the screen center, scales out, fades to transparent.
 * Reads better as "BAM!" than the old yellow tint. */
@keyframes crit-flash {
  0% {
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 224, 130, 0.6) 0%,
      rgba(255, 224, 130, 0.15) 40%,
      transparent 70%
    );
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    background: radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%);
    transform: scale(1.4);
    opacity: 0;
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
