// @ts-check
/// <reference path="./index.d.ts" />

const { parseGrep, shouldTestRun } = require('./utils')
// @ts-ignore
const { version } = require('../package.json')
const {
  getPluginConfigValue,
  setPluginConfigValue,
} = require('cypress-plugin-config')
// to debug in the browser, set the "localStorage.debug='cy-grep'"
const debug = require('debug')('cy-grep')

debug.log = console.info.bind(console)

// preserve the real "it" function
const _it = it
const _describe = describe
// keeps all collected test tags by the full test title
// includes both the test tags and the suite tags
// and the required test tags
const testTree = {}

beforeEach(() => {
  // set the test tags for the current test
  const testTitle = Cypress.currentTest.titlePath.join(' ')
  const info = testTree[testTitle]
  if (info) {
    const allTags = info.effectiveTestTags.concat(info.requiredTestTags)
    Cypress.env('testTags', allTags)
  } else {
    Cypress.env('testTags', null)
  }
})

/**
 * Wraps the "it" and "describe" functions that support tags.
 * @see https://github.com/bahmutov/cy-grep
 */
function registerCyGrep() {
  /** @type {string} Part of the test title go grep */
  let grep = getPluginConfigValue('grep')

  if (grep) {
    grep = String(grep).trim()
  }

  /** @type {string} Raw tags to grep string */
  const grepTags =
    getPluginConfigValue('grepTags') || getPluginConfigValue('grep-tags')

  const burnSpecified =
    getPluginConfigValue('grepBurn') ||
    getPluginConfigValue('grep-burn') ||
    getPluginConfigValue('burn')

  const grepUntagged =
    getPluginConfigValue('grepUntagged') ||
    getPluginConfigValue('grep-untagged')

  // if (!grep && !grepTags && !burnSpecified && !grepUntagged) {
  // nothing to do, the user has no specified the "grep" string
  // debug('Nothing to grep, version %s', version)

  // return
  // }

  /** @type {number} Number of times to repeat each running test */
  const grepBurn =
    getPluginConfigValue('grepBurn') ||
    getPluginConfigValue('grep-burn') ||
    getPluginConfigValue('burn') ||
    1

  /** @type {boolean} Omit filtered tests completely */
  const omitFiltered =
    getPluginConfigValue('grepOmitFiltered') ||
    getPluginConfigValue('grep-omit-filtered')

  const grepPrefixAt =
    getPluginConfigValue('grepPrefixAt') ||
    getPluginConfigValue('grep-prefix-at')

  debug('grep %o', {
    grep,
    grepTags,
    grepBurn,
    omitFiltered,
    grepPrefixAt,
    version,
  })
  if (!Cypress._.isInteger(grepBurn) || grepBurn < 1) {
    throw new Error(`Invalid grep burn value: ${grepBurn}`)
  }

  const parsedGrep = parseGrep(grep, grepTags, grepPrefixAt)

  debug('parsed grep %o', parsedGrep)

  // prevent multiple registrations
  if (it.name === 'itGrep') {
    debug('already registered cy-grep')

    return
  }

  it = function itGrep(name, options, callback) {
    if (typeof options === 'function') {
      // the test has format it('...', cb)
      callback = options
      options = {}
    }

    if (!callback) {
      // the pending test by itself
      return _it(name, options)
    }

    let configTags = options && options.tags
    if (typeof configTags === 'string') {
      configTags = [configTags]
    }
    let configRequiredTags = options && options.requiredTags
    if (typeof configRequiredTags === 'string') {
      configRequiredTags = [configRequiredTags]
    }

    const nameToGrep = suiteStack
      .map((item) => item.name)
      .concat(name)
      .join(' ')
    const effectiveTestTags = suiteStack
      .flatMap((item) => item.tags)
      .concat(configTags)
      .filter(Boolean)
    const requiredTestTags = suiteStack
      .flatMap((item) => item.requiredTags)
      .concat(configRequiredTags)
      .filter(Boolean)
    debug({ nameToGrep, effectiveTestTags, requiredTestTags })
    testTree[nameToGrep] = { effectiveTestTags, requiredTestTags }

    const shouldRun = shouldTestRun(
      parsedGrep,
      nameToGrep,
      effectiveTestTags,
      grepUntagged,
      requiredTestTags,
    )

    if (effectiveTestTags && effectiveTestTags.length) {
      debug(
        'should test "%s" with tags %s run? %s',
        name,
        effectiveTestTags.join(','),
        shouldRun,
      )
    } else {
      debug('should test without tags "%s" run? %s', nameToGrep, shouldRun)
    }

    if (shouldRun) {
      if (grepBurn > 1) {
        // repeat the same test to make sure it is solid
        return Cypress._.times(grepBurn, (k) => {
          const fullName = `${name}: burning ${k + 1} of ${grepBurn}`

          _it(fullName, options, callback)
        })
      }

      return _it(name, options, callback)
    }

    if (omitFiltered) {
      // omit the filtered tests completely
      return
    }

    // skip tests without grep string in their names
    return _it.skip(name, options, callback)
  }

  // list of "describe" suites for the current test
  // when we encounter a new suite, we push it to the stack
  // when the "describe" function exits, we pop it
  // Thus a test can look up the tags from its parent suites
  const suiteStack = []

  describe = function describeGrep(name, options, callback) {
    if (typeof options === 'function') {
      // the block has format describe('...', cb)
      callback = options
      options = {}
    }

    const stackItem = { name }

    suiteStack.push(stackItem)

    if (!callback) {
      // the pending suite by itself
      const result = _describe(name, options)

      suiteStack.pop()

      return result
    }

    let configTags = options && options.tags
    if (typeof configTags === 'string') {
      configTags = [configTags]
    }
    let requiredTags = options && options.requiredTags
    if (typeof requiredTags === 'string') {
      requiredTags = [requiredTags]
    }

    if (!configTags || !configTags.length) {
      if (!requiredTags || !requiredTags.length) {
        // if the describe suite does not have explicit tags
        // move on, since the tests inside can have their own tags
        _describe(name, options, callback)
        suiteStack.pop()

        return
      }
    }

    // when looking at the suite of the tests, I found
    // that using the name is quickly becoming very confusing
    // and thus we need to use the explicit tags
    stackItem.tags = configTags
    stackItem.requiredTags = requiredTags
    debug('stack item', stackItem)

    _describe(name, options, callback)
    suiteStack.pop()

    return
  }

  // overwrite "context" which is an alias to "describe"
  context = describe

  // overwrite "specify" which is an alias to "it"
  specify = it

  // keep the ".skip", ".only" methods the same as before
  it.skip = _it.skip
  it.only = _it.only
  // preserve "it.each" method if found
  if (typeof _it.each === 'function') {
    it.each = _it.each
  }

  describe.skip = _describe.skip
  describe.only = _describe.only
  if (typeof _describe.each === 'function') {
    describe.each = _describe.each
  }
}

function restartTests() {
  setTimeout(() => {
    window.top.document.querySelector('.reporter .restart').click()
  }, 0)
}

if (!Cypress.grep) {
  /**
   * A utility method to set the grep and run the tests from
   * the DevTools console. Restarts the test runner
   * @example
   *  // run only the tests with "hello w" in the title
   *  Cypress.grep('hello w')
   *  // runs only tests tagged both "@smoke" and "@fast"
   *  Cypress.grep(null, '@smoke+@fast')
   *  // runs the grepped tests 100 times
   *  Cypress.grep('add items', null, 100)
   *  // remove all current grep settings
   *  // and run all tests
   *  Cypress.grep()
   */
  Cypress.grep = function grep(grep, tags, burn) {
    setPluginConfigValue('grep', grep)
    setPluginConfigValue('grepTags', tags)
    setPluginConfigValue('grepBurn', burn)
    // remove any aliased values
    setPluginConfigValue('grep-tags', null)
    setPluginConfigValue('grep-burn', null)
    setPluginConfigValue('burn', null)

    debug('set new grep to "%o" restarting tests', { grep, tags, burn })
    restartTests()
  }
}

if (!Cypress.grepFailed) {
  Cypress.grepFailed = function () {
    // @ts-ignore
    let root = Cypress.state('runnable')
    while (root.parent) {
      root = root.parent
    }
    const failedTestTitles = []

    function findFailedTests(suite) {
      suite.tests.forEach((test) => {
        if (test.state === 'failed') {
          // TODO use the full test title
          failedTestTitles.push(test.title)
        }
      })
      suite.suites.forEach((suite) => {
        findFailedTests(suite)
      })
    }
    findFailedTests(root)

    if (!failedTestTitles.length) {
      console.log('No failed tests found')
    } else {
      console.log('running only the failed tests')
      console.log(failedTestTitles)
      const grepTitles = failedTestTitles.join(';')
      // @ts-ignore
      Cypress.grep(grepTitles)
    }
  }
}

module.exports = registerCyGrep
