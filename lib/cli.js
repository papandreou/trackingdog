#!/usr/bin/env node

require('@gustavnikolaj/async-main-wrap')(require('./main'))(
  process.argv.slice(2),
  console,
  require('get-stdin'),
  process.stdout.isTTY
);
