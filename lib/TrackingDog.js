const AssetGraph = require('assetgraph');

class TrackingDog {
  constructor({ assetGraph, root } = {}) {
    this.assetGraph = assetGraph || new AssetGraph({ root });
  }

  async track({ url, line, column, inverse }) {
    let asset = this.assetGraph.addAsset(url);
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
    if (inverse) {
      // The source-map library does some internal normalization that necessitates this:
      inverse = inverse.replace(/^webpack:\/\/\/\.\//, 'webpack:///');

      const generatedPosition = sourceMap.generatedPositionFor({
        source: inverse,
        line,
        column
      });
      generatedPosition.url = this.assetGraph.resolveUrl(
        sourceMap.nonInlineAncestor.url,
        sourceMap.parseTree.file
      );
      generatedPosition.sourceAsset = this.assetGraph.addAsset(
        generatedPosition.url
      );
      return generatedPosition;
    } else {
      const originalPosition = sourceMap.originalPositionFor({
        line,
        column
      });
      if (originalPosition && originalPosition.source) {
        originalPosition.url = this.assetGraph.resolveUrl(
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
              originalPosition.source.replace(
                /^webpack:\/\/\//,
                'webpack:///./'
              )
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
        originalPosition.sourceAsset = this.assetGraph.addAsset(
          originalPosition.url
        );
        return originalPosition;
      }
    }
    throw new Error(`No source mapping available for ${url}:${line}:${column}`);
  }
}

module.exports = TrackingDog;
