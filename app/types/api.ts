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
  submitted_at: string
  client_version: string
  stats: PlayerStats
}
