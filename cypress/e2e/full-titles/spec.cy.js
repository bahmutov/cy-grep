describe('parent', () => {
  context('child', () => {
    it('works 1', () => {})

    it('works 2', () => {})

    // do NOT run this test
    it('fails 3', () => {
      expect(false, 'this test fails and should be skipped').to.be.true
    })

    it('works 4', () => {})
  })
})
