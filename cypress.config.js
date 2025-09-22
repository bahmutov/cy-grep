const { defineConfig } = require('cypress')

module.exports = defineConfig({
  // testing a bug
  // https://github.com/bahmutov/cy-grep/issues/203
  experimentalStudio: true,
  e2e: {
    defaultCommandTimeout: 1000,
    setupNodeEvents(on, config) {
      require('./src/plugin')(config)

      return config
    },
    specPattern: 'cypress/**/spec.js',
  },
  env: {
    // set different values for testing
    // https://github.com/bahmutov/cy-grep/issues/138
    // grepFilterSpecs: true,
    // grepOmitFiltered: true,
  },
  fixturesFolder: false,
  video: false,
  browser: 'electron',
})
