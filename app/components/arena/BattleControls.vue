<script setup lang="ts">
import type { PlaybackSpeed } from '~/composables/useBattlePlayer'

defineProps<{
  isPlaying: boolean
  isFinished: boolean
  speed: PlaybackSpeed
  progress: number
  totalTurns: number
  currentTurnIdx: number
  soundEnabled: boolean
}>()

const emit = defineEmits<{
  toggle: []
  skipToEnd: []
  restart: []
  setSpeed: [speed: PlaybackSpeed]
  toggleSound: []
}>()

const speeds: PlaybackSpeed[] = [0.5, 1, 2, 4]
</script>

<template>
  <div class="surface-card border surface-border rounded-lg p-3 mb-4">
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="px-3 py-1.5 text-sm font-medium border surface-border rounded-md surface-card-hover transition text-primary min-w-[88px]"
        @click="emit('toggle')"
      >
        <span v-if="isFinished">↻ Replay</span>
        <span v-else-if="isPlaying">⏸ Pause</span>
        <span v-else>▶ Play</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-sm border surface-border rounded-md surface-card-hover transition text-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="isFinished"
        @click="emit('skipToEnd')"
      >
        ⏭ Skip
      </button>

      <button
        v-if="!isFinished"
        type="button"
        class="px-3 py-1.5 text-sm border surface-border rounded-md surface-card-hover transition text-secondary"
        @click="emit('restart')"
      >
        ⏮ Restart
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-sm border surface-border rounded-md surface-card-hover transition"
        :class="soundEnabled ? 'text-accent' : 'text-muted'"
        :title="soundEnabled ? 'Sound on (click to mute)' : 'Sound off (click to enable)'"
        @click="emit('toggleSound')"
      >
        {{ soundEnabled ? '🔊' : '🔇' }}
      </button>

      <div class="flex items-center gap-1.5 ml-auto">
        <span class="text-xs text-muted uppercase tracking-wider">Speed</span>
        <div class="flex gap-1">
          <button
            v-for="s in speeds"
            :key="s"
            type="button"
            class="px-2 py-1 text-xs font-mono border surface-border rounded-md transition"
            :class="
              speed === s
                ? 'bg-accent text-zinc-900 border-accent font-bold'
                : 'surface-card-hover text-secondary'
            "
            @click="emit('setSpeed', s)"
          >
            {{ s }}×
          </button>
        </div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mt-3">
      <div class="flex justify-between text-xs text-muted mb-1">
        <span class="tabular-nums">
          Turn {{ Math.max(0, currentTurnIdx + 1) }} / {{ totalTurns }}
        </span>
        <span class="tabular-nums">{{ Math.round(progress * 100) }}%</span>
      </div>
      <div class="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-accent transition-all duration-300 ease-out"
          :style="{ width: `${progress * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>
