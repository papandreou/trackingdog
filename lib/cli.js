#!/usr/bin/env node

const processError = require('./processError');

require('@gustavnikolaj/async-main-wrap')(require('./main'), {
  processError
})(
  process.cwd(),
  process.argv.slice(2),
  console,
  require('get-stdin'),
  process.stdout.isTTY
);
