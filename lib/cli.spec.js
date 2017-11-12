const run = require('./run');
const pathModule = require('path');
const expect = require('unexpected');

describe('cli', function() {
  it('should output the mapped source location', async function() {
    let stdout;
    let stderr;
    try {
      [stdout, stderr] = await run([
        pathModule.resolve(__dirname, 'cli.js'),
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
      ]);
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

    expect(
      stdout,
      'when decoded as',
      'utf-8',
      'to equal',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1\n'
    );
  });

  it('should support passing the line and column numbers as separate arguments', async function() {
    let stdout;
    let stderr;
    try {
      [stdout, stderr] = await run([
        pathModule.resolve(__dirname, 'cli.js'),
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
      ]);
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

    expect(
      stdout,
      'when decoded as',
      'utf-8',
      'to equal',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1\n'
    );
  });

  it('should support passing line:column as a separate argument', async function() {
    let stdout;
    let stderr;
    try {
      [stdout, stderr] = await run([
        pathModule.resolve(__dirname, 'cli.js'),
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
      ]);
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

    expect(
      stdout,
      'when decoded as',
      'utf-8',
      'to equal',
      'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:23:1\n'
    );
  });

  describe('with the --context switch', function() {
    it('should output a code snippet with a bit of context', async function() {
      let stdout;
      let stderr;
      try {
        [stdout, stderr] = await run([
          pathModule.resolve(__dirname, 'cli.js'),
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
        ]);
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

      expect(
        stdout,
        'when decoded as',
        'utf-8',
        'to equal',
        'testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:109:16\n' +
          '\t\t\tjQuery.ready();\n' +
          '\t\t}\n' +
          '\t},\n' +
          '\t// Clean-up method for dom ready events\n' +
          '\tdetach = function() {\n' +
          '\t\tif ( document.addEventListener ) {\n' +
          '                ^\n'
      );
    });
  });
});
