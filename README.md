# @bahmutov/cy-grep ![cypress version](https://img.shields.io/badge/cypress-15.4.0-brightgreen)

> Filter tests using substring or tag

```shell
# run only tests with "hello" in their names
npx cypress run --env grep=hello

  ✓ hello world
  - works
  - works 2 @tag1
  - works 2 @tag1 @tag2

  1 passing (38ms)
  3 pending
```

All other tests will be marked pending, see why in the [Cypress test statuses](https://on.cypress.io/writing-and-organizing-tests#Test-statuses) blog post.

If you have multiple spec files, all specs will be loaded, and every test will be filtered the same way, since the grep is run-time operation and cannot eliminate the spec files without loading them. If you want to run only specific tests, use the built-in [--spec](https://on.cypress.io/command-line#cypress-run-spec-lt-spec-gt) CLI argument.

## Training

Watch the video [intro to cypress-grep plugin](https://www.youtube.com/watch?v=HS-Px-Sghd8) and study my 🎓 Cypress course [Cypress Plugins](https://cypress.tips/courses/cypress-plugins):

- [Lesson k1: Set up the test grep plugin](https://cypress.tips/courses/cypress-plugins/lessons/k1)
- [Lesson k2: Filter the tests using test and suite tags](https://cypress.tips/courses/cypress-plugins/lessons/k2)
- [Lesson k3: Filter the specs without the tag we want to run](https://cypress.tips/courses/cypress-plugins/lessons/k3)
- [Lesson k4: Filter the tests to run using several tags](https://cypress.tips/courses/cypress-plugins/lessons/k4)
- [Lesson k5: Filter the tests to run using OR of several tags](https://cypress.tips/courses/cypress-plugins/lessons/k5)
- [Lesson k6: Repeat selected tests N times](https://cypress.tips/courses/cypress-plugins/lessons/k6)
- [Lesson k7: Pick the tests to run in the interactive mode](https://cypress.tips/courses/cypress-plugins/lessons/k7)
- [Lesson k8: Automatically prefix tags with the "@" character](https://cypress.tips/courses/cypress-plugins/lessons/k8)
- [Lesson k9: Set baseUrl depending on the test tag](https://cypress.tips/courses/cypress-plugins/lessons/k9)
- [Lesson k10: Limit test tags to specific values](https://cypress.tips/courses/cypress-plugins/lessons/k10)
- [Lesson k11: Use TypeScript enum for test tags](https://cypress.tips/courses/cypress-plugins/lessons/k11)
- [Lesson k12: Validate user-supplied test tags](https://cypress.tips/courses/cypress-plugins/lessons/k12)

Combine this plugin with [cypress-split](https://github.com/bahmutov/cypress-split) plugin to first pre-filter specs, then run them in parallel: lesson [Lesson c2: Combine split and grep](https://cypress.tips/courses/cypress-split/lessons/c2) from my course [Cypress-split plugin](https://cypress.tips/courses/cypress-split).

## Table of Contents

<!-- MarkdownTOC autolink="true" -->

- [@bahmutov/cy-grep ](#bahmutovcy-grep-)
  - [Training](#training)
  - [Table of Contents](#table-of-contents)
  - [Install](#install)
    - [Support file](#support-file)
    - [Config file](#config-file)
    - [Install in Cypress versions before 10](#install-in-cypress-versions-before-10)
  - [Usage Overview](#usage-overview)
  - [Filter by test title](#filter-by-test-title)
    - [OR substring matching](#or-substring-matching)
    - [Test suites](#test-suites)
    - [Invert filter](#invert-filter)
  - [Filter with tags](#filter-with-tags)
    - [Tags in the test config object](#tags-in-the-test-config-object)
    - [AND tags](#and-tags)
    - [OR tags](#or-tags)
    - [Inverted tags](#inverted-tags)
    - [NOT tags](#not-tags)
    - [Tags in test suites](#tags-in-test-suites)
    - [Grep untagged tests](#grep-untagged-tests)
    - [Access the tags in the test](#access-the-tags-in-the-test)
  - [Pre-filter specs (grepFilterSpecs)](#pre-filter-specs-grepfilterspecs)
  - [Omit filtered tests (grepOmitFiltered)](#omit-filtered-tests-grepomitfiltered)
  - [Disable grep](#disable-grep)
  - [Burn (repeat) tests](#burn-repeat-tests)
  - [grepExtraSpecs](#grepextraspecs)
  - [Required tags](#required-tags)
  - [Negative grep](#negative-grep)
  - [TypeScript support](#typescript-support)
  - [grepPrefixAt](#grepprefixat)
  - [grepSpec](#grepspec)
  - [General advice](#general-advice)
  - [DevTools console](#devtools-console)
    - [grepFailed](#grepfailed)
  - [Debugging](#debugging)
    - [Log messages](#log-messages)
    - [Debugging in the plugin](#debugging-in-the-plugin)
    - [Debugging in the browser](#debugging-in-the-browser)
  - [Examples](#examples)
  - [See also](#see-also)
  - [cy-grep vs cypress-grep vs @cypress/grep](#cy-grep-vs-cypress-grep-vs-cypressgrep)
  - [Major migrations](#major-migrations)
    - [v1 to v2](#v1-to-v2)
  - [Small Print](#small-print)

<!-- /MarkdownTOC -->

## Install

Assuming you have Cypress installed, add this module as a dev dependency.

```shell
# using NPM
npm i -D @bahmutov/cy-grep
# using Yarn
yarn add -D @bahmutov/cy-grep
```

**Note**: @bahmutov/cy-grep should work with all Cypress versions, but I mostly test it on the newest versions.

### Support file

**required:** load this module from the [support file](https://on.cypress.io/writing-and-organizing-tests#Support-file) or at the top of the spec file if not using the support file. You import the registration function and then call it:

```js
// cypress/support/e2e.js

// load and register the grep feature using "require" function
// https://github.com/bahmutov/cy-grep
const registerCypressGrep = require('@bahmutov/cy-grep')
registerCypressGrep()

// if you want to use the "import" keyword
// note: `./index.d.ts` currently extends the global Cypress types and
// does not define `registerCypressGrep` so the import path is directly
// pointed to the support file
import registerCypressGrep from '@bahmutov/cy-grep/src/support'
registerCypressGrep()

// "import" with `@ts-ignore`
// @see error 2306 https://github.com/microsoft/TypeScript/blob/3fcd1b51a1e6b16d007b368229af03455c7d5794/src/compiler/diagnosticMessages.json#L1635
// @ts-ignore
import registerCypressGrep from '@bahmutov/cy-grep'
registerCypressGrep()
```

### Config file

**optional:** load and register this module from the [config file](https://docs.cypress.io/guides/references/configuration#setupNodeEvents):

```js
// cypress.config.js
{
  e2e: {
    setupNodeEvents(on, config) {
      require('@bahmutov/cy-grep/src/plugin')(config);
      // IMPORTANT: return the config object
      return config;
    },
  }
}
```

Installing the plugin via `setupNodeEvents()` is required to enable the [grepFilterSpecs](#pre-filter-specs-grepfilterspecs) feature.

**Tip:** you probably want to set these `env` settings in your config file

```js
module.exports = defineConfig({
  env: { grepFilterSpecs: true, grepOmitFiltered: true },
  ...
})
```

Trying to call the plugin function without any arguments or with more than a single argument throws an error

```js
// ERROR: forgot the config file
setupNodeEvents(on, config) {
  require('@bahmutov/cy-grep/src/plugin')();
}
// ERROR: too many arguments
setupNodeEvents(on, config) {
  require('@bahmutov/cy-grep/src/plugin')(on, config);
}
```

### Install in Cypress versions before 10

See [test-cy-v9](./test-cy-v9/) for example

```js
// cypress/plugins/index.js
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  require('@bahmutov/cy-grep/src/plugin')(config)
  // IMPORTANT: return the config object
  return config
}
```

```js
// cypress/support/index.js
require('@bahmutov/cy-grep')()
```

Put the common settings into `cypress.json`

```json
{
  "env": {
    "grepOmitFiltered": true,
    "grepFilterSpecs": true
  }
}
```

## Usage Overview

You can filter tests to run using part of their title via `grep`, and via explicit tags via `grepTags` Cypress environment variables.

Most likely you will pass these environment variables from the command line. For example, to only run tests with "login" in their title and tagged "smoke", you would run:

Here are a few examples:

```shell
# run only the tests with "auth user" in the title
$ npx cypress run --env grep="auth user"
# run tests with "hello" or "auth user" in their titles
# by separating them with ";" character
$ npx cypress run --env grep="hello; auth user"
# run tests tagged @fast
$ npx cypress run --env grepTags=@fast
# run only the tests tagged "smoke"
# that have "login" in their titles
$ npx cypress run --env grep=login,grepTags=smoke
# only run the specs that have any tests with "user" in their titles
$ npx cypress run --env grep=user,grepFilterSpecs=true
# only run the specs that have any tests tagged "@smoke"
$ npx cypress run --env grepTags=@smoke,grepFilterSpecs=true
# run only tests that do not have any tags
# and are not inside suites that have any tags
$ npx cypress run --env grepUntagged=true
```

You can use any way to modify the environment values `grep` and `grepTags`, except the run-time `Cypress.env('grep')` (because it is too late at run-time). You can set the `grep` value in the `cypress.json` file to run only tests with the substring `viewport` in their names

```json
{
  "env": {
    "grep": "viewport"
  }
}
```

You can also set the `env.grep` object in the plugin file, but remember to return the changed config object:

```js
// cypress/plugin/index.js
module.exports = (on, config) => {
  config.env.grep = 'viewport'
  return config
}
```

You can also set the grep and grepTags from the DevTools console while running Cypress in the interactive mode `cypress open`, see [DevTools Console section](#devtools-console).

## Filter by test title

```shell
# run all tests with "hello" in their title
$ npx cypress run --env grep=hello
# run all tests with "hello world" in their title
$ npx cypress run --env grep="hello world"
```

### OR substring matching

You can pass multiple title substrings to match separating them with `;` character. Each substring is trimmed.

```shell
# run all tests with "hello world" or "auth user" in their title
$ npx cypress run --env grep="hello world; auth user"
```

### Test suites

The filter is also applied to the "describe" blocks. In that case, the tests look up if any of their outer suites are enabled.

```js
describe('block for config', () => {
  it('should run', () => {})

  it('should also work', () => {})
})
```

```
# run any tests in the blocks including "config"
--env grep=config
```

**Note:** global function `describe` and `context` are aliases and both supported by this plugin.

### Invert filter

```shell
# run all tests WITHOUT "hello world" in their title
$ npx cypress run --env grep="-hello world"
# run tests with "hello", but without "world" in the titles
$ npx cypress run --env grep="hello; -world"
```

## Filter with tags

You can select tests to run or skip using tags by passing `--env grepTags=...` value.

```
# enable the tests with tag "one" or "two"
--env grepTags="one two"
# enable the tests with both tags "one" and "two"
--env grepTags="one+two"
# enable the tests with "hello" in the title and tag "smoke"
--env grep=hello,grepTags=smoke
```

If you can pass commas in the environment variable `grepTags`, you can use `,` to separate the tags

```
# enable the tests with tag "one" or "two"
CYPRESS_grepTags=one,two npx cypress run
```

If a specific tag is not found in the specs, you will get a warning in the terminal:

```
$ npx cypress run --env grepTags=@wrong-tag
cy-grep: could not find the tag "@wrong-tag" in any of the specs
```

### Tags in the test config object

Cypress tests can have their own [test config object](https://on.cypress.io/configuration#Test-Configuration), and when using this plugin you can put the test tags there, either as a single tag string or as an array of tags.

```js
it('works as an array', { tags: ['config', 'some-other-tag'] }, () => {
  expect(true).to.be.true
})

it('works as a string', { tags: 'config' }, () => {
  expect(true).to.be.true
})
```

You can run both of these tests using `--env grepTags=config` string.

### AND tags

Use `+` to require both tags to be present

```
--env grepTags=@smoke+@fast
```

### OR tags

You can run tests that match one tag or another using spaces. Make sure to quote the grep string!

```
# run tests with tags "@slow" or "@critical" in their names
--env grepTags='@slow @critical'
```

### Inverted tags

You can skip running the tests with specific tag using the invert option: prefix the tag with the character `-`.

```
# do not run any tests with tag "@slow"
--env grepTags=-@slow
```

If you want to run all tests with tag `@slow` but without tag `@smoke`:

```
--env grepTags=@slow+-@smoke
```

**Note:** Inverted tag filter is not compatible with the `grepFilterSpecs` option

### NOT tags

You can skip running the tests with specific tag, even if they have a tag that should run, using the not option: prefix the tag with `--`.

Note this is the same as appending `+-<tag to never run>` to each tag. May be useful with large number of tags.

If you want to run tests with tags `@slow` or `@regression` but without tag `@smoke`

```
--env grepTags='@slow @regression --@smoke'
```

which is equivalent to

```
--env grepTags='@slow+-@smoke @regression+-@smoke'
```

### Tags in test suites

The tags are also applied to the "describe" blocks. In that case, the tests look up if any of their outer suites are enabled.

```js
describe('block with config tag', { tags: '@smoke' }, () => {})
```

```
# run any tests in the blocks having "@smoke" tag
--env grepTags=@smoke
# skip any blocks with "@smoke" tag
--env grepTags=-@smoke
```

See the [cypress/integration/describe-tags-spec.js](./cypress/integration/describe-tags-spec.js) file.

**Note:** global function `describe` and `context` are aliases and both supported by this plugin.

### Grep untagged tests

Sometimes you want to run only the tests without any tags, and these tests are inside the describe blocks without any tags.

```
$ npx cypress run --env grepUntagged=true
```

### Access the tags in the test

You can check the current test's tags (including its parent suites) by checking the `Cypress.env('testTags')` list

```js
describe('parent', { tags: ['@p1', '@p2'] }, () => {
  describe('child', { tags: '@c1' }, () => {
    it('has all effective test tags', { tags: '@t1' }, () => {
      const tags = Cypress.env('testTags')
      // includes tags from the parent suites and the test itself
      expect(tags, 'tags').to.deep.equal(['@p1', '@p2', '@c1', '@t1'])
    })
  })
})
```

## Pre-filter specs (grepFilterSpecs)

By default, when using `grep` and `grepTags` all specs are executed, and inside each the filters are applied. This can be very wasteful, if only a few specs contain the `grep` in the test titles. Thus when doing the positive `grep`, you can pre-filter specs using the `grepFilterSpecs=true` parameter.

```
# filter all specs first, and only run the ones with
# suite or test titles containing the string "it loads"
$ npx cypress run --env grep="it loads",grepFilterSpecs=true
# filter all specs files, only run the specs with a tag "@smoke"
$ npx cypress run --env grepTags=@smoke,grepFilterSpecs=true
```

**Note 1:** this requires installing this plugin in your project's plugin file, see the [Install](#install).

**Note 2:** the `grepFilterSpecs` option is only compatible with the positive `grep` and `grepTags` options, not with the negative (inverted) "-..." filter.

**Note 3:** if there are no files remaining after filtering, the plugin prints a warning and leaves all files unchanged to avoid the test runner erroring with "No specs found".

**Tip:** you can set this environment variable in the [config file](https://docs.cypress.io/guides/references/configuration) file to enable it by default and skip using the environment variable:

```js
// config file
{
  "e2e": {
    "env": {
      "grepFilterSpecs": true
    }
  }
}
```

## Omit filtered tests (grepOmitFiltered)

By default, all filtered tests are made _pending_ using `it.skip` method. If you want to completely omit them, pass the environment variable `grepOmitFiltered=true`.

Pending filtered tests

```
cypress run --env grep="works 2"
```

![Pending tests](./images/includes-pending.png)

Omit filtered tests

```
cypress run --env grep="works 2",grepOmitFiltered=true
```

![Only running tests remaining](./images/omit-pending.png)

**Tip:** you can set this environment variable in the config file (usually `cypress.config.js`) file to enable it by default and skip using the environment variable:

```json
{
  "env": {
    "grepOmitFiltered": true
  }
}
```

## Disable grep

If you specify the `grep` parameters the [config file](https://docs.cypress.io/guides/references/configuration), you can disable it from the command line

```
$ npx cypress run --env grep=,grepTags=,burn=
```

## Burn (repeat) tests

You can burn the filtered tests to make sure they are flake-free

```
npx cypress run --env grep="hello world",burn=5
```

You can pass the number of times to run the tests via environment name `burn` or `grepBurn` or `grep-burn`. Note, if a lot of tests match the grep and grep tags, a lot of tests will be burnt!

If you do not specify the "grep" or "grep tags" option, the "burn" will repeat _every_ test.

## grepExtraSpecs

Sometimes you want to pre-filter specs using tags AND then run extra specs without any filtering. You can set the list of specs / patterns using the `grepExtraSpecs` env string. For example, to filter specs using tag `@a` plus run the spec "b.cy.js":

```
npx cypress run --env grepTags=@a,grepExtraSpecs=cypress/e2e/b.cy.js
```

## Required tags

Sometimes you might want to run a test or a suite of tests _only_ if a specific tag or tags are present. For example, you might have a test that cleans the data. This test is meant to run nightly, not on every test run. Thus you can set a `required` tag:

```js
it('cleans up the data', { requiredTags: '@nightly' }, () => {...})
```

When you run the tests now, this test will be skipped, as if it were `it.skip`. It will only run if you use the tag `@nightly`, for example: `npx cypress run --env grepTags=@nightly`.

If `grepFilterSpecs=true` and a spec has only required tags, and you are running without any tags, the the spec will be skipped completely.

Read the blog posts 📝 [Required Tags](https://glebbahmutov.com/blog/required-tags/) and [Use Required Test Tags Instead Of Skipping Tests](https://glebbahmutov.com/blog/required-tags-instead-of-skipped-tests/).

## Negative grep

When grepping tests by title, the parent suite title is included. For example if this is the spec

```js
describe('users', () => {
  it('works 1', () => {})
  it('works 2', () => {})
  it('works 3', () => {})
})

describe('projects', () => {
  it('load 1', () => {})
  it('load 2', () => {})
  it('load 3', () => {})
})
```

You can run the tests inside the suite "projects" by using `--env grep=projects` and you can skip the tests in the suite `projects` by using `--env grep=-projects`.

## TypeScript support

Because the Cypress test config object type definition does not have the `tags` property we are using above, the TypeScript linter will show an error. Just add an ignore comment above the test:

```js
// @ts-ignore
it('runs on deploy', { tags: 'smoke' }, () => {
  ...
})
```

If you want to allow any strings to be test tags, simply include [src/tags-are-strings.d.ts](./src/tags-are-strings.d.ts) included with this package in your project TS config:

```json
{
  "include": [
    "cypress/**/*",
    "node_modules/@bahmutov/cy-grep/src/tags-are-strings.d.ts"
  ],
  "compilerOptions": {
    "types": ["cypress", "@bahmutov/cy-grep"]
  }
}
```

If you want to provide your _own_ list of allowed tags, create a `.d.ts` file or extend your `index.d.ts` file

```ts
// your project's index.d.ts file
/// <reference types="cypress" />

/**
 * The only allowed test tags in this project
 */
type AllowedTag = '@smoke' | '@misc' | '@new-todo'

declare namespace Cypress {
  interface SuiteConfigOverrides {
    tags?: AllowedTag | AllowedTag[]
    requiredTags?: AllowedTag | AllowedTag[]
  }

  interface TestConfigOverrides {
    tags?: AllowedTag | AllowedTag[]
    requiredTags?: AllowedTag | AllowedTag[]
  }
}
```

## grepPrefixAt

Using test tags that start with `@` is so common, you can enforce it using the env option `grepPrefixAt: true`. This lets you use `@tag1,@tag2, ...` or `tag1,tag2, ...` when calling.

```
# use grepPrefixAt in your env settings object
# use { tags: '@tag1' } in your tests

# then these two are equivalent
--env grepTags=@tag1
--env grepTags=tag1
```

## grepSpec

If the user selected spec(s) to run, then it might conflict with `grepFilterSpecs=true` that filters the specs. There is no way to "know" if the user used `--spec <...>` option when the plugin runs, see issues [33](https://github.com/bahmutov/cy-grep/issues/33) and [26032](https://github.com/cypress-io/cypress/issues/26032). Thus if you use `--spec pattern`, you need to pass it to the plugin via `CYPRESS_grepSpec=pattern` or `--env grepSpec=pattern` option.

```
cypress run --spec a.cy.js --env grepTags=...,grepSpec=a.cy.js
```

## General advice

- keep it simple.
- I like using `@` as tag prefix to make the tags searchable

```js
// ✅ good practice
describe('auth', { tags: '@critical' }, () => ...)
it('works', { tags: '@smoke' }, () => ...)
it('works quickly', { tags: ['@smoke', '@fast'] }, () => ...)

// 🚨 NOT GOING TO WORK
// ERROR: treated as a single tag,
// probably want an array instead
it('works', { tags: '@smoke @fast' }, () => ...)
```

Grepping the tests

```shell
# run the tests by title
$ npx cypress run --env grep="works quickly"
# run all tests tagged @smoke
$ npx cypress run --env grepTags=@smoke
# run all tests except tagged @smoke
$ npx cypress run --env grepTags=-@smoke
# run all tests that have tag @fast but do not have tag @smoke
$ npx cypress run --env grepTags=@fast+-@smoke
```

I would run all tests by default, and grep tests from the command line. For example, I could run the smoke tests first using grep plugin, and if the smoke tests pass, then run all the tests. See the video [How I organize pull request workflows by running smoke tests first](https://www.youtube.com/watch?v=SFW7Ecj5TNE) and its [pull request workflow file](https://github.com/bahmutov/cypress-grep-example/blob/main/.github/workflows/pr.yml).

## DevTools console

You can set the grep string from the DevTools Console. This plugin adds method `Cypress.grep` and `Cypress.grepTags` to set the grep strings and restart the tests

```js
// filter tests by title substring
Cypress.grep('hello world')
// run filtered tests 100 times
Cypress.grep('hello world', null, 100)
// filter tests by tag string
// in this case will run tests with tag @smoke OR @fast
Cypress.grep(null, '@smoke @fast')
// run tests tagged @smoke AND @fast
Cypress.grep(null, '@smoke+@fast')
// run tests with title containing "hello" and tag @smoke
Cypress.grep('hello', '@smoke')
// run tests with title containing "hello" and tag @smoke 10 times
Cypress.grep('hello', '@smoke', 10)
```

- to remove the grep strings enter `Cypress.grep()`

### grepFailed

Once the tests finish, you can run just the failed tests from DevTools console

```text
> Cypress.grepFailed()
```

**Tip:** use `Cypress.grep()` to reset and run all the tests

📝 Read the blog post [Run Just The Failed Tests In Cypress](https://glebbahmutov.com/blog/run-failed-tests/).

## Debugging

When debugging a problem, first make sure you are using the expected version of this plugin, as some features might be only available in the [later releases](https://github.com/bahmutov/cy-grep/releases).

```
# get the plugin's version using NPM
$ npm ls @bahmutov/cy-grep
...
└── @bahmutov/cy-grep@1.1.0

# get the plugin's version using Yarn
$ yarn why @bahmutov/cy-grep
...
=> Found "@bahmutov/cy-grep@1.1.0"
info Has been hoisted to "@bahmutov/cy-grep"
info This module exists because it's specified in "devDependencies".
...
```

Second, make sure you are passing the values to the plugin correctly by inspecting the "Settings" tab in the Cypress Desktop GUI screen. You should see the values you have passed in the "Config" object under the `env` property. For example, if I start the Test Runner with

```text
$ npx cypress open --env grep=works,grepFilterTests=true
```

Then I expect to see the grep string and the "filter tests" flag in the `env` object.

![Values in the env object](./images/config.png)

### Log messages

This module uses [debug](https://github.com/visionmedia/debug#readme) to log verbose messages. You can enable the debug messages in the plugin file (runs when discovering specs to filter), and inside the browser to see how it determines which tests to run and to skip. When opening a new issue, please provide the debug logs from the plugin (if any) and from the browser.

### Debugging in the plugin

Start Cypress with the environment variable `DEBUG=cy-grep`. You will see a few messages from this plugin in the terminal output:

```
$ DEBUG=cy-grep npx cypress run --env grep=works,grepFilterSpecs=true
cy-grep: tests with "works" in their names
cy-grep: filtering specs using "works" in the title
  cy-grep Cypress config env object: { grep: 'works', grepFilterSpecs: true }
  ...
  cy-grep found 1 spec files +5ms
  cy-grep [ 'spec.js' ] +0ms
  cy-grep spec file spec.js +5ms
  cy-grep suite and test names: [ 'hello world', 'works', 'works 2 @tag1',
    'works 2 @tag1 @tag2', 'works @tag2' ] +0ms
  cy-grep found "works" in 1 specs +0ms
  cy-grep [ 'spec.js' ] +0ms
```

### Debugging in the browser

To enable debug console messages in the browser, from the DevTools console set `localStorage.debug='cy-grep'` and run the tests again.

To see how to debug this plugin, watch the video [Debug cypress-grep Plugin](https://youtu.be/4YMAERddHYA) but use the string `cy-grep`

## Examples

- [cypress-grep-example](https://github.com/bahmutov/cypress-grep-example)
- [todo-graphql-example](https://github.com/bahmutov/todo-graphql-example)

## See also

- [cypress-select-tests](https://github.com/bahmutov/cypress-select-tests)
- [cypress-skip-test](https://github.com/cypress-io/cypress-skip-test)
- 📝 Read the blog post [Cypress GitHub Actions Slash Command](https://glebbahmutov.com/blog/cypress-slash-command/)
- 📝 Read the blog post [Type Check Your Test Tags](https://glebbahmutov.com/blog/type-check-test-tags/)
- plugin [dennisbergevin/cypress-plugin-last-failed](https://github.com/dennisbergevin/cypress-plugin-last-failed)
- plugin [dennisbergevin/cypress-cli-select](https://github.com/dennisbergevin/cypress-cli-select)
- plugin [dennisbergevin/cypress-plugin-grep-boxes](https://github.com/dennisbergevin/cypress-plugin-grep-boxes)

## cy-grep vs cypress-grep vs @cypress/grep

Many years ago I wrote a plugin `cypress-grep`. When I left the company Cypress, I transferred that MIT-licensed plugin to the Cypress GitHub organization. They moved it to the Cypress monorepo and renamed the NPM module `@cypress/grep`. I still use this grep plugin in some projects. When Cypress v10 was released, it broke some of the things in the plugin. Since I needed to fix it quickly and the monorepo setup is suboptimal, I forked the plugin back to my own repo `bahmutov/cy-grep` (this repo) and released under NPM name `@bahmutov/cy-grep`.

I plan to maintain the plugin `@bahmutov/cy-grep` in the future, since I rely on it myself **a lot**.

## Major migrations

### v1 to v2

Adding a type for `tags` and `requiredTags` moved from default to its own `.d.ts` file.

**v1**

For example, the plugin `@bahmutov/cy-grep@v1` simply could add itself to the `types` list in your `tsconfig.json` / `jsconfig.json` file

```json
{
  "include": ["cypress/**/*"],
  "compilerOptions": {
    "types": ["cypress", "@bahmutov/cy-grep"]
  }
}
```

This made `tags` property a string, so you could use `it('works', { tags: '@smoke' }, () => ...)`

**v2**

If you want to use _any_ strings as tags, you need to add the file [src/tags-are-strings.d.ts](./src/tags-are-strings.d.ts)

```json
{
  "include": [
    "cypress/**/*",
    "node_modules/@bahmutov/cy-grep/src/tags-are-strings.d.ts"
  ],
  "compilerOptions": {
    "types": ["cypress", "@bahmutov/cy-grep"]
  }
}
```

**Note:** you still want to include the `@bahmutov/cy-grep` default types, since they provide additional static methods, like `Cypress.grep`

## Small Print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2022

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)
- [Cypress Tips & Tricks Newsletter](https://cypresstips.substack.com/)
- [my Cypress courses](https://cypress.tips/courses)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/cy-grep/issues) on Github
