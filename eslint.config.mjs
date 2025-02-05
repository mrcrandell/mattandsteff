import { createConfigForNuxt } from '@nuxt/eslint-config'

export default createConfigForNuxt({
  // options here
})
  .prepend(
    // ...Prepend some flat configs in front
  )
  // Override some rules in a specific config, based on their name
  .override('nuxt/typescript', {
    rules: {
      semi: ['always'],
    },
    ignores: ['**/vendor/**'],
  });
