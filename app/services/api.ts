// Raw HTTP service layer for the claude-pokemon Worker API.
// Pure functions — no Vue dependencies. Composables wrap these.

import type {
  AggregateResponse,
  BattleResponse,
  LeaderboardMetric,
  LeaderboardResponse,
  LiveBattleView,
  OpponentsResponse,
  TrainerResponse,
} from '~/types/api'

export interface ApiClientConfig {
  baseUrl: string
  fetchImpl?: typeof $fetch
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly fetcher: typeof $fetch

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl
    this.fetcher = config.fetchImpl || $fetch
  }

  aggregate(): Promise<AggregateResponse> {
    return this.fetcher<AggregateResponse>('/v1/aggregate', { baseURL: this.baseUrl })
  }

  leaderboard(
    metric: LeaderboardMetric = 'total_tokens',
    limit = 10,
  ): Promise<LeaderboardResponse> {
    return this.fetcher<LeaderboardResponse>('/v1/leaderboard', {
      baseURL: this.baseUrl,
      query: { metric, limit },
    })
  }

  trainer(anonId: string): Promise<TrainerResponse> {
    return this.fetcher<TrainerResponse>(`/v1/trainer/${anonId}`, { baseURL: this.baseUrl })
  }

  arenaOpponents(limit = 50): Promise<OpponentsResponse> {
    return this.fetcher<OpponentsResponse>('/v1/arena/opponents', {
      baseURL: this.baseUrl,
      query: { limit },
    })
  }

  arenaBattle(battleId: string): Promise<BattleResponse> {
    return this.fetcher<BattleResponse>(`/v1/arena/battle/${battleId}`, {
      baseURL: this.baseUrl,
    })
  }

  arenaLive(battleId: string): Promise<LiveBattleView> {
    return this.fetcher<LiveBattleView>(`/v1/arena/live/${battleId}`, {
      baseURL: this.baseUrl,
    })
  }

  arenaPairRedeem(code: string): Promise<{ ok: true; anon_id: string; arena_secret: string }> {
    return this.fetcher('/v1/arena/pair/redeem', {
      method: 'POST',
      baseURL: this.baseUrl,
      body: { code },
    })
  }

  arenaLiveCommit(args: {
    battleId: string
    anonId: string
    moveId: string
    arenaSecret: string
  }): Promise<LiveBattleView & { ok: true }> {
    return this.fetcher(`/v1/arena/live/${args.battleId}/commit`, {
      method: 'POST',
      baseURL: this.baseUrl,
      headers: { authorization: `Bearer ${args.arenaSecret}` },
      body: { anon_id: args.anonId, move_id: args.moveId },
    })
  }
}
