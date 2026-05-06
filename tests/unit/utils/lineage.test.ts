import { describe, it, expect } from 'vitest'
import { LINEAGE_EMOJI, LINEAGE_LABELS, lineageEmoji } from '~/utils/lineage'

describe('LINEAGE_EMOJI', () => {
  it('has an entry for each canonical lineage', () => {
    const lineages = [
      'fire',
      'water',
      'grass',
      'electric',
      'eevee',
      'chikorita',
      'cyndaquil',
      'totodile',
    ]
    for (const l of lineages) {
      expect(LINEAGE_EMOJI[l]).toBeDefined()
      expect(LINEAGE_EMOJI[l]?.length).toBeGreaterThan(0)
    }
  })
})

describe('LINEAGE_LABELS', () => {
  it('has an English label for each canonical lineage', () => {
    expect(LINEAGE_LABELS.fire).toBe('Fire')
    expect(LINEAGE_LABELS.water).toBe('Water')
    expect(LINEAGE_LABELS.chikorita).toBe('Grass (Johto)')
  })
})

describe('lineageEmoji', () => {
  it('returns the right emoji for known lineage', () => {
    expect(lineageEmoji('fire')).toBe('🔥')
    expect(lineageEmoji('water')).toBe('💧')
    expect(lineageEmoji('chikorita')).toBe('🌱')
  })

  it('returns ❓ for null/undefined/unknown', () => {
    expect(lineageEmoji(null)).toBe('❓')
    expect(lineageEmoji(undefined)).toBe('❓')
    expect(lineageEmoji('unknown_pokemon')).toBe('❓')
  })

  it('returns ❓ for empty string', () => {
    expect(lineageEmoji('')).toBe('❓')
  })
})
