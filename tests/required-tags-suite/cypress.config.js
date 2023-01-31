const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: { grepFilterSpecs: true, grepOmitFiltered: true },
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents(on, config) {
      require('../../src/plugin')(config)
      return config
    },
    specPattern: 'e2e/*.cy.js',
    supportFile: './support/e2e.js',
  },
  fixturesFolder: false,
  video: false,
})
