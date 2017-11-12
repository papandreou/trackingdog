trackingdog
===========

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
```

Future ideas
============

- Recursively attempt to load the source file and see if it also has a source
  map reference (in case someone used a "dist" file in a bundle without using
  source-map-loader or equivalent)
- Support a local "workspace" directory à la Chrome Dev Tools
- Support getting the original source from the `sourcesContent` property of
  the source map
