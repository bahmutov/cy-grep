/// <reference path="../../../src/index.d.ts" />

// the required tag should apply to both tests inside
describe('scrape', { requiredTags: '@scrape' }, () => {
  it('scrapes the blog 1', () => {
    // pretend we are scraping the blog posts
    cy.wait(1000)
  })

  it('scrapes the blog 2', () => {
    // pretend we are scraping the blog posts
    cy.wait(1000)
  })
})
