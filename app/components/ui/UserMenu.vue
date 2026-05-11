<script setup lang="ts">
// Global header user menu (Sprint 3.6). Floating top-left so it doesn't
// fight the ColorModeToggle (top-right). Two states :
//
//   1. NOT PAIRED — small "🔗 Se connecter" pill linking to /pair
//   2. PAIRED — Pokéball-bordered sprite avatar of the active companion,
//      display_name + Lv, opens a dropdown : My profile / My trainer card /
//      Ladder / Live PvP / Unpair.
//
// The component is mounted globally in app.vue so it appears on every
// page. SSR-safe : useArenaSession reads from localStorage which is
// only available client-side ; the template gracefully renders an empty
// shell during SSR.

import { useArenaSession } from '~/composables/useArenaSession'
import { useTrainerProfile } from '~/composables/useTrainerProfile'
import { LINEAGE_LABELS, lineageAccent, lineageEmoji } from '~/utils/lineage'

const { session, isPaired, clear } = useArenaSession()
const { trainer } = useTrainerProfile()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const displayName = computed(() => {
  if (trainer.value?.display_name) return trainer.value.display_name
  if (session.value) return session.value.anon_id.slice(0, 8)
  return ''
})

const lineage = computed(() => trainer.value?.stats.active.lineage ?? null)
const level = computed(() => trainer.value?.stats.active.current_level ?? 0)
const isShiny = computed(() => trainer.value?.stats.active.is_shiny ?? false)
const accent = computed(() => lineageAccent(lineage.value))

const router = useRouter()

function unpair() {
  clear()
  open.value = false
  void router.push('/')
}

function goTo(path: string) {
  open.value = false
  void router.push(path)
}

// Close the dropdown when the user clicks outside or hits Escape.
function onDocClick(e: MouseEvent) {
  if (!menuRef.value) return
  if (!menuRef.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <ClientOnly>
    <div ref="menuRef" class="relative">
      <!-- NOT PAIRED — pill with dropdown offering signup OR pair (Sprint 4.2). -->
      <div v-if="!isPaired" class="relative">
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 rounded-full border surface-border surface-card surface-card-hover text-sm transition shadow"
          title="Créer un compte ou pair ton CLI"
          @click="open = !open"
        >
          <PokeballIcon size="sm" />
          <span class="text-secondary hidden sm:inline">Se connecter</span>
          <span
            class="text-xs text-muted transition-transform"
            :class="open ? 'rotate-180' : ''"
            aria-hidden="true"
            >▾</span
          >
        </button>
        <Transition name="menu-fade">
          <div
            v-if="open"
            class="absolute right-0 mt-2 w-64 card-elevated rounded-md py-1 z-50"
            role="menu"
          >
            <NuxtLink
              to="/signup"
              class="block px-3 py-2 text-sm surface-card-hover text-primary transition"
              role="menuitem"
              @click="open = false"
            >
              <div class="font-bold">🎮 Créer mon dresseur</div>
              <div class="text-xs text-muted">Pas besoin de CLI — joue tout de suite</div>
            </NuxtLink>
            <NuxtLink
              to="/pair"
              class="block px-3 py-2 text-sm surface-card-hover text-primary transition border-t surface-border"
              role="menuitem"
              @click="open = false"
            >
              <div class="font-bold">🔗 Pair mon CLI</div>
              <div class="text-xs text-muted">J'utilise déjà claude-pokemon en local</div>
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <!-- PAIRED — avatar + display_name + level + dropdown trigger -->
      <button
        v-else
        type="button"
        class="flex items-center gap-2 px-2 py-1.5 rounded-full border surface-card surface-card-hover transition shadow user-menu-trigger"
        :style="{ borderColor: accent }"
        :title="`Connecté en tant que ${displayName}`"
        @click="open = !open"
      >
        <div class="relative w-9 h-9 flex items-center justify-center">
          <!-- Pokéball-ish ring around the sprite, tinted by lineage accent -->
          <div
            class="absolute inset-0 rounded-full border-2"
            :style="{ borderColor: accent, boxShadow: `0 0 12px ${accent}55` }"
            aria-hidden="true"
          />
          <PokemonSprite
            v-if="lineage"
            :lineage="lineage"
            :level="level"
            :is-shiny="isShiny"
            size="sm"
          />
          <span v-else class="text-lg" aria-hidden="true">🔗</span>
        </div>
        <div class="text-left pr-1 hidden sm:block">
          <div class="text-xs font-bold text-primary leading-tight max-w-[7rem] truncate">
            {{ displayName }}
          </div>
          <div class="text-[10px] text-secondary leading-tight tabular-nums">
            <span v-if="lineage">{{ lineageEmoji(lineage) }}</span>
            <span v-if="level > 0"> Lv.{{ level }}</span>
            <span v-else-if="lineage" class="text-muted">🥚 Egg</span>
          </div>
        </div>
        <span
          class="text-xs text-muted transition-transform"
          :class="open ? 'rotate-180' : ''"
          aria-hidden="true"
          >▾</span
        >
      </button>

      <!-- Dropdown menu -->
      <Transition name="menu-fade">
        <div
          v-if="isPaired && open"
          class="absolute right-0 mt-2 w-64 card-elevated rounded-md py-1 z-50"
          role="menu"
        >
          <div class="px-3 py-2 border-b surface-border">
            <div class="text-[10px] uppercase tracking-widest text-muted">Connecté</div>
            <div class="font-bold text-primary truncate">{{ displayName }}</div>
            <div class="text-xs text-secondary mt-0.5">
              <code class="text-muted">{{ session?.anon_id }}</code>
            </div>
            <div v-if="lineage" class="text-xs text-secondary mt-1">
              {{ lineageEmoji(lineage) }} {{ LINEAGE_LABELS[lineage] }} ·
              {{ level === 0 ? '🥚 Egg' : `Lv.${level}` }}
              <span v-if="isShiny" class="text-accent">✦</span>
            </div>
          </div>

          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm surface-card-hover text-primary transition"
            role="menuitem"
            @click="goTo('/profile')"
          >
            👤 Mon profil
          </button>
          <button
            v-if="session"
            type="button"
            class="block w-full text-left px-3 py-2 text-sm surface-card-hover text-primary transition"
            role="menuitem"
            @click="goTo(`/trainer/${session.anon_id}`)"
          >
            🪪 Ma trainer card (publique)
          </button>
          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm surface-card-hover text-primary transition"
            role="menuitem"
            @click="goTo('/arena')"
          >
            ⚔️ Arena PvP
          </button>
          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm surface-card-hover text-primary transition"
            role="menuitem"
            @click="goTo('/ladder')"
          >
            🤖 Ladder PvE
          </button>
          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm surface-card-hover text-primary transition"
            role="menuitem"
            @click="goTo('/zones')"
          >
            🗺️ Zones sauvages
          </button>
          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm surface-card-hover text-primary transition"
            role="menuitem"
            @click="goTo('/pair')"
          >
            🔗 Gérer le pairing
          </button>

          <div class="border-t surface-border my-1" />

          <button
            type="button"
            class="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
            role="menuitem"
            @click="unpair"
          >
            🚪 Déconnecter ce navigateur
          </button>
        </div>
      </Transition>
    </div>
  </ClientOnly>
</template>

<style scoped>
.user-menu-trigger {
  background: rgba(255, 255, 255, 0.02);
}
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
