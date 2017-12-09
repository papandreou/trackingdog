const AssetGraph = require('assetgraph');

async function trackingDog({ root, url, line, column }) {
  const assetGraph = new AssetGraph({ root });
  let asset = assetGraph.addAsset(url);
  await asset.load();
  const sourceMapRelations = asset.outgoingRelations.filter(relation =>
    /SourceMappingUrl$/.test(relation.type)
  );
  if (sourceMapRelations.length > 0) {
    for (const sourceMapRelation of sourceMapRelations) {
      await sourceMapRelation.to.load();
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

  const originalPosition = sourceMap.originalPositionFor({
    line,
    column
  });

  if (originalPosition && originalPosition.source) {
    originalPosition.url = assetGraph.resolveUrl(
      sourceMap.url,
      originalPosition.source
    );
    if (
      Array.isArray(sourceMap.parseTree.sources) &&
      Array.isArray(sourceMap.parseTree.sourcesContent)
    ) {
      let sourcesIndex = sourceMap.parseTree.sources.indexOf(
        originalPosition.source
      );
      if (sourcesIndex === -1) {
        // Try a workaround for a weird webpackism:
        sourcesIndex = sourceMap.parseTree.sources.indexOf(
          originalPosition.source.replace(/^webpack:\/\/\//, 'webpack:///./')
        );
      }
      if (sourcesIndex === -1) {
        // Try a workaround for another weird webpackism:
        sourcesIndex = sourceMap.parseTree.sources.indexOf(
          originalPosition.source.replace(/^webpack:\/\/\//, 'webpack:////')
        );
      }
      if (
        sourcesIndex !== -1 &&
        sourcesIndex < sourceMap.parseTree.sourcesContent.length
      ) {
        originalPosition.sourceText =
          sourceMap.parseTree.sourcesContent[sourcesIndex];
      }
    }
    originalPosition.sourceAsset = assetGraph.addAsset(originalPosition.url);
    return originalPosition;
  } else {
    throw new Error(`No source mapping available for ${url}:${line}:${column}`);
  }
}

module.exports = trackingDog;
