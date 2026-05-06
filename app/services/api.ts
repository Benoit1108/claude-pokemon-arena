// Raw HTTP service layer for the claude-pokemon Worker API.
// Pure functions — no Vue dependencies. Composables wrap these.

import type {
  AggregateResponse,
  LeaderboardMetric,
  LeaderboardResponse,
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
}
