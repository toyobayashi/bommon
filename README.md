# bommon

CommonJS in browser.

Support IE.

# Usage

First add script tag in HTML.

``` html
<script src="bommon.js"></script>
```

Common Usage.

``` js
bommon.register('main', function (module, exports, require) {
  document.write('main starting<br/>');
  var a = require('a');
  var b = require('b');
  document.write('in main, a.done = ' + a.done + ', b.done = ' + b.done + '<br/>');
});

bommon.register('a', function (module, exports, require) {
  document.write('a starting<br/>');
  exports.done = false;
  var b = require('b');
  document.write('in a, b.done = ' + b.done + '<br/>');
  exports.done = true;
  document.write('a done<br/>');
});

bommon.register('b', function (module, exports, require) {
  document.write('b starting<br/>');
  exports.done = false;
  var a = require('a');
  document.write('in b, a.done = ' + a.done + '<br/>');
  exports.done = true;
  document.write('b done<br/>');
});

bommon.runAsMain('main');
```

Output:

```
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done = true, b.done = true
```

Support dynamic import like ES `import()`.

Global call:

``` js
// /root/path/to/async-module.js
bommon.register('moduleId', function (module, exports, require) {
  module.exports = { key: 'value' };
});

// in your page
bommon.dynamicImport('/root/path/to/async-module.js', 'moduleId').then(function (mod) {
  console.log(mod.key); // value
});
```

Call in module:

``` js
// /root/path/to/async-module.js
bommon.register('moduleId', function (module, exports, require) {
  module.exports = { key: 'value' };
});

// in your module
bommon.register('mainModule', function (module, exports, require) {
  require.dynamicImport('/root/path/to/async-module.js', 'moduleId').then(function (mod) {
    console.log(mod.key); // value
  });
})
```

See `test/bommon.html`.

## API

### export function register(moduleId: string | number, fn: (module: Module, exports: any, require: BommonRequireFunction) => void): void

Register a module.

### export function runAsMain(moduleId: string | number): void

Run the entry module.

### export function getVersion(): string

Get the version of bommon.

### export function dynamicImport(src: string, moduleId?: string | number): Promise\<any\>

Load a script and then require the module.

If `moduleId` is not specified, just load script and return `Promise<void>`.

**Note: this API require browser supporting `Promise` or a polyfill. Minimal version does not include this API.**

### declare class Module

``` ts
declare class Module {
  constructor(id: string | number, parent: Module | null)
  id: string | number;
  loaded: boolean;
  exports: any;
  parent: Module; // Full version only
  children: Module[]; // Full version only

  require(moduleId: string | number): any // Full version only
}
```

### declare type BommonRequireFunction

``` ts
declare type BommonRequireFunction = {
  (moduleId: string | number): any;
  modules: { [key: string]: Function };
  cache: { [key: string]: Module };
  main?: Module; // Full version only
  dynamicImport(src: string, moduleId?: string | number): Promise<any>; // Full version only
}
```

## License

* MIT
