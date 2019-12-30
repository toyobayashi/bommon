
class MyUMDPlugin {
  apply (compiler) {
    compiler.hooks.emit.tapAsync('MyUMDPlugin', function(compilation, callback) {
      Object.keys(compilation.assets).forEach(key => {
        const libname = key.split('.')[0]
        const a = compilation.assets[key]
        console.log(a._source.children[1]._source._value)
        let bootstrap = a._source.children[1]._source._value
        const start = bootstrap.indexOf('// expose the modules object (__webpack_modules__)')
        const end = bootstrap.indexOf('return __webpack_require__(__webpack_require__.s')
        a._source.children[1]._source._value = bootstrap.substring(0, start) + bootstrap.substring(end)
        a._source.children.unshift(
`!function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    exports['${libname}'] = factory();
  } else if (typeof bommon === 'object' && bommon !== null && typeof bommon.register === 'function') {
    bommon.register('${libname}', function (module) { module.exports = factory(); });
  } else {
    root.nodejs = root.nodejs || {};
    root.nodejs['${libname}'] = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
return `)
        a._source.children.push('\n});')
      })
      callback()
    })
  }
}

module.exports = MyUMDPlugin
