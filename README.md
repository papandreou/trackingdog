## trackingdog

Find the source location of a line/column in a generated file. Supports
JavaScript and CSS, local files and http urls.

Installation:

```sh
npm install -g trackingdog
```

Usage example:

```sh
$ trackingdog http://charcod.es/static/bundle-44.0449b572b5.js:4:22208
http://charcod.es/js/app.js:95:0
```

You can map local folders in as workspaces (à la Chrome Dev Tools) and have
the remote files mapped to paths local to your filesystem:

```sh
$ trackingdog --workspace http://charcod.es/js=./src http://charcod.es/static/bundle-44.0449b572b5.js:4:22208
./src/app.js:95:0
```

If the referenced source file can be retrieved, you'll get a bit of context:

```js
$ trackingdog https://code.jquery.com/jquery-1.10.1.min.js:4:745
https://code.jquery.com/jquery-1.10.1.js:109:16
			jQuery.ready();
		}
	},
	// Clean-up method for dom ready events
	detach = function() {
		if ( document.addEventListener ) {
                ^
```

If the source asset is available as a local file, the output will be a
CWD-relative path with :\<line\>:\<column\> appended:

```
$ trackingdog path/to/jquery-1.10.1.min.js:4:745
testdata/existingJavaScriptSourceMap/jquery-1.10.1.js:109:16
```

That means you can use it to build a command line to open an editor that
supports that syntax for jumping directly to a specific line/column:

```sh
atom `trackingdog path/to/jquery-1.10.1.min.js:4:745`
code -g `trackingdog path/to/jquery-1.10.1.min.js:4:745`
```

# Programmatic usage

The main export of the package is a `TrackingDog` class that can be used
to track one or more source locations via the `track` method. The assets
loaded and parsed as part of this effort are cached in the instance, so
it's cheaper to track more source locations in the same files.

Example usage:

```js
const TrackingDog = require('trackingdog');

const dog = new TrackingDog();

const { url, line, column } = await dog.track({
  url: 'https://code.jquery.com/jquery-1.10.1.min.js',
  line: 4,
  column: 19
});

console.log(`Yay, the location in the original source is ${url}:${line}:${column}`);
```

# Future ideas

* Recursively attempt to load the source file and see if it also has a source
  map reference (in case someone used a "dist" file in a bundle without using
  source-map-loader or equivalent)
