// Typed wrappers around the claude-pokemon Worker API.
// Base URL is configured via runtimeConfig.public.apiBase (default points to
// https://claude-pokemon-api.benoit-dev.workers.dev — override via env var).

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
  lineage: string | null
  level: number
  is_shiny: boolean
  submitted_at: string
}

export interface LeaderboardResponse {
  metric: string
  total_players: number
  top: LeaderboardEntry[]
}

export type LeaderboardMetric =
  | 'total_tokens'
  | 'total_evolutions'
  | 'total_shinies'
  | 'max_level'
  | 'lineages_completed_count'
  | 'badges_count'
  | 'games_won'
  | 'pokedex_seen_count'

export const useApi = () => {
  const config = useRuntimeConfig()
  const base = config.public.apiBase

  return {
    aggregate: () => $fetch<AggregateResponse>('/v1/aggregate', { baseURL: base }),
    leaderboard: (metric: LeaderboardMetric = 'total_tokens', limit = 10) =>
      $fetch<LeaderboardResponse>('/v1/leaderboard', {
        baseURL: base,
        query: { metric, limit },
      }),
  }
}
