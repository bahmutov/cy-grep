/// <reference types="cypress" />

// the standard list of tests we run

it('hello world', () => {})

it('works', () => {})

it('works 2 @tag1', { tags: '@tag1' }, () => {})

it('works 2 @tag1 @tag2', { tags: ['@tag1', '@tag2'] }, () => {
  // confirm we have test tags
  expect(Cypress.env('testTags'), 'test tags').to.deep.equal(['@tag1', '@tag2'])
})

it('works @tag2', { tags: '@tag2' }, () => {
  const specTags = `{
    "hello world": {
        "effectiveTestTags": [],
        "requiredTestTags": []
    },
    "works": {
        "effectiveTestTags": [],
        "requiredTestTags": []
    },
    "works 2 @tag1": {
        "effectiveTestTags": [
            "@tag1"
        ],
        "requiredTestTags": []
    },
    "works 2 @tag1 @tag2": {
        "effectiveTestTags": [
            "@tag1",
            "@tag2"
        ],
        "requiredTestTags": []
    },
    "works @tag2": {
        "effectiveTestTags": [
            "@tag2"
        ],
        "requiredTestTags": []
    }
}`

  expect(JSON.stringify(Cypress.env('specTags')), 'spec tags').to.deep.equal(
    JSON.stringify(JSON.parse(specTags)),
  )
})

// a failed test if needed
// comment out when done
// describe('a failing suite', () => {
//   it('bad test', () => {
//     expect(false).to.be.true
//   })
// })
