#!/usr/bin/env node

const trackingDog = require('./trackingDog');

const { root, _: nonOptionArgs } = require('yargs')
  .usage('$0 [--root <dir>] <url>:<line>:<column>')
  .option('root', {
    demand: false,
    type: 'string'
  })
  .demand(1).argv;

(async () => {
  for (const urlWithLineAndColumn of nonOptionArgs) {
    try {
      const tokens = urlWithLineAndColumn.split(':');
      if (tokens.length < 3) {
        throw new Error(
          'The source locations must be given as <url>:<line>:<column>'
        );
      }
      const generatedLocation = {
        column: parseInt(tokens.pop(), 10),
        line: parseInt(tokens.pop(), 10),
        url: tokens.join(':')
      };
      const { url, line, column } = await trackingDog({
        root,
        ...generatedLocation
      });

      console.log(`${url}:${line}:${column}`);
    } catch (err) {
      console.error(err.stack);
      process.exit(1);
    }
  }
})();
