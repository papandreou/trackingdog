const expect = require('unexpected');
const TrackingDog = require('./trackingDog');

describe('trackingDog', function() {
  describe('with a local file path', function() {
    describe('pointing at a JavaScript file', function() {
      it('should load the generated file and the source map, then work out the mapping', async function() {
        const trackingDog = new TrackingDog();
        expect(
          await trackingDog.track({
            url: 'testdata/existingJavaScriptSourceMap/jquery-1.10.1.min.js',
            line: 4,
            column: 19
          }),
          'to satisfy',
          {
            url: /^file:.*\/jquery-1.10.1.js/,
            source: 'jquery-1.10.1.js',
            line: 23,
            column: 1
          }
        );
      });
    });

    describe('pointing at a source map', function() {
      it('should load the generated file and the source map, then work out the mapping', async function() {
        const trackingDog = new TrackingDog();
        expect(
          await trackingDog.track({
            url: 'testdata/existingJavaScriptSourceMap/jquery-1.10.1.min.map',
            line: 4,
            column: 19
          }),
          'to satisfy',
          {
            url: /^file:.*\/jquery-1.10.1.js/,
            source: 'jquery-1.10.1.js',
            line: 23,
            column: 1
          }
        );
      });
    });

    describe('with a sourcesContent property', function() {
      it('should provide a sourceText based on the sourcesContent (despite the original source not being available)', async function() {
        const trackingDog = new TrackingDog();
        expect(
          await trackingDog.track({
            url: 'testdata/sourcesContent/source-map.min.js.map',
            line: 1,
            column: 439
          }),
          'to satisfy',
          {
            url: 'webpack:///source-map.js',
            source: 'webpack:///source-map.js',
            line: 6,
            column: 0,
            sourceText: expect.it(
              'to begin with',
              '/*\n * Copyright 2009-2011 Mozilla Foundation and contributors'
            )
          }
        );
      });
    });
  });

  describe('with an http(s) url', function() {
    it('should load the generated file and the source map, then work out the mapping', async function() {
      const trackingDog = new TrackingDog();
      expect(
        await trackingDog.track({
          url: 'https://code.jquery.com/jquery-1.10.1.min.js',
          line: 4,
          column: 19
        }),
        'to satisfy',
        {
          url: 'https://code.jquery.com/jquery-1.10.1.js',
          source: 'jquery-1.10.1.js',
          line: 23,
          column: 1
        }
      );
    });
  });
});
