#!/usr/bin/env node

const AssetGraph = require('assetgraph');
const trackingDog = require('./trackingDog');
const errorStackParser = require('error-stack-parser');

module.exports = async error => {
  if (typeof error === 'string') {
    error = {
      stack: error
    };
  }

  let result = error.stack;

  const assetGraph = new AssetGraph({ root: undefined });

  const frames = errorStackParser.parse(error);

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

    const res = await trackingDog({
      url: fileName,
      line: parseInt(lineNumber),
      column: parseInt(columnNumber),
      assetGraph
    });

    result = result.replace(
      source,
      `  at ${functionName || ''} (${res.url}:${res.line}:${res.column})`
    );
  }

  return result;
};
