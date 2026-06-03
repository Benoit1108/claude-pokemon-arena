// Battle scene resolution (Phase 2.15) — picks the pixel-art background and
// the sprite standing positions for the BattleStage.
//
// The decor is a hot pixel-art image in /public/battle-bg/. `scene="arena"`
// forces the PvP stadium ; otherwise the environment is derived from the
// opponent's combat type (water → beach, fire → volcano, …) so wild / ladder
// battles get a fitting backdrop. Anchors are per-environment because the
// painted platforms aren't at identical spots across the (AI-made) backgrounds.

import { lineageToCombatType, type CombatType } from 'claude-pokemon-shared'

export interface SceneAnchor {
  x: string
  y: string
}
export interface SceneAnchors {
  ally: SceneAnchor
  foe: SceneAnchor
}
export interface BattleScene {
  env: string
  bg: string
  anchors: SceneAnchors
}

const TYPE_TO_ENV: Record<CombatType, string> = {
  grass: 'prairie',
  bug: 'prairie',
  water: 'plage',
  fire: 'volcan',
  electric: 'orage',
  steel: 'orage',
  psychic: 'ruines',
  ghost: 'ruines',
  fairy: 'ruines',
  dragon: 'montagne',
  flying: 'montagne',
  rock: 'canyon',
  ground: 'canyon',
  dark: 'marais',
  poison: 'marais',
  ice: 'neige',
  fighting: 'dojo',
  normal: 'dojo',
}

const AVAILABLE = new Set([
  'arena',
  'prairie',
  'plage',
  'volcan',
  'orage',
  'ruines',
  'montagne',
  'canyon',
  'neige',
  'marais',
  'dojo',
])

// Standing anchors = the painted platform centers, in % of the stage box.
// Default fits the common ~16:10 backgrounds ; tuned per-env where it drifts.
const DEFAULT_ANCHORS: SceneAnchors = { ally: { x: '32%', y: '82%' }, foe: { x: '78%', y: '56%' } }
const ANCHORS: Record<string, SceneAnchors> = {
  arena: { ally: { x: '30%', y: '83%' }, foe: { x: '72%', y: '60%' } },
  plage: { ally: { x: '36%', y: '83%' }, foe: { x: '80%', y: '56%' } },
  prairie: { ally: { x: '28%', y: '80%' }, foe: { x: '74%', y: '62%' } },
}

/**
 * Resolve the battle scene from an explicit `scene` hint or the opponent's
 * lineage. A recognized `scene` wins ; otherwise the environment is derived
 * from the defender's combat type (no defender → 'normal' → dojo). The final
 * `prairie` guard is a defensive net — every type maps to an available env, so
 * it only fires if `scene`/data is corrupt — preventing a missing image.
 */
export function resolveScene(opts: { scene?: string; defenderLineage?: string }): BattleScene {
  let env =
    opts.scene && AVAILABLE.has(opts.scene)
      ? opts.scene
      : TYPE_TO_ENV[lineageToCombatType(opts.defenderLineage)]
  if (!env || !AVAILABLE.has(env)) env = 'prairie'
  return { env, bg: `/battle-bg/${env}.png`, anchors: ANCHORS[env] ?? DEFAULT_ANCHORS }
}
