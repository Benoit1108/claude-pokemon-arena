// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PokedexCard from '~/components/pokedex/PokedexCard.vue'
import type { WildPokemon } from '~/types/pokedex'

const samplePikachu: WildPokemon = {
  id: 'pikachu',
  national_dex: 25,
  name_fr: 'Pikachu',
  name_en: 'Pikachu',
  type: 'Electric',
  emoji: '⚡',
  rarity: 'common',
}

const sampleMewtwo: WildPokemon = {
  id: 'mewtwo',
  national_dex: 150,
  name_fr: 'Mewtwo',
  name_en: 'Mewtwo',
  type: 'Psychic',
  emoji: '🧠',
  rarity: 'legendary',
}

const sampleTyranitar: WildPokemon = {
  id: 'tyranitar',
  national_dex: 248,
  name_fr: 'Tyranocif',
  name_en: 'Tyranitar',
  type: 'Rock',
  emoji: '🦖',
  rarity: 'rare',
}

describe('<PokedexCard />', () => {
  it('renders the FR name by default', () => {
    const wrapper = mount(PokedexCard, {
      props: { pokemon: { ...samplePikachu, name_fr: 'Pikachu', name_en: 'Pikachu-EN' } },
    })
    expect(wrapper.text()).toContain('Pikachu')
    expect(wrapper.text()).not.toContain('Pikachu-EN')
  })

  it('renders the EN name when lang="en"', () => {
    const wrapper = mount(PokedexCard, {
      props: {
        pokemon: { ...samplePikachu, name_fr: 'Pikachu-FR', name_en: 'PikachuEN' },
        lang: 'en',
      },
    })
    expect(wrapper.text()).toContain('PikachuEN')
    expect(wrapper.text()).not.toContain('Pikachu-FR')
  })

  it('renders padded national_dex (#001 ... #251)', () => {
    expect(
      mount(PokedexCard, { props: { pokemon: { ...samplePikachu, national_dex: 1 } } }).text(),
    ).toContain('#001')
    expect(
      mount(PokedexCard, { props: { pokemon: { ...samplePikachu, national_dex: 25 } } }).text(),
    ).toContain('#025')
    expect(
      mount(PokedexCard, { props: { pokemon: { ...samplePikachu, national_dex: 251 } } }).text(),
    ).toContain('#251')
  })

  it('renders the type label', () => {
    const wrapper = mount(PokedexCard, { props: { pokemon: samplePikachu } })
    expect(wrapper.text()).toContain('Electric')
  })

  it('does NOT render rarity label for common', () => {
    const wrapper = mount(PokedexCard, { props: { pokemon: samplePikachu } })
    expect(wrapper.text()).not.toContain('legendary')
    expect(wrapper.text()).not.toContain('rare')
  })

  it('renders ★ legendary for legendary Pokémon', () => {
    const wrapper = mount(PokedexCard, { props: { pokemon: sampleMewtwo } })
    expect(wrapper.text()).toContain('★ legendary')
  })

  it('renders ◆ rare for rare Pokémon', () => {
    const wrapper = mount(PokedexCard, { props: { pokemon: sampleTyranitar } })
    expect(wrapper.text()).toContain('◆ rare')
  })

  it('displays the emoji', () => {
    const wrapper = mount(PokedexCard, { props: { pokemon: samplePikachu } })
    expect(wrapper.text()).toContain('⚡')
  })
})
