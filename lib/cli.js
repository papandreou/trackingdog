#!/usr/bin/env node

const TrackingDog = require('./TrackingDog');
const MagicPen = require('magicpen');
const urlTools = require('urltools');
const pathModule = require('path');

const argv = require('yargs')
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
  }).argv;

function renderSnippetWithContext({ sourceText, contentType, line, column }) {
  const sourceLines = sourceText.split(/\n\r?|\r\n?/);

  const magicPen = new MagicPen()
    .use(require('magicpen-prism'))
    .code(
      sourceLines.slice(Math.max(0, line - 6), line).join('\n'),
      contentType
    )
    .nl()
    .sp(column)
    .yellow('^');

  if (sourceLines.length >= line) {
    magicPen
      .nl()
      .code(sourceLines.slice(line, line + 3).join('\n'), contentType);
  }

  return magicPen.toString(MagicPen.defaultFormat);
}

async function handleNonOptionArguments(argv) {
  const { root, context, _: nonOptionArgs } = argv;

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

      const trackingDog = new TrackingDog({ root });

      let {
        url,
        line,
        column,
        sourceText,
        sourceAsset
      } = await trackingDog.track({
        column: parseInt(tokens.pop(), 10),
        line: parseInt(tokens.pop(), 10),
        url: tokens.join(':')
      });

      if (/^file:/.test(url)) {
        url = pathModule.relative(process.cwd(), urlTools.fileUrlToFsPath(url));
      }
      console.log(`${url}:${line}:${column}`);

      if (context && (sourceAsset || sourceText)) {
        try {
          if (typeof sourceText === 'undefined') {
            await sourceAsset.load();
            sourceText = sourceAsset.text;
          }
          console.log(
            renderSnippetWithContext({
              sourceText,
              contentType: sourceAsset
                ? sourceAsset.contentType
                : pathModule.extname(url.replace(/[?#].*$/, '')),
              line,
              column
            })
          );
        } catch (err) {}
      }
    } catch (err) {
      console.error(err.stack);
      process.exit(1);
    }
  }
}

(async () => {
  if (argv._.length > 0) {
    await handleNonOptionArguments(argv);
  } else {
    console.error('NYI: Passing in a stack trace through stdin.');
    process.exit(1);
  }
})();
