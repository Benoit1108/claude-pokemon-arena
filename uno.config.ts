import { defineConfig, presetWind4 } from 'unocss'

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — Sprint 4.9 audit revealed 46 sites duplicating the exact
// string `surface-card border surface-border rounded-lg`, 220/312 typography
// usages stuck in `text-xs`/`text-sm` with no semantic name, and 3 different
// transition durations (150/300/500ms) sprinkled inline. The tokens below
// give those patterns *one name each*, leaving raw utilities for one-off
// cases. Composition rule : `card p-4` over `card-md` so padding stays
// explicit at the call site (audit showed p-3, p-4, p-6, p-12 are all used
// for legitimate visual reasons).
//
// Token philosophy : *additive*, not restrictive. Existing utilities still
// work — these shortcuts just give a single semantic source of truth for the
// patterns we already repeat 10+ times. Migration is opt-in per component.
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  presets: [
    presetWind4({
      // Enable .dark / .light class strategy (color-mode module sets these on <html>)
      dark: 'class',
    }),
  ],
  theme: {
    colors: {
      // Lineage accents — same on both themes (Pokémon identity colors)
      lineage: {
        fire: '#ef6c00',
        water: '#268fff',
        grass: '#64b437',
        electric: '#ffda00',
        eevee: '#c2a88a',
        chikorita: '#7eb858',
        cyndaquil: '#e8a32a',
        totodile: '#3d8de8',
      },
      // Brand accent — theme-adaptable shades
      gold: {
        DEFAULT: '#ffd700',
        soft: '#d4a017', // for light mode (better contrast on white)
      },
      // Sprint 4.9 — status colors with theme variants. Replaces the ad-hoc
      // `text-emerald-400` / `text-red-400` / `text-amber-400` sprinkled in
      // battle UI. Each pair = (light, dark) so the readable shade flips
      // with the theme automatically.
      status: {
        success: { DEFAULT: '#15803d', dark: '#34d399' }, // emerald-700 / emerald-400
        warning: { DEFAULT: '#b45309', dark: '#fbbf24' }, // amber-700 / amber-400
        danger: { DEFAULT: '#b91c1c', dark: '#f87171' }, // red-700 / red-400
        info: { DEFAULT: '#1d4ed8', dark: '#60a5fa' }, // blue-700 / blue-400
      },
    },
    fontFamily: {
      mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
      pixel: '"Press Start 2P", system-ui, monospace',
    },
  },
  rules: [
    // Pixelated rendering for sprite images
    ['pixel-render', { 'image-rendering': 'pixelated' }],
  ],
  // Shortcuts = semantic class aliases that resolve to dark:/light: variants.
  // Use these in components for theme-adaptive styling.
  shortcuts: {
    // ── Surfaces ───────────────────────────────────────────────────────────
    'surface-bg': 'bg-zinc-50 dark:bg-[#0d1117]',
    'surface-card': 'bg-white dark:bg-[#161b22]',
    'surface-card-hover': 'hover:bg-zinc-100 dark:hover:bg-[#21262d]',
    'surface-border': 'border-zinc-200 dark:border-[#30363d]',
    /** Sprint 4.9 — popovers / dropdowns / modals. Slightly elevated tone
     * over `surface-card` to read above content. */
    'surface-elevated': 'bg-white dark:bg-[#1c2128] shadow-lg shadow-black/20',

    // ── Text ───────────────────────────────────────────────────────────────
    'text-primary': 'text-zinc-900 dark:text-zinc-100',
    'text-secondary': 'text-zinc-600 dark:text-zinc-400',
    'text-muted': 'text-zinc-500 dark:text-zinc-500',
    'text-accent': 'text-gold-soft dark:text-gold',
    'bg-accent': 'bg-gold-soft dark:bg-gold',
    /** Sprint 4.9 — status text shortcuts. Theme-aware. */
    'text-success': 'text-[#15803d] dark:text-[#34d399]',
    'text-warning': 'text-[#b45309] dark:text-[#fbbf24]',
    'text-danger': 'text-[#b91c1c] dark:text-[#f87171]',
    'text-info': 'text-[#1d4ed8] dark:text-[#60a5fa]',

    // ── Typography ─────────────────────────────────────────────────────────
    // Semantic type scale. Use these over raw `text-2xl font-bold` so we can
    // adjust the scale globally (responsive size, weight, tracking) in one
    // place.
    /** Hero / landing page headline. Mirrors the index.vue h1. */
    'text-display': 'text-5xl md:text-6xl font-bold tracking-tight',
    /** Page title (e.g. "Pokédex", "Mon profil"). */
    'text-h1': 'text-3xl font-bold tracking-tight',
    /** Section title within a page. */
    'text-h2': 'text-2xl font-bold',
    /** Card title / subsection. */
    'text-h3': 'text-lg font-semibold',
    /** Small uppercase label above a card section ("Battle log", "Connecté"). */
    'text-label': 'text-xs uppercase tracking-widest text-secondary font-medium',
    /** Body copy — the default reading size in cards. */
    'text-body': 'text-sm text-primary',
    /** Secondary meta info (timestamps, counts). */
    'text-meta': 'text-xs text-secondary',
    /** Tiny ancillary (anon_id slugs, footnotes). */
    'text-caption': 'text-[10px] text-muted tracking-wide',

    // ── Card archetype ─────────────────────────────────────────────────────
    // Audit showed 46 sites duplicating this exact 4-class string. Replace
    // `surface-card border surface-border rounded-lg` (often + `p-X`) with
    // `card p-X`. Composition keeps padding explicit at the call site.
    card: 'surface-card border surface-border rounded-lg',
    /** Card that reacts to hover (used as a button/link). */
    'card-interactive': 'card surface-card-hover transition-default cursor-pointer',
    /** Higher elevation, used for popovers/dropdowns. */
    'card-elevated': 'surface-elevated border surface-border rounded-lg',

    // ── Pills & chips ──────────────────────────────────────────────────────
    /** Header nav / user menu trigger style. Compose with a color border. */
    pill: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border surface-border surface-card transition-default',
    'pill-interactive': 'pill surface-card-hover cursor-pointer',
    /** Inline badge for tags / status labels (small, no border). */
    chip: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',

    // ── Buttons ────────────────────────────────────────────────────────────
    /** Primary action button. */
    'btn-primary':
      'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-zinc-900 font-bold rounded-md hover:opacity-90 transition-default cursor-pointer',
    /** Secondary outline. */
    'btn-secondary':
      'inline-flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-gold-soft dark:border-gold text-accent font-bold rounded-md hover:bg-accent/10 transition-default cursor-pointer',
    /** Tertiary / ghost — for less-emphasized actions. */
    'btn-ghost':
      'inline-flex items-center justify-center gap-2 px-5 py-2.5 border surface-border rounded-md surface-card-hover transition-default text-primary cursor-pointer',

    // ── Transitions ────────────────────────────────────────────────────────
    // Replace ad-hoc `transition duration-300` strings (audit found 150ms,
    // 300ms, 500ms used inconsistently) with one semantic default.
    'transition-default': 'transition duration-200 ease-out',
    'transition-slow': 'transition duration-400 ease-out',
  },
})
