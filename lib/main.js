const TrackingDog = require('./TrackingDog');
const MagicPen = require('magicpen');
const urlTools = require('urltools');
const pathModule = require('path');
const errorStackParser = require('error-stack-parser');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const StackTracey = require('stacktracey');

StackTracey.maxColumnWidths.file = Infinity;

function getWorkspaceMappings(workspaces) {
  if (typeof workspaces === 'string') {
    workspaces = [workspaces];
  } else if (!workspaces) {
    return {};
  }

  const mappings = {};

  for (const pair of workspaces) {
    const [from, to] = pair.split('=');

    if (!from || !to) {
      throw new Error(`Invalid workspace mapping "${pair}"`);
    }

    mappings[from] = to;
  }

  return mappings;
}

function applyWorkspaceMappings(url, workspaceMappings) {
  for (const [from, to] of Object.entries(workspaceMappings)) {
    // from is a prefix match
    if (url.startsWith(from)) {
      return pathModule.join(to, url.substr(from.length));
    }
  }

  return url;
}

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

module.exports = async (cwd, argv, console, getStdin, isTTY) => {
  const commandLineOptions = require('yargs')(argv)
    .usage(
      '$0 [--root <dir>] [--[no-]context] [--workspace http://example.com=../example] <url>:<line>:<column>'
    )
    .option('root', {
      demand: false,
      type: 'string'
    })
    .option('workspace', {
      demand: false,
      type: 'string'
    })
    .option('context', {
      alias: 'c',
      demand: false,
      default: isTTY,
      type: 'boolean'
    }).argv;

  async function handleNonOptionArguments(cwd, argv) {
    const { root, context, workspace, _: nonOptionArgs } = argv;
    const workspaceMappings = getWorkspaceMappings(workspace);

    for (let i = 0; i < nonOptionArgs.length; i += 1) {
      let urlWithLineAndColumn = nonOptionArgs[i];
      while (
        i + 1 < nonOptionArgs.length &&
        /^\d+(?::\d+)?$/.test(nonOptionArgs[i + 1])
      ) {
        urlWithLineAndColumn += ':' + nonOptionArgs[i + 1];
        i += 1;
      }

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
        url = pathModule.relative(cwd, urlTools.fileUrlToFsPath(url));
      }

      url = applyWorkspaceMappings(url, workspaceMappings);

      console.log(`${url}:${line}:${column}`);

      if (context) {
        let contentType = sourceAsset
          ? sourceAsset.contentType
          : pathModule.extname(url.replace(/[?#].*$/, ''));

        if (!sourceText && !/^(?:http|https|file):/.test(url)) {
          try {
            const localUrl = pathModule.relative(cwd, url);
            sourceText = await readFile(localUrl, 'utf-8');
            contentType =
              pathModule.extname(localUrl) === '.js'
                ? 'application/javascript'
                : contentType;
          } catch (e) {}
        } else if (!sourceText && sourceAsset) {
          try {
            await sourceAsset.load();
            sourceText = sourceAsset.text;
            contentType = sourceAsset.contentType;
          } catch (e) {}
        }

        if (sourceText) {
          console.log(
            renderSnippetWithContext({
              sourceText,
              contentType,
              line,
              column
            })
          );
        }
      }
    }
  }

  async function handleStdIn(cwd, argv) {
    const { root, context, workspace } = argv;
    const workspaceMappings = getWorkspaceMappings(workspace);

    const stdin = await getStdin();
    const trackingDog = new TrackingDog({ root });
    const frames = errorStackParser.parse({ stack: stdin });
    let result = stdin;
    let firstFrame;

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

      let url = applyWorkspaceMappings(res.url, workspaceMappings);

      // TODO: Fix formatting of the reoutputted stacktrace.
      result = result.replace(
        source,
        `  at ${functionName || ''} (${url}:${res.line}:${res.column})`
      );
    }

    if (context) {
      let { url, sourceText, sourceAsset, line, column } = firstFrame;
      let contentType = sourceAsset
        ? sourceAsset.contentType
        : pathModule.extname(url.replace(/[?#].*$/, ''));

      url = applyWorkspaceMappings(url, workspaceMappings);

      if (!sourceText && !/^(?:http|https|file):/.test(url)) {
        try {
          const localUrl = pathModule.relative(cwd, url);
          sourceText = await readFile(localUrl, 'utf-8');
          contentType =
            pathModule.extname(localUrl) === '.js'
              ? 'application/javascript'
              : contentType;
        } catch (e) {}
      } else if (!sourceText && sourceAsset) {
        try {
          await sourceAsset.load();
          sourceText = sourceAsset.text;
          contentType = sourceAsset.contentType;
        } catch (e) {}
      }

      if (sourceText) {
        console.log(
          renderSnippetWithContext({
            sourceText,
            contentType,
            line,
            column
          })
        );
      }
    }

    const matchErrorMessage = result.match(/^(.*?\n)(?:  at)/);
    result =
      (matchErrorMessage && matchErrorMessage[1]) +
      new StackTracey(result).pretty;

    console.log(result);
  }

  if (commandLineOptions._.length > 0) {
    await handleNonOptionArguments(cwd, commandLineOptions);
  } else {
    await handleStdIn(cwd, commandLineOptions);
  }
};
