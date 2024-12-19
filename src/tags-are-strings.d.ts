/// <reference types="cypress" />

// default types for test "tags" and "requiredTags" properties
// tags could be a single string or an array of strings
// see https://github.com/bahmutov/cy-grep?tab=readme-ov-file#typescript-support

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
}
