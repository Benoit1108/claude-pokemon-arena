<script setup lang="ts">
import { BADGE_META, TOTAL_BADGES, badgeMeta } from '~/utils/badges'

const props = defineProps<{
  earned: string[]
}>()

const earnedSet = computed(() => new Set(props.earned))
const allBadgeIds = computed(() => Object.keys(BADGE_META))
</script>

<template>
  <section class="mb-12">
    <h2 class="text-sm uppercase tracking-wider text-muted mb-3">
      🏆 Badges <span class="text-accent">{{ earned.length }}/{{ TOTAL_BADGES }}</span>
    </h2>
    <div class="surface-card border surface-border rounded-lg p-4">
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <div
          v-for="id in allBadgeIds"
          :key="id"
          class="text-center p-3 rounded-md border surface-border transition"
          :class="earnedSet.has(id) ? 'surface-card-hover' : 'opacity-30 grayscale'"
          :title="`${badgeMeta(id).label} — ${badgeMeta(id).description}`"
        >
          <div class="text-3xl mb-1">{{ badgeMeta(id).emoji }}</div>
          <div class="text-xs text-secondary">{{ badgeMeta(id).label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
