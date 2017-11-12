trackingdog
===========

Find the source location of a line/column in a generated file. Supports
both local files and http urls.

Installation:

```sh
npm install -g trackingdog
```

Usage example:

```sh
$ trackingdog http://charcod.es/static/bundle-44.0449b572b5.js:4:22208
http://charcod.es/js/app.js:95:0
```

Future ideas
============

- Recursively attempt to load the source file and see if it also has a source
  map reference (in case someone used a "dist" file in a bundle without using
  source-map-loader or equivalent)
- Support a local "workspace" directory à la Chrome Dev Tools
