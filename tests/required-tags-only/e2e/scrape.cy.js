/// <reference types="@bahmutov/cy-grep" />

describe('scrape', () => {
  it('scrapes the blog', { requiredTags: '@scrape' }, () => {
    // pretend we are scraping the blog posts
    cy.wait(5000)
  })
})
