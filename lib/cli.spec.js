const run = require('./run');
const pathModule = require('path');
const expect = require('unexpected').clone();

expect.addAssertion(
  '<object> to yield output <string>',
  async (expect, subject, expectedOutput) => {
    const { args = [], stdin } = subject;

    let stdout;
    let stderr;
    try {
      [stdout, stderr] = await run(
        [pathModule.resolve(__dirname, 'cli.js'), ...args],
        stdin
      );
    } catch (err) {
      if (err.stderr) {
        expect.fail(
          `Child process exited with ${err.code} and stderr ${err.stderr}`
        );
      } else {
        throw err;
      }
    }

    expect(stderr, 'when decoded as', 'utf-8', 'to equal', '');

    expect(stdout, 'when decoded as', 'utf-8', 'to equal', expectedOutput);
  }
);

expect.addAssertion(
  '<array> to yield output <string>',
  async (expect, args, expectedOutput) => {
    return expect({ args }, 'to yield output', expectedOutput);
  }
);

describe('cli', function() {
  it('should output the mapped source location', async function() {
    await expect(
      [
        pathModule.relative(
          process.cwd(),
          pathModule.resolve(
            __dirname,
            '..',
            'testdata',
            'existingJavaScriptSourceMap',
            'jquery-1.10.1.min.js'
          )
        ) + ':4:19'
      ],
      'to yield output',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1\n'
    );
  });

  it('should support passing the line and column numbers as separate arguments', async function() {
    await expect(
      [
        pathModule.relative(
          process.cwd(),
          pathModule.resolve(
            __dirname,
            '..',
            'testdata',
            'existingJavaScriptSourceMap',
            'jquery-1.10.1.min.js'
          )
        ),
        '4',
        '19'
      ],
      'to yield output',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1\n'
    );
  });

  it('should support passing line:column as a separate argument', async function() {
    await expect(
      [
        pathModule.relative(
          process.cwd(),
          pathModule.resolve(
            __dirname,
            '..',
            'testdata',
            'existingJavaScriptSourceMap',
            'jquery-1.10.1.min.js'
          )
        ),
        '4',
        '19'
      ],
      'to yield output',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1\n'
    );
  });

  describe('with the --context switch', function() {
    it('should output a code snippet with a bit of context', async function() {
      await expect(
        [
          '--context',
          pathModule.relative(
            process.cwd(),
            pathModule.resolve(
              __dirname,
              '..',
              'testdata',
              'existingJavaScriptSourceMap',
              'jquery-1.10.1.min.js'
            )
          ),
          '4',
          '745'
        ],
        'to yield output',
        'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:109:16\n' +
          '\t\t\tjQuery.ready();\n' +
          '\t\t}\n' +
          '\t},\n' +
          '\t// Clean-up method for dom ready events\n' +
          '\tdetach = function() {\n' +
          '\t\tif ( document.addEventListener ) {\n' +
          '                ^\n' +
          '\t\t\tdocument.removeEventListener( "DOMContentLoaded", completed, false );\n' +
          '\t\t\twindow.removeEventListener( "load", completed, false );\n' +
          '\n'
      );
    });
  });
});
