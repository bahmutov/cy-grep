/// <reference types="cypress" />

declare namespace Cypress {
  interface SuiteConfigOverrides {
    /**
     * List of tags for this suite
     * @example a single tag
     *  describe('block with config tag', { tags: '@smoke' }, () => {})
     * @example multiple tags
     *  describe('block with config tag', { tags: ['@smoke', '@slow'] }, () => {})
     * @see https://github.com/bahmutov/cy-grep
     */
    tags?: string | string[]
    /**
     * Provide a tag or a list of tags that is required for this suite to run.
     * @example describe('mobile tests', { requiredTags: '@mobile' }, () => {})
     * @see https://github.com/bahmutov/cy-grep
     */
    requiredTags?: string | string[]
  }

  // specify additional properties in the TestConfig object
  // in our case we will add "tags" property
  interface TestConfigOverrides {
    /**
     * List of tags for this test
     * @example a single tag
     *  it('logs in', { tags: '@smoke' }, () => { ... })
     * @example multiple tags
     *  it('works', { tags: ['@smoke', '@slow'] }, () => { ... })
     * @see https://github.com/bahmutov/cy-grep
     */
    tags?: string | string[]
    /**
     * Provide a tag or a list of tags that is required for this test to run.
     * @example it('cleans the data', { requiredTags: '@nightly' }, () => {})
     * @see https://github.com/bahmutov/cy-grep
     */
    requiredTags?: string | string[]
  }

  interface Cypress {
    /**
     * Runs only the tests that contain the given "grep" string
     * in the title, or have specific tags.
     * @param grep Part of the test title
     * @param tags Tags to filter tests by
     * @param burn Number of times to repeat each test
     */
    grep?: (grep?: string, tags?: string, burn?: string) => void
    /**
     * Take the current test statuses and run only the failed tests.
     * Run this static method from the DevTools console.
     * Tip: use Cypress.grep() to reset and run all tests.
     * @example Cypress.grepFailed()
     */
    grepFailed?: () => void
  }
}
