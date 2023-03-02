module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  require('../../../src/plugin')(config)
  // IMPORTANT: return the config object
  return config
}
