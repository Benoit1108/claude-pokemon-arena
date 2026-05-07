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

// Subtle CSS linear-gradient tinted by lineage. Used as battle / ladder
// backdrops to give each fight a flavor — orange-ish for fire matchups,
// blue for water, etc. Keeps the gradient under 30% opacity so it doesn't
// fight the surface tokens for legibility.
export const LINEAGE_GRADIENT: Record<string, string> = {
  fire: 'linear-gradient(135deg, rgba(239,108,0,0.14) 0%, rgba(255,140,40,0.06) 60%, transparent 100%)',
  water:
    'linear-gradient(135deg, rgba(38,143,255,0.14) 0%, rgba(80,180,255,0.06) 60%, transparent 100%)',
  grass:
    'linear-gradient(135deg, rgba(100,180,55,0.14) 0%, rgba(140,200,80,0.06) 60%, transparent 100%)',
  electric:
    'linear-gradient(135deg, rgba(255,218,0,0.14) 0%, rgba(255,200,40,0.06) 60%, transparent 100%)',
  eevee:
    'linear-gradient(135deg, rgba(194,168,138,0.14) 0%, rgba(220,190,160,0.06) 60%, transparent 100%)',
  chikorita:
    'linear-gradient(135deg, rgba(126,184,88,0.14) 0%, rgba(160,210,110,0.06) 60%, transparent 100%)',
  cyndaquil:
    'linear-gradient(135deg, rgba(232,163,42,0.14) 0%, rgba(255,180,60,0.06) 60%, transparent 100%)',
  totodile:
    'linear-gradient(135deg, rgba(61,141,232,0.14) 0%, rgba(100,180,255,0.06) 60%, transparent 100%)',
}

export function lineageGradient(lineage: Lineage | string | null | undefined): string {
  if (!lineage) return 'none'
  return LINEAGE_GRADIENT[lineage] || 'none'
}

// Solid accent color (used for borders, focus rings, pinned-badge highlights
// on the trainer profile). Distinct from the gradient — full opacity, picked
// to read well as a thin border on dark + light surfaces. Sprint 2.9.
export const LINEAGE_ACCENT: Record<string, string> = {
  fire: '#ef6c00',
  water: '#268fff',
  grass: '#64b437',
  electric: '#ffda00',
  eevee: '#c2a88a',
  chikorita: '#7eb858',
  cyndaquil: '#e8a32a',
  totodile: '#3d8de8',
}

/** CSS color string for the trainer's lineage accent — falls back to the UI
 * "accent" token (gold) when no lineage is set. */
export function lineageAccent(lineage: Lineage | string | null | undefined): string {
  if (!lineage) return 'var(--accent, #fbbf24)'
  return LINEAGE_ACCENT[lineage] || 'var(--accent, #fbbf24)'
}
