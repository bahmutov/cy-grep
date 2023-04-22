// @ts-check
const debug = require('debug')('cy-grep')

const { getSpecs } = require('find-cypress-specs')
const { getTestNames, findEffectiveTestTags } = require('find-test-names')
const fs = require('fs')
const path = require('path')
const { version } = require('../package.json')
const { parseGrep, shouldTestRun, getMentionedTags } = require('./utils')

const isCypressV9 = (config) => !('specPattern' in config)

function getGrepSettings(config) {
  const { env } = config

  debug('cy-grep plugin version %s', version)
  debug('Cypress config env object: %o', env)

  const grep = env.grep ? String(env.grep) : undefined

  if (grep) {
    console.log('cy-grep: tests with "%s" in their names', grep.trim())
  }

  const grepPrefixAt = env.grepPrefixAt || env['grep-prefix-at']

  const grepTags = env.grepTags || env['grep-tags']

  if (grepTags) {
    console.log('cy-grep: filtering using tag(s) "%s"', grepTags)
    const parsedGrep = parseGrep(null, grepTags, grepPrefixAt)

    debug('parsed grep tags %o', parsedGrep.tags)
  }

  const grepBurn = env.grepBurn || env['grep-burn'] || env.burn

  if (grepBurn) {
    console.log('cy-grep: running filtered tests %d times', grepBurn)
  }

  const grepUntagged = env.grepUntagged || env['grep-untagged']

  if (grepUntagged) {
    console.log('cy-grep: running untagged tests')
  }

  const omitFiltered = env.grepOmitFiltered || env['grep-omit-filtered']

  if (omitFiltered) {
    console.log('cy-grep: will omit filtered tests')
  }

  const grepFilterSpecs = env.grepFilterSpecs === true

  if (grepPrefixAt) {
    console.log('cy-grep: all tags will be forced to start with @')
  }

  return { grep, grepTags, grepFilterSpecs, grepPrefixAt }
}

/**
 * Prints the cy-grep environment values if any.
 * @param {Cypress.ConfigOptions} config
 */
function cypressGrepPlugin(config) {
  if (!config || !config.env) {
    return config
  }

  const { grep, grepTags, grepFilterSpecs, grepPrefixAt } =
    getGrepSettings(config)

  if (grepFilterSpecs) {
    const specFiles = getSpecs(config)

    debug('found %d spec files', specFiles.length)
    debug('%o', specFiles)
    let greppedSpecs = []

    if (grep) {
      console.log('cy-grep: filtering specs using "%s" in the title', grep)
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
          return Object.keys(testTags).some((testTitle) => {
            const effectiveTags = testTags[testTitle].effectiveTags
            const requiredTags = testTags[testTitle].requiredTags

            // remember all found tags
            effectiveTags.forEach((tag) => {
              foundTags.add(tag)
            })
            requiredTags.forEach((tag) => {
              foundTags.add(tag)
            })

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

    if (greppedSpecs.length) {
      if (isCypressV9(config)) {
        debug('setting selected %d specs (< v10)', greppedSpecs.length)
        // @ts-ignore
        const integrationFolder = config.integrationFolder
        const relativeNames = greppedSpecs.map((filename) =>
          path.relative(integrationFolder, filename),
        )
        const relativeSpecs = relativeNames.join(', ')
        debug(
          'specs in the integration folder %s %s',
          integrationFolder,
          relativeSpecs,
        )
        // @ts-ignore
        config.testFiles = relativeNames
      } else {
        debug('setting selected %d specs (>= v10)', greppedSpecs.length)
        // @ts-ignore
        config.specPattern = greppedSpecs
      }
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
