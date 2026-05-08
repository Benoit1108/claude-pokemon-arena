// Tracks whether this browser is paired with a CLI install (Sprint 2.12).
// Pairing is set by /pair after a successful redeem, cleared via clear().
// localStorage entry shape : { anon_id, arena_secret, paired_at: ISO string }.
//
// All consumers should treat the secret as confidential — it's used as the
// Bearer token for /v1/arena/* mutating endpoints.

const STORAGE_KEY = 'arena-session-v1'

export interface ArenaSession {
  anon_id: string
  arena_secret: string
  paired_at: string
}

function readStorage(): ArenaSession | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ArenaSession>
    if (
      typeof parsed.anon_id === 'string' &&
      typeof parsed.arena_secret === 'string' &&
      typeof parsed.paired_at === 'string'
    ) {
      return parsed as ArenaSession
    }
    return null
  } catch {
    return null
  }
}

// Module-level ref so all consumers share the same reactive state across the
// page. Initial read is deferred to onMounted to avoid SSR mismatch.
const session = ref<ArenaSession | null>(null)
let initialized = false

export function useArenaSession() {
  if (!initialized && typeof localStorage !== 'undefined') {
    session.value = readStorage()
    initialized = true
  }

  function set(s: ArenaSession): void {
    session.value = s
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      } catch {
        /* quota / disabled — fail silent, in-memory state still works */
      }
    }
  }

  function clear(): void {
    session.value = null
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
  }

  const isPaired = computed(() => session.value !== null)

  return {
    session,
    isPaired,
    set,
    clear,
  }
}
