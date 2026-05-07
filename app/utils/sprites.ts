// Pokémon Showdown sprite resolution. Lineage + level → showdown_id, then
// hot-link to play.pokemonshowdown.com. Same sprite system as the CLI.
//
// Stages mirror lib/data/lineages/*.json from the claude-pokemon repo.
// If the CLI changes thresholds, sync this file (or extract to a shared
// npm package later).

import type { Lineage } from '~/types/api'

export interface LineageStage {
  min_level: number
  showdown_id: string
  name: string
}

// prettier-ignore
export const LINEAGE_STAGES: Record<Lineage, LineageStage[]> = {
  fire: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'charmander',         name: 'Salamèche' },
    { min_level: 16,  showdown_id: 'charmeleon',         name: 'Reptincel' },
    { min_level: 36,  showdown_id: 'charizard',          name: 'Dracaufeu' },
    { min_level: 55,  showdown_id: 'charizard-megax',    name: 'Méga-Dracaufeu X' },
    { min_level: 100, showdown_id: 'charizard-megay',    name: 'Méga-Dracaufeu Y' },
  ],
  water: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'squirtle',           name: 'Carapuce' },
    { min_level: 16,  showdown_id: 'wartortle',          name: 'Carabaffe' },
    { min_level: 36,  showdown_id: 'blastoise',          name: 'Tortank' },
    { min_level: 55,  showdown_id: 'blastoise-mega',     name: 'Méga-Tortank' },
    { min_level: 100, showdown_id: 'blastoise-gmax',     name: 'Tortank Gigamax' },
  ],
  grass: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'bulbasaur',          name: 'Bulbizarre' },
    { min_level: 16,  showdown_id: 'ivysaur',            name: 'Herbizarre' },
    { min_level: 32,  showdown_id: 'venusaur',           name: 'Florizarre' },
    { min_level: 55,  showdown_id: 'venusaur-mega',      name: 'Méga-Florizarre' },
    { min_level: 100, showdown_id: 'venusaur-gmax',      name: 'Florizarre Gigamax' },
  ],
  electric: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'pichu',              name: 'Pichu' },
    { min_level: 10,  showdown_id: 'pikachu',            name: 'Pikachu' },
    { min_level: 30,  showdown_id: 'raichu',             name: 'Raichu' },
    { min_level: 55,  showdown_id: 'raichu-alola',       name: "Raichu d'Alola" },
    { min_level: 100, showdown_id: 'pikachu-gmax',       name: 'Pikachu Gigamax' },
  ],
  // Eevee evolves into ONE of 5 forms at Lv.30 (chosen via stones / friendship
  // in the CLI, stored in state.eevee_form). The web doesn't currently submit
  // that field, so we default to vaporeon — first stage in array order.
  // TODO: extend submit payload with eevee_form to render the actual evolution.
  eevee: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'eevee',              name: 'Évoli' },
    { min_level: 30,  showdown_id: 'vaporeon',           name: 'Aquali' },
    { min_level: 30,  showdown_id: 'jolteon',            name: 'Voltali' },
    { min_level: 30,  showdown_id: 'flareon',            name: 'Pyroli' },
    { min_level: 30,  showdown_id: 'espeon',             name: 'Mentali' },
    { min_level: 30,  showdown_id: 'umbreon',            name: 'Noctali' },
  ],
  chikorita: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'chikorita',          name: 'Germignon' },
    { min_level: 16,  showdown_id: 'bayleef',            name: 'Macronium' },
    { min_level: 32,  showdown_id: 'meganium',           name: 'Méganium' },
  ],
  cyndaquil: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'cyndaquil',          name: 'Héricendre' },
    { min_level: 16,  showdown_id: 'quilava',            name: 'Feurisson' },
    { min_level: 32,  showdown_id: 'typhlosion',         name: 'Typhlosion' },
    { min_level: 55,  showdown_id: 'typhlosion-hisui',   name: "Typhlosion d'Hisui" },
  ],
  totodile: [
    { min_level: 0,   showdown_id: 'egg',                name: 'Œuf' },
    { min_level: 1,   showdown_id: 'totodile',           name: 'Kaiminus' },
    { min_level: 16,  showdown_id: 'croconaw',           name: 'Crocrodil' },
    { min_level: 32,  showdown_id: 'feraligatr',         name: 'Aligatueur' },
  ],
}

const SHOWDOWN_BASE = 'https://play.pokemonshowdown.com/sprites'

/**
 * Find the highest stage qualifying for the given level. On ties (multiple
 * stages share the same min_level — Eevee at Lv.30 has 5 forms), the first
 * one listed wins, so the default Eevee evolution is vaporeon. To get the
 * actual chosen form for a given trainer, the submit payload would need an
 * eevee_form field (TODO).
 */
export function stageFor(lineage: string, level: number): LineageStage {
  const stages = LINEAGE_STAGES[lineage as Lineage] ?? LINEAGE_STAGES.fire
  let chosen = stages[0]!
  for (const s of stages) {
    if (s.min_level > level) break // stages are sorted by min_level ascending
    if (s.min_level > chosen.min_level) chosen = s // strictly greater = new tier
  }
  return chosen
}

/**
 * Resolve the Showdown sprite URL for a participant snapshot.
 *
 * @param animated  use animated GIF (only available for Gen 5+ Pokémon, falls
 *                  back gracefully via @error event on the <img> in the consumer).
 */
export function spriteUrl(opts: {
  lineage: string
  level: number
  isShiny?: boolean
  animated?: boolean
}): string {
  const stage = stageFor(opts.lineage, opts.level)
  const variant = opts.isShiny ? '-shiny' : ''
  if (opts.animated) {
    return `${SHOWDOWN_BASE}/ani${variant}/${stage.showdown_id}.gif`
  }
  return `${SHOWDOWN_BASE}/gen5${variant}/${stage.showdown_id}.png`
}

/** Localized stage name (Salamèche / Reptincel / Dracaufeu / …). */
export function stageNameFor(lineage: string, level: number): string {
  return stageFor(lineage, level).name
}
