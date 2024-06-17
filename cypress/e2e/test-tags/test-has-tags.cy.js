it('has no test tags', () => {
  const tags = Cypress.env('testTags')
  expect(tags, 'tags').to.deep.equal([])
})

describe('parent', { tags: ['@p1', '@p2'] }, () => {
  describe('child', { tags: '@c1' }, () => {
    it('has all effective test tags', { tags: '@t1' }, () => {
      const tags = Cypress.env('testTags')
      // includes tags from the parent suites and the test itself
      expect(tags, 'tags').to.deep.equal(['@p1', '@p2', '@c1', '@t1'])
    })
  })
})
