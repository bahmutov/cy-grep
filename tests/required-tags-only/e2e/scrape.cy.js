/// <reference path="../../../src/index.d.ts" />

describe('scrape', () => {
  it('scrapes the blog', { requiredTags: '@scrape' }, () => {
    // pretend we are scraping the blog posts
    cy.wait(5000)
  })
})
