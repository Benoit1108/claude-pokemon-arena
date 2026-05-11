// Pokémon Showdown sprite URL resolution. The lineage stages + stageFor()
// come from the shared package (Sprint 3) ; this file keeps :
//   - STAGE_NAME_FR    : showdown_id → localized French stage name
//   - spriteUrl(...)   : URL builder for the Showdown CDN (gen5/ + ani/ +
//                        back/ + shiny variants)
//   - stageNameFor(...) : convenience wrapper (lineage + level → FR name)
//
// We re-export `stageFor` and the LineageStage type so existing callers
// (`from '~/utils/sprites'`) keep working without churn.

import { stageFor, type LineageStage } from 'claude-pokemon-shared/stages'

export { stageFor, type LineageStage }

const SHOWDOWN_BASE = 'https://play.pokemonshowdown.com/sprites'

/** Localized French names for every catalogued stage. Keep this in sync with
 * the CLI's lib/data/lineages/*.json display labels. */
export const STAGE_NAME_FR: Record<string, string> = {
  egg: 'Œuf',
  charmander: 'Salamèche',
  charmeleon: 'Reptincel',
  charizard: 'Dracaufeu',
  'charizard-megax': 'Méga-Dracaufeu X',
  'charizard-megay': 'Méga-Dracaufeu Y',
  squirtle: 'Carapuce',
  wartortle: 'Carabaffe',
  blastoise: 'Tortank',
  'blastoise-mega': 'Méga-Tortank',
  'blastoise-gmax': 'Tortank Gigamax',
  bulbasaur: 'Bulbizarre',
  ivysaur: 'Herbizarre',
  venusaur: 'Florizarre',
  'venusaur-mega': 'Méga-Florizarre',
  'venusaur-gmax': 'Florizarre Gigamax',
  pichu: 'Pichu',
  pikachu: 'Pikachu',
  raichu: 'Raichu',
  'raichu-alola': "Raichu d'Alola",
  'pikachu-gmax': 'Pikachu Gigamax',
  eevee: 'Évoli',
  vaporeon: 'Aquali',
  jolteon: 'Voltali',
  flareon: 'Pyroli',
  espeon: 'Mentali',
  umbreon: 'Noctali',
  chikorita: 'Germignon',
  bayleef: 'Macronium',
  meganium: 'Méganium',
  cyndaquil: 'Héricendre',
  quilava: 'Feurisson',
  typhlosion: 'Typhlosion',
  'typhlosion-hisui': "Typhlosion d'Hisui",
  totodile: 'Kaiminus',
  croconaw: 'Crocrodil',
  feraligatr: 'Aligatueur',
}

/**
 * Resolve the Showdown sprite URL for a participant snapshot.
 *
 * @param animated  use animated GIF (only available for Gen 5+ Pokémon, falls
 *                  back gracefully via @error event on the <img> in the consumer).
 * @param back      back-view sprite (Sprint 2.13 UA1 — BW battle style).
 */
export function spriteUrl(opts: {
  lineage: string
  level: number
  isShiny?: boolean
  animated?: boolean
  back?: boolean
}): string {
  const stage = stageFor(opts.lineage, opts.level)
  const variant = opts.isShiny ? '-shiny' : ''
  if (opts.back) {
    if (opts.animated) {
      return `${SHOWDOWN_BASE}/ani-back${variant}/${stage.showdown_id}.gif`
    }
    return `${SHOWDOWN_BASE}/gen5-back${variant}/${stage.showdown_id}.png`
  }
  if (opts.animated) {
    return `${SHOWDOWN_BASE}/ani${variant}/${stage.showdown_id}.gif`
  }
  return `${SHOWDOWN_BASE}/gen5${variant}/${stage.showdown_id}.png`
}

/** Localized stage name (Salamèche / Reptincel / Dracaufeu / …). */
export function stageNameFor(lineage: string, level: number): string {
  const stage = stageFor(lineage, level)
  return STAGE_NAME_FR[stage.showdown_id] ?? stage.showdown_id
}
