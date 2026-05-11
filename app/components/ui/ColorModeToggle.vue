<script setup lang="ts">
// Sprint 4.9 — icon-only theme toggle. The previous version stacked an
// emoji + a "dark" / "system" label, which was wider than the user pill
// next to it and felt mismatched with modern app headers. Now : single
// 36px square that cycles system → light → dark → retro on click ; the
// label survives as a tooltip only.

const colorMode = useColorMode()

type Mode = 'system' | 'light' | 'dark' | 'retro'
const order: Mode[] = ['system', 'light', 'dark', 'retro']

function cycle() {
  const currentIdx = order.indexOf(colorMode.preference as Mode)
  const next = order[(currentIdx + 1) % order.length]!
  colorMode.preference = next
}

const icon = computed(() => {
  if (colorMode.preference === 'system') return '🖥️'
  if (colorMode.preference === 'retro') return '🎮'
  if (colorMode.value === 'dark') return '🌙'
  return '☀️'
})
const label = computed(() => {
  if (colorMode.preference === 'system') return 'system'
  if (colorMode.preference === 'retro') return 'retro'
  return colorMode.value
})
</script>

<template>
  <ClientOnly>
    <button
      :title="`Thème : ${label} — cliquer pour changer`"
      :aria-label="`Thème actuel : ${label}. Cliquer pour changer.`"
      class="w-9 h-9 rounded-full border surface-border surface-card surface-card-hover transition-default flex items-center justify-center text-base"
      @click="cycle"
    >
      <span aria-hidden="true">{{ icon }}</span>
    </button>
  </ClientOnly>
</template>
