/// <reference path="../../../src/index.d.ts" />

describe('clean', () => {
  it('old data', { requiredTags: '@nightly' }, () => {
    // pretend we are deleting old test data
    cy.wait(5000)
  })
})
