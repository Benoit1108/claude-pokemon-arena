<script setup lang="ts">
const colorMode = useColorMode()

function cycle() {
  // system → light → dark → system → ...
  const order = ['system', 'light', 'dark'] as const
  const currentIdx = order.indexOf(colorMode.preference as (typeof order)[number])
  const next = order[(currentIdx + 1) % order.length]!
  colorMode.preference = next
}

const icon = computed(() => {
  if (colorMode.preference === 'system') return '🖥️'
  if (colorMode.value === 'dark') return '🌙'
  return '☀️'
})
const label = computed(() => {
  if (colorMode.preference === 'system') return 'system'
  return colorMode.value
})
</script>

<template>
  <button
    :title="`Theme: ${label} (click to cycle)`"
    class="px-3 py-1.5 surface-card surface-card-hover surface-border border rounded-md text-sm font-mono text-secondary transition flex items-center gap-2"
    @click="cycle"
  >
    <span class="text-base">{{ icon }}</span>
    <span class="hidden sm:inline">{{ label }}</span>
  </button>
</template>
