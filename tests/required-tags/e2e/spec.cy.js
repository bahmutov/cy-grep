import registerGrep from '../../../src/support'
registerGrep()

it('runs always', () => {})

// this test should ONLY run when the tag "@special" is on
it('runs only when tag "special" is on', { requiredTags: '@special' }, () => {})
