/// <reference types="cypress" />

// the standard list of tests we run

it('hello world', () => {})

it('works', () => {})

it('works 2 @tag1', { tags: '@tag1' }, () => {})

it('works 2 @tag1 @tag2', { tags: ['@tag1', '@tag2'] }, () => {
  // confirm we have test tags
  expect(Cypress.env('testTags'), 'test tags').to.deep.equal(['@tag1', '@tag2'])
})

it('works @tag2', { tags: '@tag2' }, () => {})

// a failed test if needed
// comment out when done
// describe('a failing suite', () => {
//   it('bad test', () => {
//     expect(false).to.be.true
//   })
// })
