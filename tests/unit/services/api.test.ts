import { describe, it, expect, vi } from 'vitest'
import { ApiClient } from '~/services/api'
import type { AggregateResponse, LeaderboardResponse, TrainerResponse } from '~/types/api'

describe('ApiClient', () => {
  function makeClient(mockResponse: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse)
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetchImpl: fetchMock as never,
    })
    return { client, fetchMock }
  }

  it('aggregate() calls /v1/aggregate with the configured baseURL', async () => {
    const expected: AggregateResponse = { total_players: 42 }
    const { client, fetchMock } = makeClient(expected)

    const result = await client.aggregate()

    expect(result).toEqual(expected)
    expect(fetchMock).toHaveBeenCalledWith('/v1/aggregate', { baseURL: 'https://example.test' })
  })

  it('leaderboard() passes default metric and limit', async () => {
    const expected: LeaderboardResponse = { metric: 'total_tokens', total_players: 0, top: [] }
    const { client, fetchMock } = makeClient(expected)

    await client.leaderboard()

    expect(fetchMock).toHaveBeenCalledWith('/v1/leaderboard', {
      baseURL: 'https://example.test',
      query: { metric: 'total_tokens', limit: 10 },
    })
  })

  it('leaderboard() respects custom metric and limit', async () => {
    const { client, fetchMock } = makeClient({ metric: 'max_level', total_players: 5, top: [] })

    await client.leaderboard('max_level', 3)

    expect(fetchMock).toHaveBeenCalledWith('/v1/leaderboard', {
      baseURL: 'https://example.test',
      query: { metric: 'max_level', limit: 3 },
    })
  })

  it('trainer() builds the path with the given anon_id', async () => {
    const expected: TrainerResponse = {
      anon_id: 'c5bbdea6',
      display_name: 'benoit1108',
      submitted_at: '2026-05-06T10:00:00Z',
      client_version: '1.0.0',
      stats: {
        lifetime: {
          total_tokens: 0,
          total_evolutions: 0,
          total_shinies: 0,
          max_level: 0,
          total_compagnons: 0,
          lineages_completed: [],
          games_won: 0,
          games_played: 0,
        },
        active: { lineage: null, current_level: 0, is_shiny: false },
        badges: [],
        pokedex_seen_count: 0,
      },
    }
    const { client, fetchMock } = makeClient(expected)

    const result = await client.trainer('c5bbdea6')

    expect(result.anon_id).toBe('c5bbdea6')
    expect(fetchMock).toHaveBeenCalledWith('/v1/trainer/c5bbdea6', {
      baseURL: 'https://example.test',
    })
  })

  it('propagates errors from the fetcher', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    const client = new ApiClient({ baseUrl: 'https://x', fetchImpl: fetchMock as never })

    await expect(client.aggregate()).rejects.toThrow('network down')
  })
})
