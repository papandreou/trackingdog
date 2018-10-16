#!/usr/bin/env node

require('@gustavnikolaj/async-main-wrap')(require('./main'), {
  processError(err) {
    if (err.asset) {
      err.customOutput = err.message.replace(
        /$/m,
        `: ${err.asset.urlOrDescription}`
      );
    }
    return err;
  }
})(
  process.cwd(),
  process.argv.slice(2),
  console,
  require('get-stdin'),
  process.stdout.isTTY
);
