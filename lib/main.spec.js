const pathModule = require('path');
const sinon = require('sinon');
const processError = require('./processError');
process.argv.push('--no-color'); // So that supports-color doesn't return true

const expect = require('unexpected')
  .clone()
  .use(require('unexpected-sinon'));

const main = require('./main');

describe('main', function() {
  let mockConsole;
  let stdin;
  beforeEach(async function() {
    mockConsole = { log: sinon.spy() };
    stdin = undefined;
  });

  expect.addAssertion(
    '<array> to yield output <string|array>',
    async (expect, switches, output) => {
      if (!Array.isArray(output)) {
        output = [output];
      }
      const cwd = pathModule.resolve(__dirname, '..');
      await main(cwd, switches, mockConsole, async () => stdin);
      expect(mockConsole.log, 'to have calls satisfying', () => {
        for (const str of output) {
          mockConsole.log(str);
        }
      });
    }
  );

  it('should output the mapped source location', async function() {
    await expect(
      ['testdata/existingJavaScriptSourceMap/jquery-1.10.1.min.js:4:19'],
      'to yield output',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1'
    );
  });

  it('should support passing the line and column numbers as separate arguments', async function() {
    await expect(
      ['testdata/existingJavaScriptSourceMap/jquery-1.10.1.min.js', '4', '19'],
      'to yield output',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1'
    );
  });

  it('should support passing line:column as a separate argument', async function() {
    await expect(
      ['testdata/existingJavaScriptSourceMap/jquery-1.10.1.min.js', '4:19'],
      'to yield output',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1'
    );
  });

  describe('with the --context switch', function() {
    it('should output a code snippet with a bit of context', async function() {
      await expect(
        [
          '--context',
          'testdata/existingJavaScriptSourceMap/jquery-1.10.1.min.js',
          '4',
          '745'
        ],
        'to yield output',
        [
          'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:109:16',
          '\t\t\tjQuery.ready();\n' +
            '\t\t}\n' +
            '\t},\n' +
            '\t// Clean-up method for dom ready events\n' +
            '\tdetach = function() {\n' +
            '\t\tif ( document.addEventListener ) {\n' +
            '                ^\n' +
            '\t\t\tdocument.removeEventListener( "DOMContentLoaded", completed, false );\n' +
            '\t\t\twindow.removeEventListener( "load", completed, false );\n'
        ]
      );
    });
  });

  describe('while passing a stack trace on stdin', () => {
    it('should output a sourcemapped stacktrace', async () => {
      stdin =
        'ApiError: Closed\n' +
        '  at e.<anonymous> (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:222:87367)\n' +
        '  at M (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:165:334825)\n' +
        '  at Generator.c._invoke (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:165:334620)\n' +
        '  at Generator.e.(anonymous function) [as next] (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:165:335004)\n' +
        '  at r (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:222:67968)\n' +
        '  at https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:222:68062\n' +
        '  at <anonymous>\n';

      await expect(
        [],
        'to yield output',
        'ApiError: Closed\n' +
          '  at e.<anonymous> (https://mail-static.cdn-one.com/src/common/lib/Api.js:734:18)\n' +
          '  at M (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:114:0)\n' +
          '  at Generator.c._invoke (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:324:0)\n' +
          '  at Generator.e.(anonymous function) [as next] (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:162:0)\n' +
          '  at r (https://mail-static.cdn-one.com/package.json:2:26)\n' +
          '  at  (https://mail-static.cdn-one.com/package.json:2:26)\n' +
          '  at <anonymous>\n'
      );
    });
  });

  it('should report the url when the source map cannot be retrieved via HTTP', () => {
    return require('httpception')(
      {
        request: 'GET https://example.com/404.map',
        response: 404
      },
      async () => {
        const err = await expect(
          main(
            pathModule.resolve(__dirname, '..'),
            [pathModule.join('testdata', 'sourceMap404', 'foo.js'), '1', '4'],
            mockConsole,
            async () => stdin
          ),
          'to be rejected'
        );
        const processedError = processError(err);
        expect(
          processedError.customOutput,
          'to equal',
          `HTTP 404 Not Found: https://example.com/404.map
Including assets:
    testdata/sourceMap404/foo.js
`
        );
      }
    );
  });
});
