// @ts-check

const globby = require('globby')
const debug = require('debug')('cy-grep')

function resolveFilePattern(pattern) {
  if (pattern.includes('*')) {
    const globbyOptions = {
      sort: true,
      objectMode: false,
    }
    debug('globby options "%s" %o', pattern, globbyOptions)

    const files = globby.sync(pattern, globbyOptions)
    debug('found %d file(s) %o', files.length, files)
    return files
  } else {
    return pattern
  }
}

function resolveFilePatterns(patterns) {
  const extraSpecsList = patterns
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  debug('extra specs list %o', extraSpecsList)

  return extraSpecsList.flatMap(resolveFilePattern)
}

module.exports = {
  resolveFilePattern,
  resolveFilePatterns,
}
