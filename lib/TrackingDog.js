const AssetGraph = require('assetgraph');

class TrackingDog {
  constructor({ assetGraph, root } = {}) {
    this.assetGraph = assetGraph || new AssetGraph({ root });
    this.warnings = [];
    this.assetGraph.on('warn', (err) => {
      this.warnings.push(err);
    });
    this.checkedAssets = new Set();
  }

  async track({ url, line, column }) {
    let asset = this.assetGraph.addAsset(url);
    await asset.load();

    const sourceMapRelations = asset.outgoingRelations.filter((relation) =>
      /SourceMappingUrl$/.test(relation.type)
    );
    if (sourceMapRelations.length > 0) {
      for (const sourceMapRelation of sourceMapRelations) {
        await sourceMapRelation.to.load();
      }
    }

    let noSourceMapReferencedMessage = 'No source map referenced';
    let sourceMap;
    if (asset.type === 'SourceMap') {
      sourceMap = asset;
      asset = undefined;
    } else if (sourceMapRelations.length > 0) {
      sourceMap = sourceMapRelations[sourceMapRelations.length - 1].to;
    } else if (!asset.isInline) {
      sourceMap = this.assetGraph.addAsset(`${asset.url}.map`);
      noSourceMapReferencedMessage += `, also tried ${sourceMap.url}`;
      try {
        await sourceMap.load();
      } catch (err) {
        throw new Error(noSourceMapReferencedMessage);
      }
    } else {
      throw new Error(noSourceMapReferencedMessage);
    }
    if (sourceMap.type !== 'SourceMap') {
      // Hack: Try to recover from a misconfigured server that sends eg. Content-Type: application/javascript
      try {
        sourceMap = sourceMap.replaceWith({
          type: 'SourceMap',
          rawSrc: sourceMap._rawSrc,
        });
      } catch (err) {
        throw new Error(noSourceMapReferencedMessage);
      }
    }

    const originalPosition = sourceMap.originalPositionFor({
      line,
      column,
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
      originalPosition.sourceAsset = this.assetGraph.addAsset(
        originalPosition.url
      );
      const assetsToCheck = this.assetGraph
        .findAssets()
        .filter((asset) => !this.checkedAssets.has(asset));
      for (const asset of assetsToCheck) {
        this.assetGraph.checkIncompatibleTypesForAsset(asset);
        this.checkedAssets.add(asset);
      }
      return originalPosition;
    } else {
      throw new Error(
        `A source map for ${url} was found, but it did not contain mappings for :${line}:${column}`
      );
    }
  }
}

module.exports = TrackingDog;
