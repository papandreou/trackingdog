const AssetGraph = require('assetgraph');
const mozilla = require('source-map');

async function trackingDog({ root, url, line, column }) {
  const assetGraph = new AssetGraph({ root });
  let asset = assetGraph.addAsset(url);
  await asset.loadAsync();
  const sourceMapRelations = asset.outgoingRelations.filter(relation =>
    /SourceMappingUrl$/.test(relation.type)
  );
  if (sourceMapRelations.length > 0) {
    for (const sourceMapRelation of sourceMapRelations) {
      await sourceMapRelation.to.loadAsync();
    }
  }

  let sourceMap;
  if (asset.type === 'SourceMap') {
    sourceMap = asset;
    asset = undefined;
  } else if (sourceMapRelations.length > 0) {
    sourceMap = sourceMapRelations[sourceMapRelations.length - 1].to;
  } else {
    throw new Error('No source map found');
  }

  var cssSourceMapConsumer = new mozilla.SourceMapConsumer(sourceMap.parseTree);

  const originalPosition = cssSourceMapConsumer.originalPositionFor({
    line,
    column
  });

  if (originalPosition && originalPosition.source) {
    originalPosition.url = assetGraph.resolveUrl(
      sourceMap.url,
      originalPosition.source
    );
    originalPosition.sourceAsset = assetGraph.addAsset(originalPosition.url);
    return originalPosition;
  } else {
    throw new Error(`No source mapping available for ${url}:${line}:${column}`);
  }
}

module.exports = trackingDog;
