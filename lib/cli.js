#!/usr/bin/env node

const TrackingDog = require('./TrackingDog');
const MagicPen = require('magicpen');
const urlTools = require('urltools');
const pathModule = require('path');
const getStdin = require('get-stdin');
const errorStackParser = require('error-stack-parser');

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

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

async function handleStdIn(argv) {
  const { root, context } = argv;

  const stdin = await getStdin();
  const trackingDog = new TrackingDog({ root });
  const frames = errorStackParser.parse({ stack: stdin });
  let result = stdin;
  let firstFrame;

  try {
    for (const {
      lineNumber,
      columnNumber,
      fileName,
      source,
      functionName
    } of frames) {
      if (!/^https?:/.test(fileName)) {
        break;
      }

      const res = await trackingDog.track({
        url: fileName,
        line: parseInt(lineNumber),
        column: parseInt(columnNumber)
      });

      if (!firstFrame) {
        firstFrame = res;
      }

      // TODO: Fix formatting of the reoutputted stacktrace.
      result = result.replace(
        source,
        `  at ${functionName || ''} (${res.url}:${res.line}:${res.column})`
      );
    }

    if (context) {
      let { url } = firstFrame;

      if (/^file:/.test(url)) {
        url = pathModule.relative(process.cwd(), urlTools.fileUrlToFsPath(url));
      } else if (/^https?:/.test(url)) {
        let { pathname } = urlTools.parse(url);

        if (pathname) {
          url = pathModule.relative(process.cwd(), pathname.slice(1));
        }
      }

      try {
        const snippetWithContext = renderSnippetWithContext({
          sourceText: await readFile(url, 'utf-8'),
          contentType: 'application/javascript',
          line: firstFrame.line,
          column: firstFrame.column
        });

        console.log(snippetWithContext + '\n');
      } catch (e) {
        if (e.code === 'ENOENT') {
          // file does not exist on disk.
          console.error("Could not find file '%s' on disk.", url);
        } else {
          throw e;
        }
      }
    }

    console.log(result);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}

(async () => {
  if (argv._.length > 0) {
    await handleNonOptionArguments(argv);
  } else {
    await handleStdIn(argv);
  }
})();
