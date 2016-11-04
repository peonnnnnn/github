// var fs = require('fs')
// var path = require('path')
//
// var babel = require('babel-core')
//
// var cacheKeyData = [
//   fs.readFileSync(path.join(__dirname, '.babelrc')),
//   fs.readFileSync(path.join(__dirname, 'schema.json')),
//   fs.readFileSync(path.join(__dirname, 'relay-babel.js'))
// ].join('\n')
//
// module.exports = {
//   getCacheKeyData: function () {
//     return cacheKeyData
//   },
//
//   transpile: function (source, filename, options, meta) {
//     console.log("compiling 1", meta)
//     if (filename.indexOf('test.omg') !== -1) {
//       console.log("GOT ME SOME TOML")
//       console.log(source)
//       var toml = require('toml')
//       var parsed = toml.parse(source)
//       console.log(parsed)
//       return {code: "module.exports = " + JSON.stringify(parsed)}
//     }
//
//     console.log("compiling 2")
//     const result = babel.transform(source, {
//       sourceRoot: __dirname,
//       filename: filename
//     })
//     console.log("compiling 3")
//     console.dir(result)
//     return {code: result.code, map: result.map}
//   }
// }
