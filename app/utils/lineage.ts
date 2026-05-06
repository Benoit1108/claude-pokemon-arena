// Lineage → emoji + accent color mapping.
// Single source of truth on the frontend (synced with worker svg.ts).

import type { Lineage } from '~/types/api'

export const LINEAGE_EMOJI: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  grass: '🌿',
  electric: '⚡',
  eevee: '🦊',
  chikorita: '🌱',
  cyndaquil: '🦔',
  totodile: '🐊',
}

export const LINEAGE_LABELS: Record<string, string> = {
  fire: 'Fire',
  water: 'Water',
  grass: 'Grass',
  electric: 'Electric',
  eevee: 'Eevee',
  chikorita: 'Grass (Johto)',
  cyndaquil: 'Fire (Johto)',
  totodile: 'Water (Johto)',
}

export function lineageEmoji(lineage: Lineage | string | null | undefined): string {
  if (!lineage) return '❓'
  return LINEAGE_EMOJI[lineage] || '❓'
}
