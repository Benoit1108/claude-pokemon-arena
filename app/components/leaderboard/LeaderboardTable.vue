<script setup lang="ts">
import { fmt, rankPrefix, trainerLabel } from '~/utils/format'
import { lineageEmoji } from '~/utils/lineage'
import type { LeaderboardEntry } from '~/types/api'

defineProps<{
  entries: LeaderboardEntry[]
  title?: string
}>()
</script>

<template>
  <section class="mb-12">
    <h2 class="text-sm uppercase tracking-wider text-muted mb-3">
      🏆 {{ title || 'Leaderboard — total tokens' }}
    </h2>
    <div class="surface-card border surface-border rounded-lg overflow-hidden">
      <table class="w-full">
        <tbody>
          <tr
            v-for="(entry, i) in entries"
            :key="entry.anon_id"
            class="border-b surface-border last:border-b-0 surface-card-hover transition cursor-pointer"
            @click="navigateTo(`/trainer/${entry.anon_id}`)"
          >
            <td class="px-4 py-3 text-2xl w-16 text-center">
              {{ rankPrefix(i + 1) }}
            </td>
            <td class="px-4 py-3">
              <NuxtLink
                :to="`/trainer/${entry.anon_id}`"
                class="font-bold text-primary hover:text-accent transition"
                @click.stop
              >
                {{ trainerLabel(entry) }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3 text-right font-bold text-accent tabular-nums">
              {{ fmt(entry.value) }}
            </td>
            <td class="px-4 py-3 text-right text-secondary text-sm">
              <span class="mr-1">{{ lineageEmoji(entry.lineage) }}</span>
              <span>{{ entry.lineage }}</span>
              <span class="ml-2 text-muted">
                {{ entry.level === 0 ? '🥚' : `Lv.${entry.level}` }}
              </span>
              <span v-if="entry.is_shiny" class="ml-1 text-accent">✦</span>
            </td>
          </tr>
          <tr v-if="!entries.length">
            <td colspan="4" class="px-4 py-12 text-center text-muted">
              No trainer has submitted stats yet. Be the first :
              <code class="text-accent">/pokemon stats-share enable --confirm</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
