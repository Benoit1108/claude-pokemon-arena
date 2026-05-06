// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useSoundEffects } from '~/composables/useSoundEffects'

type SfxApi = ReturnType<typeof useSoundEffects>

/**
 * Mount a tiny host component so onMounted hooks inside the composable
 * actually fire. effectScope alone does NOT trigger lifecycle hooks.
 */
function mountSfx(): { sfx: SfxApi } {
  let sfx!: SfxApi
  const Host = defineComponent({
    setup() {
      sfx = useSoundEffects()
      return () => h('div')
    },
  })
  mount(Host)
  return { sfx }
}

describe('useSoundEffects', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes the expected play methods + enabled state', () => {
    const { sfx } = mountSfx()
    expect(typeof sfx.playHit).toBe('function')
    expect(typeof sfx.playSuperEffective).toBe('function')
    expect(typeof sfx.playCritical).toBe('function')
    expect(typeof sfx.playWin).toBe('function')
    expect(typeof sfx.playDefeat).toBe('function')
    expect(typeof sfx.playDraw).toBe('function')
    expect(typeof sfx.toggle).toBe('function')
    expect(typeof sfx.enabled.value).toBe('boolean')
  })

  it('starts disabled by default (no localStorage entry)', () => {
    const { sfx } = mountSfx()
    expect(sfx.enabled.value).toBe(false)
  })

  it('toggle flips enabled state and persists to localStorage', () => {
    const { sfx } = mountSfx()
    expect(sfx.enabled.value).toBe(false)
    sfx.toggle()
    expect(sfx.enabled.value).toBe(true)
    expect(localStorage.getItem('arena-sound-enabled')).toBe('1')
    sfx.toggle()
    expect(sfx.enabled.value).toBe(false)
    expect(localStorage.getItem('arena-sound-enabled')).toBe('0')
  })

  it('reads stored "1" on mount and starts enabled', () => {
    localStorage.setItem('arena-sound-enabled', '1')
    const { sfx } = mountSfx()
    expect(sfx.enabled.value).toBe(true)
  })

  it('play methods are no-ops when disabled (no throw)', () => {
    const { sfx } = mountSfx()
    expect(sfx.enabled.value).toBe(false)
    expect(() => sfx.playHit()).not.toThrow()
    expect(() => sfx.playCritical()).not.toThrow()
    expect(() => sfx.playWin()).not.toThrow()
    expect(() => sfx.playDefeat()).not.toThrow()
  })

  it('play methods do not throw when enabled, even if AudioContext is unavailable', () => {
    const { sfx } = mountSfx()
    sfx.toggle() // enable
    // happy-dom may stub AudioContext — the composable must defend against
    // missing API and not crash.
    expect(() => sfx.playHit()).not.toThrow()
    expect(() => sfx.playSuperEffective()).not.toThrow()
    expect(() => sfx.playDraw()).not.toThrow()
  })

  it('survives localStorage write failure (private browsing)', () => {
    const { sfx } = mountSfx()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => sfx.toggle()).not.toThrow()
    expect(sfx.enabled.value).toBe(true) // state still toggled in memory
    spy.mockRestore()
  })
})
