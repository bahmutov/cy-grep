/// <reference types="@bahmutov/cy-grep" />

describe('clean', () => {
  it('old data', { requiredTags: '@nightly' }, () => {
    // pretend we are deleting old test data
    cy.wait(5000)
  })
})
