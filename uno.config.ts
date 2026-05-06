import { defineConfig, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
  ],
  theme: {
    colors: {
      // claude-pokemon palette : matches CLI lineage accents.
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
      gold: '#ffd700',
      // Dark surface palette (GitHub-dark-inspired)
      surface: {
        0: '#0d1117',
        1: '#161b22',
        2: '#21262d',
        3: '#30363d',
      },
    },
    fontFamily: {
      mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
      pixel: '"Press Start 2P", system-ui, monospace',
    },
  },
  // Pixelated rendering for sprite images
  rules: [
    ['pixel-render', { 'image-rendering': 'pixelated' }],
  ],
})
