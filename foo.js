const bloodhound = require('./lib/bloodhound');

const stackOne = `ApiError: Closed
  at e.<anonymous> (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:222:87367)
  at M (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:165:334825)
  at Generator.c._invoke (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:165:334620)
  at Generator.e.(anonymous function) [as next] (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:165:335004)
  at r (https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:222:67968)
  at https://mail-static.cdn-one.com/bundle.webmail-touch.3d9ac5fef9.js:222:68062
  at <anonymous>
`;

// ApiError: Closed
//   at e.<anonymous> (https://mail-static.cdn-one.com/src/common/lib/Api.js:734:18)
//   at M (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:114:0)
//   at Generator.c._invoke (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:324:0)
//   at Generator.e.(anonymous function) [as next] (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:162:0)
//   at r (https://mail-static.cdn-one.com/package.json:2:26)
//   at  (https://mail-static.cdn-one.com/package.json:2:26)
//   at <anonymous>

const stackTwo = `u@https://mail-static.cdn-one.com/bundle.webmail-touch.ffaadf7eed.js:110:98194
https://mail-static.cdn-one.com/bundle.webmail-touch.ffaadf7eed.js:222:87374
M@https://mail-static.cdn-one.com/bundle.webmail-touch.ffaadf7eed.js:165:334866
https://mail-static.cdn-one.com/bundle.webmail-touch.ffaadf7eed.js:165:334658
r@https://mail-static.cdn-one.com/bundle.webmail-touch.ffaadf7eed.js:222:67968
https://mail-static.cdn-one.com/bundle.webmail-touch.ffaadf7eed.js:222:68063
promiseReactionJob@[native code]`;

// at u (https://mail-static.cdn-one.com/node_modules/createerror/lib/createError.js:96:0)
// at  (https://mail-static.cdn-one.com/src/common/lib/Api.js:734:31)
// at M (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:115:0)
// at  (https://mail-static.cdn-one.com/node_modules/regenerator-runtime/runtime.js:324:0)
// at r (https://mail-static.cdn-one.com/package.json:2:26)
// at  (https://mail-static.cdn-one.com/package.json:2:26)
// promiseReactionJob@[native code]

(async () => {
  console.log(stackOne);

  console.log('\n\n>>>>\n\n');

  console.log(await bloodhound(stackOne));

  console.log('\n\n', '='.repeat(80), '\n');

  console.log(stackTwo);

  console.log('\n\n>>>>\n\n');

  console.log(await bloodhound(stackTwo));
})();
