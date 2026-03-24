// an example of a spec with exclusive test
// and if it is compatible with grep test tags
// https://github.com/bahmutov/cy-grep/issues/234

it('a', { tags: '@one' }, () => {
  // this test should never run
  expect(true).to.be.false
})

it.only('b', { tags: '@one' }, () => {})
