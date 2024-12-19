/// <reference types="cypress" />

declare namespace Cypress {
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
