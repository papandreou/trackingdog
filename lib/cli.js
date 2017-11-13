#!/usr/bin/env node

const trackingDog = require('./trackingDog');
const MagicPen = require('magicpen');
const urlTools = require('urltools');
const pathModule = require('path');

const { root, context, _: nonOptionArgs } = require('yargs')
  .usage('$0 [--root <dir>] [--[no-]context] <url>:<line>:<column>')
  .option('root', {
    demand: false,
    type: 'string'
  })
  .option('context', {
    alias: 'c',
    demand: false,
    default: process.stdout.isTTY,
    type: 'boolean'
  })
  .demand(1).argv;

function renderSnippetWithContext({ sourceText, contentType, line, column }) {
  const sourceLines = sourceText.split(/\n\r?|\r\n?/);

  const lineAndBeforeContext = sourceLines.slice(Math.max(0, line - 6), line);
  return new MagicPen()
    .use(require('magicpen-prism'))
    .code(lineAndBeforeContext.join('\n'), contentType)
    .nl()
    .sp(column)
    .yellow('^')
    .toString(MagicPen.defaultFormat);
}

(async () => {
  for (let i = 0; i < nonOptionArgs.length; i += 1) {
    let urlWithLineAndColumn = nonOptionArgs[i];
    while (
      i + 1 < nonOptionArgs.length &&
      /^\d+(?::\d+)?$/.test(nonOptionArgs[i + 1])
    ) {
      urlWithLineAndColumn += ':' + nonOptionArgs[i + 1];
      i += 1;
    }
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
      let { url, line, column, sourceText, sourceAsset } = await trackingDog({
        root,
        ...generatedLocation
      });

      if (/^file:/.test(url)) {
        url = pathModule.relative(process.cwd(), urlTools.fileUrlToFsPath(url));
      }
      console.log(`${url}:${line}:${column}`);

      if (context && (sourceAsset || sourceText)) {
        try {
          if (typeof sourceText === 'undefined') {
            await sourceAsset.loadAsync();
            sourceText = sourceAsset.text;
          }
          const magicPen = renderSnippetWithContext({
            sourceText,
            contentType: sourceAsset
              ? sourceAsset.contentType
              : pathModule.extname(url.replace(/[?#].*$/, '')),
            line,
            column
          });
          console.log(magicPen.toString(MagicPen.defaultFormat));
        } catch (err) {}
      }
    } catch (err) {
      console.error(err.stack);
      process.exit(1);
    }
  }
})();
