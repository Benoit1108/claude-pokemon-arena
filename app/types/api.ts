// Contracts for the claude-pokemon Worker API.
// Mirrors api/src/types.ts on the worker side. Keep in sync manually
// (eventually : extract to a shared npm package).

export type LeaderboardMetric =
  | 'total_tokens'
  | 'total_evolutions'
  | 'total_shinies'
  | 'max_level'
  | 'lineages_completed_count'
  | 'badges_count'
  | 'games_won'
  | 'pokedex_seen_count'

export type Lineage =
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'eevee'
  | 'chikorita'
  | 'cyndaquil'
  | 'totodile'

export interface AggregateResponse {
  total_players: number
  total_tokens_combined?: number
  total_shinies_observed?: number
  shiny_rate_observed?: number | null
  active_lineage_distribution?: Record<string, number>
}

export interface LeaderboardEntry {
  anon_id: string
  display_name: string | null
  value: number
  lineage: Lineage | null
  level: number
  is_shiny: boolean
  submitted_at: string
}

export interface LeaderboardResponse {
  metric: string
  total_players: number
  top: LeaderboardEntry[]
}

export interface LifetimeStats {
  total_tokens: number
  total_evolutions: number
  total_shinies: number
  max_level: number
  total_compagnons: number
  lineages_completed: Lineage[]
  games_won: number
  games_played: number
}

export interface ActiveStats {
  lineage: Lineage | null
  current_level: number
  is_shiny: boolean
}

export interface PlayerStats {
  lifetime: LifetimeStats
  active: ActiveStats
  badges: string[]
  pokedex_seen_count: number
}

export interface TrainerResponse {
  anon_id: string
  display_name: string | null
  /** Public-facing trainer quote (≤80 chars), set via CLI `/pokemon quote`. */
  quote: string | null
  /** Multi-line trainer bio (≤160 chars, ≤4 lines), set via `/pokemon bio`. */
  bio: string | null
  /** Up to 3 badge ids the user pinned via `/pokemon pins set ...`. */
  pinned_badges: string[]
  submitted_at: string
  client_version: string
  stats: PlayerStats
}

// ---------------------------------------------------------------------------
// Arena (Sprint 2.3) — async PvP battles
// ---------------------------------------------------------------------------

export interface BattleParticipant {
  anon_id: string
  display_name: string | null
  lineage: Lineage
  level: number
  is_shiny: boolean
}

export type BattleSide = 'challenger' | 'defender'

export interface BattleTurn {
  turn: number
  actor: BattleSide
  damage: number
  effectiveness: number
  critical: boolean
  defender_hp_after: number
}

export interface BattleResult {
  battle_id: string | null
  challenger: BattleParticipant
  defender: BattleParticipant
  seed: number
  turns: BattleTurn[]
  winner: BattleSide | 'draw'
  reason: 'ko' | 'turn_limit'
  created_at: string
}

export interface ArenaOpponent {
  anon_id: string
  display_name: string | null
  lineage: Lineage
  level: number
  is_shiny: boolean
  updated_at: string
}

export interface OpponentsResponse {
  opponents: ArenaOpponent[]
  total: number
}

export const REACTION_KEYS = ['clap', 'fire', 'party', 'lol', 'tear', 'love'] as const
export type ReactionKey = (typeof REACTION_KEYS)[number]

export interface BattleResponse {
  battle: BattleResult
  /** Aggregated reaction counts (Sprint 2.8b). Optional for backward-compat. */
  reactions?: Record<ReactionKey, number>
}

// ---------------------------------------------------------------------------
// Live PvP (Sprint 2.10) — polling-based realtime view
// ---------------------------------------------------------------------------

export type LiveBattleState = 'pending' | 'active' | 'finished' | 'expired' | 'abandoned'

export interface LiveBattleSideView {
  anon_id: string
  snapshot: BattleParticipant | null
  hp: number | null
  has_pending_action: boolean
}

export interface LiveBattleView {
  battle_id: string
  state: LiveBattleState
  challenger: LiveBattleSideView
  defender: LiveBattleSideView
  turn_no: number
  turn_log: BattleTurn[]
  winner: BattleSide | 'draw' | null
  reason: 'ko' | 'turn_limit' | 'forfeit' | 'expired' | null
  created_at: string
  last_activity_at: string
  forfeit_by: BattleSide | null
}
