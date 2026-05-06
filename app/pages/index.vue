<script setup lang="ts">
const api = useApi()

// Parallel fetch on SSR, hydrated on client. Falls back gracefully if Worker
// is unreachable (we show "—" placeholders instead of crashing).
const { data: aggregate } = await useAsyncData('aggregate', () => api.aggregate())
const { data: leaderboard } = await useAsyncData('leaderboard',
  () => api.leaderboard('total_tokens', 10),
)

const lineageEmoji: Record<string, string> = {
  fire: '🔥', water: '💧', grass: '🌿', electric: '⚡', eevee: '🦊',
  chikorita: '🌱', cyndaquil: '🦔', totodile: '🐊',
}

function fmt(n: number | undefined | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toLocaleString('fr-FR')
}

function fmtPct(n: number | undefined | null) {
  if (n == null) return '—'
  return (n * 100).toFixed(2) + '%'
}

function rankPrefix(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank.toString().padStart(2, ' ') + '.'
}

function trainerLabel(e: { display_name: string | null, anon_id: string }) {
  return e.display_name
    ? `${e.display_name}#${e.anon_id.slice(0, 4)}`
    : e.anon_id
}
</script>

<template>
  <main class="max-w-5xl mx-auto px-6 py-12">
    <!-- Hero -->
    <header class="text-center mb-16">
      <div class="inline-block px-3 py-1 mb-4 text-xs uppercase tracking-widest border border-surface-3 rounded-full text-zinc-400">
        Phase 2 · MVP preview
      </div>
      <h1 class="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-gold to-lineage-fire">
        🎮 claude-pokemon arena
      </h1>
      <p class="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        Where Pokémon raised in your Claude Code statusline
        <em class="text-zinc-300">battle, trade, and rank up</em>
        between trainers worldwide.
      </p>
      <div class="mt-8 flex justify-center gap-3 flex-wrap">
        <a
          href="https://www.npmjs.com/package/claude-pokemon"
          class="px-5 py-2.5 bg-gold text-surface-0 font-bold rounded-md hover:opacity-90 transition"
        >
          Install the CLI →
        </a>
        <a
          href="https://github.com/Benoit1108/claude-pokemon"
          class="px-5 py-2.5 border border-surface-3 rounded-md hover:bg-surface-1 transition"
        >
          GitHub
        </a>
      </div>
    </header>

    <!-- Live global stats -->
    <section class="mb-12">
      <h2 class="text-sm uppercase tracking-wider text-zinc-500 mb-3">🌍 Global stats</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-surface-1 border border-surface-3 rounded-lg p-4">
          <div class="text-xs text-zinc-500 uppercase">Players</div>
          <div class="text-3xl font-bold text-gold mt-1">{{ aggregate?.total_players ?? '—' }}</div>
        </div>
        <div class="bg-surface-1 border border-surface-3 rounded-lg p-4">
          <div class="text-xs text-zinc-500 uppercase">Tokens combined</div>
          <div class="text-3xl font-bold mt-1">{{ fmt(aggregate?.total_tokens_combined) }}</div>
        </div>
        <div class="bg-surface-1 border border-surface-3 rounded-lg p-4">
          <div class="text-xs text-zinc-500 uppercase">Shinies observed</div>
          <div class="text-3xl font-bold mt-1">⭐ {{ aggregate?.total_shinies_observed ?? '—' }}</div>
        </div>
        <div class="bg-surface-1 border border-surface-3 rounded-lg p-4">
          <div class="text-xs text-zinc-500 uppercase">Real shiny rate</div>
          <div class="text-3xl font-bold mt-1">{{ fmtPct(aggregate?.shiny_rate_observed) }}</div>
        </div>
      </div>
    </section>

    <!-- Leaderboard -->
    <section class="mb-12">
      <h2 class="text-sm uppercase tracking-wider text-zinc-500 mb-3">🏆 Leaderboard — total tokens</h2>
      <div class="bg-surface-1 border border-surface-3 rounded-lg overflow-hidden">
        <table class="w-full">
          <tbody>
            <tr
              v-for="(entry, i) in leaderboard?.top ?? []"
              :key="entry.anon_id"
              class="border-b border-surface-3 last:border-b-0 hover:bg-surface-2 transition"
            >
              <td class="px-4 py-3 text-2xl w-16 text-center">{{ rankPrefix(i + 1) }}</td>
              <td class="px-4 py-3">
                <div class="font-bold text-zinc-100">{{ trainerLabel(entry) }}</div>
              </td>
              <td class="px-4 py-3 text-right font-bold text-gold tabular-nums">
                {{ fmt(entry.value) }}
              </td>
              <td class="px-4 py-3 text-right text-zinc-400 text-sm">
                <span class="mr-1">{{ lineageEmoji[entry.lineage ?? ''] ?? '❓' }}</span>
                <span>{{ entry.lineage }}</span>
                <span class="ml-2 text-zinc-500">{{ entry.level === 0 ? '🥚' : `Lv.${entry.level}` }}</span>
                <span v-if="entry.is_shiny" class="ml-1 text-gold">✦</span>
              </td>
            </tr>
            <tr v-if="!(leaderboard?.top?.length)">
              <td colspan="4" class="px-4 py-12 text-center text-zinc-500">
                No trainer has submitted stats yet. Be the first :
                <code class="text-gold">/pokemon stats-share enable --confirm</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Active lineage distribution -->
    <section v-if="aggregate?.active_lineage_distribution && Object.keys(aggregate.active_lineage_distribution).length" class="mb-12">
      <h2 class="text-sm uppercase tracking-wider text-zinc-500 mb-3">🧬 Active lineages</h2>
      <div class="bg-surface-1 border border-surface-3 rounded-lg p-4 flex flex-wrap gap-3">
        <div
          v-for="(count, lineage) in aggregate.active_lineage_distribution"
          :key="lineage"
          class="px-3 py-2 bg-surface-2 rounded-md text-sm"
        >
          {{ lineageEmoji[lineage] ?? '❓' }} <span class="text-zinc-300">{{ lineage }}</span>
          <span class="ml-2 text-zinc-500 tabular-nums">{{ count }}</span>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center text-zinc-600 text-sm mt-16 pt-8 border-t border-surface-3">
      <p>
        ⚔️ Async battles, trades, and the full arena are coming in
        <a href="https://github.com/Benoit1108/claude-pokemon/blob/main/ROADMAP.md" class="text-gold hover:underline">
          Phase 2.3
        </a>
      </p>
      <p class="mt-2 text-xs">
        Privacy first · Anonymous IDs · No tracking · Open source
      </p>
    </footer>
  </main>
</template>
