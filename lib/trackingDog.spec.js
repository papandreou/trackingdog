const expect = require('unexpected');
const trackingDog = require('./trackingDog');

describe('trackingDog', function() {
  describe('with a local file path', function() {
    describe('pointing at a JavaScript file', function() {
      it('should load the generated file and the source map, then work out the mapping', async function() {
        expect(
          await trackingDog({
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
        expect(
          await trackingDog({
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
  });
});
