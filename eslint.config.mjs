// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Sprint 3 — exclude the vendored submodule. It's another repo's content,
  // owned + linted by claude-pokemon/. Editing it from here would create
  // divergence (the next `git submodule update --remote` would clobber).
  {
    ignores: ['vendor/**'],
  },
)
