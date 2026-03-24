// @ts-check
const debug = require('debug')('cy-grep')

const { getSpecs } = require('find-cypress-specs')
const { getTestNames, findEffectiveTestTags } = require('find-test-names')
const fs = require('fs')
const { version } = require('../package.json')
const { parseGrep, shouldTestRun, getMentionedTags } = require('./utils')
const { resolveFilePatterns } = require('./file-utils')
const { minimatch } = require('minimatch')

const MINIMATCH_OPTIONS = { dot: true, matchBase: true }

function getGrepSettings(config) {
  const { env, expose } = config

  debug('cy-grep plugin version %s', version)
  debug('Cypress config env object: %o', expose)

  const grepStringMaybe = env.grep || expose.grep
  const grep = grepStringMaybe ? String(grepStringMaybe) : undefined

  if (grep) {
    console.log('cy-grep: tests with "%s" in their names', grep.trim())
  }

  const grepPrefixAt =
    env.grepPrefixAt ||
    env['grep-prefix-at'] ||
    expose.grepPrefixAt ||
    expose['grep-prefix-at']

  const grepTags =
    env.grepTags || env['grep-tags'] || expose.grepTags || expose['grep-tags']

  if (grepTags) {
    console.log('cy-grep: filtering using tag(s) "%s"', grepTags)
    const parsedGrep = parseGrep(null, grepTags, grepPrefixAt)

    debug('parsed grep tags %o', parsedGrep.tags)
  }

  const grepBurn =
    env.grepBurn ||
    env['grep-burn'] ||
    env.burn ||
    expose.grepBurn ||
    expose['grep-burn'] ||
    expose.burn

  if (grepBurn) {
    console.log('cy-grep: running filtered tests %d times', grepBurn)
  }

  const grepUntagged =
    env.grepUntagged ||
    env['grep-untagged'] ||
    expose.grepUntagged ||
    expose['grep-untagged']

  if (grepUntagged) {
    console.log('cy-grep: running untagged tests')
  }

  const omitFiltered =
    env.grepOmitFiltered ||
    env['grep-omit-filtered'] ||
    expose.grepOmitFiltered ||
    expose['grep-omit-filtered']

  if (omitFiltered) {
    console.log('cy-grep: will omit filtered tests')
  }

  const grepFilterSpecs =
    env.grepFilterSpecs === true || expose.grepFilterSpecs === true

  if (grepPrefixAt) {
    console.log('cy-grep: all tags will be forced to start with @')
  }

  // expose the collected config values
  // so that the browser support code can use them
  config.expose = config.expose || {}
  config.expose.grep = grep
  config.expose.grepTags = grepTags
  config.expose.grepBurn = grepBurn
  config.expose.grepUntagged = grepUntagged
  config.expose.grepOmitFiltered = omitFiltered
  config.expose.grepFilterSpecs = grepFilterSpecs
  config.expose.grepPrefixAt = grepPrefixAt

  return { grep, grepTags, grepFilterSpecs, grepPrefixAt }
}

/**
 * Prints the cy-grep environment values if any.
 * @param {Cypress.ConfigOptions} config
 */
function cypressGrepPlugin(config) {
  if (arguments.length === 0) {
    throw new Error(
      'ERROR: forgot the config file, see https://github.com/bahmutov/cy-grep',
    )
  }
  if (arguments.length > 1) {
    throw new Error(
      'ERROR: too many arguments, see https://github.com/bahmutov/cy-grep',
    )
  }

  if (!config || !config.expose) {
    return config
  }

  const { grep, grepTags, grepFilterSpecs, grepPrefixAt } =
    getGrepSettings(config)

  if (grepFilterSpecs) {
    let specFiles = getSpecs(config)

    debug('found %d spec file(s)', specFiles.length)
    debug('%o', specFiles)
    // grab spec parameter from "env" or "expose"
    const specPattern =
      config.env?.grepSpec ||
      config.env?.grepSpecs ||
      config.expose?.grepSpec ||
      config.expose?.grepSpecs
    if (specPattern) {
      debug('custom spec pattern: %s', specPattern)
      // https://github.com/bahmutov/cy-grep/issues/33
      // the user set a custom "--spec <...>" parameter to select specs to run
      // so we need to pre-filter all found specFiles
      specFiles = specFiles.filter((specFilename) =>
        minimatch(specFilename, specPattern, MINIMATCH_OPTIONS),
      )
      debug('pre-filtered specs %d %o', specFiles.length, specFiles)
    }

    let greppedSpecs = []

    if (grep) {
      console.log('cy-grep: filtering specs using "%s" in the test title', grep)
      const parsedGrep = parseGrep(grep, undefined, grepPrefixAt)

      debug('parsed grep %o', parsedGrep)
      greppedSpecs = specFiles.filter((specFile) => {
        const text = fs.readFileSync(specFile, { encoding: 'utf8' })

        try {
          const result = getTestNames(text, true)
          const testNames = result.fullTestNames

          debug('spec file %s', specFile)
          debug('full test names: %o', testNames)

          return testNames.some((name) => {
            const shouldRun = shouldTestRun(parsedGrep, name)

            return shouldRun
          })
        } catch (err) {
          debug(err.message)
          debug(err.stack)
          console.error('Could not determine test names in file: %s', specFile)
          console.error('Will run it to let the grep filter the tests')

          return true
        }
      })

      debug('found grep "%s" in %d specs', grep, greppedSpecs.length)
      debug('%o', greppedSpecs)
    } else if (grepTags) {
      const parsedGrep = parseGrep(null, grepTags, grepPrefixAt)
      debug('parsed grep tags %o', parsedGrep)
      const mentionedTags = getMentionedTags(grepTags, grepPrefixAt)
      debug('user mentioned tags %o', mentionedTags)
      // unique tags found across all specs we search
      const foundTags = new Set()

      greppedSpecs = specFiles.filter((specFile) => {
        const text = fs.readFileSync(specFile, { encoding: 'utf8' })

        try {
          const testTags = findEffectiveTestTags(text)
          // we get back a single object with keys being full test titles
          // and the values being arrays of effective test tags
          debug('spec file %s', specFile)
          debug('effective test tags %o', testTags)

          // remember all found tags
          Object.entries(testTags).forEach(([testTitle, tags]) => {
            tags.effectiveTags.forEach((tag) => {
              foundTags.add(tag)
            })
            tags.requiredTags.forEach((tag) => {
              foundTags.add(tag)
            })
          })

          return Object.keys(testTags).some((testTitle) => {
            const effectiveTags = testTags[testTitle].effectiveTags
            const requiredTags = testTags[testTitle].requiredTags

            return shouldTestRun(
              parsedGrep,
              undefined,
              effectiveTags,
              false,
              requiredTags,
            )
          })
        } catch (err) {
          console.error('Could not determine test names in file: %s', specFile)
          console.error('Will run it to let the grep filter the tests')

          return true
        }
      })

      debug('found grep tags "%s" in %d specs', grepTags, greppedSpecs.length)
      debug('%o', greppedSpecs)

      debug('all found tags across the specs %o', ...foundTags)
      debug('user mentioned tags %o', mentionedTags)
      mentionedTags.forEach((tag) => {
        if (!foundTags.has(tag)) {
          console.warn(
            'cy-grep: could not find the tag "%s" in any of the specs',
            tag,
          )
        }
      })
    } else {
      // we have no tags to grep
      debug('will try eliminating specs with required tags')

      greppedSpecs = specFiles.filter((specFile) => {
        const text = fs.readFileSync(specFile, { encoding: 'utf8' })

        try {
          const testTags = findEffectiveTestTags(text)
          debug('spec file %s', specFile)
          debug('effective test tags %o', testTags)
          // eliminate all tests with required tags, since we have no tags right now
          const testsWithoutRequiredTags = Object.keys(testTags).filter(
            (testTitle) => {
              return testTags[testTitle].requiredTags.length === 0
            },
          )
          // if there are any tests remaining, we should run this spec
          // (we should not run empty specs where all tests have required tags)
          return testsWithoutRequiredTags.length
        } catch (err) {
          console.error('Could not determine test names in file: %s', specFile)
          console.error('Will run it to let the grep filter the tests')

          return true
        }
      })
    }

    // grab the extra specs from either "env" or "expose" objects
    const extraSpecsPattern =
      config.env?.grepExtraSpecs || config.expose?.grepExtraSpecs
    if (extraSpecsPattern) {
      debug('processing the extra specs pattern "%s"', extraSpecsPattern)
      const extraSpecs = resolveFilePatterns(extraSpecsPattern)
      // update the config env object with resolved extra specs
      const resolvedExtraSpecs = []
      extraSpecs.forEach((specFilename) => {
        if (!greppedSpecs.includes(specFilename)) {
          greppedSpecs.push(specFilename)
          resolvedExtraSpecs.push(specFilename)
          debug('added extra spec %s', specFilename)
        }
      })

      config.expose.grepExtraSpecs = resolvedExtraSpecs
    }

    if (greppedSpecs.length) {
      debug('setting selected %d specs (>= v10)', greppedSpecs.length)
      // @ts-ignore
      config.specPattern = greppedSpecs
    } else {
      // hmm, we filtered out all specs, probably something is wrong
      console.warn('cy-grep: grep and/or grepTags has eliminated all specs')
      grep ? console.warn('cy-grep: title: %s', grep) : null
      grepTags ? console.warn('cy-grep: tags: %s', grepTags) : null
      console.warn('cy-grep: Will leave all specs to run to filter at run-time')
    }
  }

  return config
}

module.exports = cypressGrepPlugin
