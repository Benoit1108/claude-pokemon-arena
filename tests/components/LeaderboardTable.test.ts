// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LeaderboardTable from '~/components/leaderboard/LeaderboardTable.vue'
import type { LeaderboardEntry } from '~/types/api'

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    anon_id: 'c5bbdea6',
    display_name: 'benoit1108',
    value: 2_638_000,
    lineage: 'fire',
    level: 0,
    is_shiny: false,
    submitted_at: '2026-05-06T10:00:00Z',
    ...overrides,
  }
}

describe('<LeaderboardTable />', () => {
  it('renders empty-state row when no entries', () => {
    const wrapper = mount(LeaderboardTable, { props: { entries: [] } })
    expect(wrapper.text()).toContain('No trainer has submitted stats yet')
  })

  it('renders 1 row per entry with rank prefix', () => {
    const entries = [
      entry({ anon_id: 'aaa11111', value: 1000 }),
      entry({ anon_id: 'bbb22222', value: 500 }),
    ]
    const wrapper = mount(LeaderboardTable, { props: { entries } })

    const rows = wrapper.findAll('tbody tr')
    // 2 entries + 0 empty-state row (only rendered when entries.length === 0)
    expect(rows).toHaveLength(2)
    expect(rows[0]?.text()).toContain('🥇')
    expect(rows[1]?.text()).toContain('🥈')
  })

  it('renders pseudo#shortid label when display_name set', () => {
    const wrapper = mount(LeaderboardTable, { props: { entries: [entry()] } })
    expect(wrapper.text()).toContain('benoit1108#c5bb')
  })

  it('renders raw anon_id when display_name is null', () => {
    const wrapper = mount(LeaderboardTable, {
      props: { entries: [entry({ display_name: null, anon_id: 'deadbeef' })] },
    })
    expect(wrapper.text()).toContain('deadbeef')
    expect(wrapper.text()).not.toContain('#dead')
  })

  it('renders 🥚 for level 0, Lv.X otherwise', () => {
    const wrapper = mount(LeaderboardTable, {
      props: {
        entries: [
          entry({ anon_id: 'aaa11111', level: 0 }),
          entry({ anon_id: 'bbb22222', level: 30 }),
        ],
      },
    })
    expect(wrapper.text()).toContain('🥚')
    expect(wrapper.text()).toContain('Lv.30')
  })

  it('renders shiny mark ✦ when is_shiny=true', () => {
    const wrapper = mount(LeaderboardTable, {
      props: { entries: [entry({ is_shiny: true })] },
    })
    expect(wrapper.text()).toContain('✦')
  })

  it('renders custom title prop', () => {
    const wrapper = mount(LeaderboardTable, {
      props: { entries: [], title: 'Top shinies' },
    })
    expect(wrapper.text()).toContain('Top shinies')
  })
})
