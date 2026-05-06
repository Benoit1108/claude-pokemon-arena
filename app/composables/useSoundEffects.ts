// Procedural 8-bit-style sound effects via Web Audio API. No assets — every
// sound is synthesized from oscillators + envelopes, so the bundle stays
// dependency-free and copyright-safe.
//
// Browser autoplay policy : the AudioContext stays suspended until the first
// user gesture. We resume() on every play call so the first user-triggered
// sound (e.g. clicking ▶ Play, or the 🔊 toggle) unlocks subsequent battle
// sounds automatically.

const STORAGE_KEY = 'arena-sound-enabled'

interface NoteOptions {
  frequency: number
  duration: number // seconds
  type?: OscillatorType
  /** Linear ramp from `frequency` to `to` over `duration`. */
  to?: number
  /** Peak gain (0..1). Default 0.18 — 8-bit-loud but not painful. */
  gain?: number
  /** Delay before this note plays, relative to "now", in seconds. */
  startAt?: number
}

let _ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (_ctx) return _ctx
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  _ctx = new Ctor()
  return _ctx
}

function playNote(ctx: AudioContext, opts: NoteOptions): void {
  const startAt = ctx.currentTime + (opts.startAt ?? 0)
  const peak = opts.gain ?? 0.18
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type ?? 'square'
  osc.frequency.setValueAtTime(opts.frequency, startAt)
  if (opts.to !== undefined) {
    osc.frequency.linearRampToValueAtTime(opts.to, startAt + opts.duration)
  }
  // ADSR-ish envelope : 5 ms attack, exponential decay to silence.
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + opts.duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + opts.duration)
}

export function useSoundEffects() {
  // SSR-safe initial value — read localStorage only once on the client.
  const enabled = ref(false)

  onMounted(() => {
    try {
      enabled.value = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      enabled.value = false
    }
  })

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, enabled.value ? '1' : '0')
    } catch {
      /* localStorage blocked (private mode, etc.) — silently ignore */
    }
  }

  function toggle() {
    enabled.value = !enabled.value
    persist()
    // Touch the AudioContext on toggle-on so it's primed for subsequent plays.
    if (enabled.value) {
      const ctx = getContext()
      if (ctx && ctx.state === 'suspended') void ctx.resume()
    }
  }

  function play(notes: NoteOptions[]) {
    if (!enabled.value) return
    const ctx = getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    for (const n of notes) playNote(ctx, n)
  }

  /** Light damage / regular hit — short low-mid square blip. */
  function playHit() {
    play([{ frequency: 220, to: 110, duration: 0.12, gain: 0.14 }])
  }

  /** Super-effective hit — slightly punchier, two-tone. */
  function playSuperEffective() {
    play([
      { frequency: 330, to: 220, duration: 0.1, gain: 0.16 },
      { frequency: 440, to: 220, duration: 0.14, gain: 0.16, startAt: 0.06 },
    ])
  }

  /** Critical — three-note descending arpeggio for impact. */
  function playCritical() {
    play([
      { frequency: 880, duration: 0.07, gain: 0.18 },
      { frequency: 660, duration: 0.07, gain: 0.18, startAt: 0.06 },
      { frequency: 440, duration: 0.18, gain: 0.18, startAt: 0.12, to: 110 },
    ])
  }

  /** Victory — ascending major triad C-E-G with sustain. */
  function playWin() {
    play([
      { frequency: 523.25, duration: 0.14, gain: 0.16, type: 'square' }, // C5
      { frequency: 659.25, duration: 0.14, gain: 0.16, type: 'square', startAt: 0.12 }, // E5
      { frequency: 783.99, duration: 0.32, gain: 0.18, type: 'square', startAt: 0.24 }, // G5
    ])
  }

  /** Defeat — downward sweep, sad. */
  function playDefeat() {
    play([{ frequency: 440, to: 110, duration: 0.6, gain: 0.16, type: 'sawtooth' }])
  }

  /** Draw — flat double tone, neutral. */
  function playDraw() {
    play([
      { frequency: 330, duration: 0.16, gain: 0.14 },
      { frequency: 330, duration: 0.16, gain: 0.14, startAt: 0.18 },
    ])
  }

  return {
    enabled,
    toggle,
    playHit,
    playSuperEffective,
    playCritical,
    playWin,
    playDefeat,
    playDraw,
  }
}
