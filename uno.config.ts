import { defineConfig, presetWind4 } from 'unocss'

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
    },
    fontFamily: {
      mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
      pixel: '"Press Start 2P", system-ui, monospace',
    },
  },
  // Pixelated rendering for sprite images
  rules: [['pixel-render', { 'image-rendering': 'pixelated' }]],
  // Shortcuts = semantic class aliases that resolve to dark:/light: variants.
  // Use these in components for theme-adaptive styling.
  shortcuts: {
    // Surfaces
    'surface-bg': 'bg-zinc-50 dark:bg-[#0d1117]',
    'surface-card': 'bg-white dark:bg-[#161b22]',
    'surface-card-hover': 'hover:bg-zinc-100 dark:hover:bg-[#21262d]',
    'surface-border': 'border-zinc-200 dark:border-[#30363d]',
    // Text
    'text-primary': 'text-zinc-900 dark:text-zinc-100',
    'text-secondary': 'text-zinc-600 dark:text-zinc-400',
    'text-muted': 'text-zinc-500 dark:text-zinc-500',
    // Brand accent that adapts (gold is brighter on dark, softer on light)
    'text-accent': 'text-gold-soft dark:text-gold',
    'bg-accent': 'bg-gold-soft dark:bg-gold',
  },
})
