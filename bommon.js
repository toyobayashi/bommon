!function (global) {
  'use strict';
  var version = '2.0.0';
  var registeredModules = {};
  var installedModules = {};
  var mainModule;
  var asyncScripts = {};
  var anonymousModule;

  function getVersion() {
    return version;
  }

  function isValidModuleId(moduleId) {
    return (typeof moduleId === 'string' && moduleId !== '') || typeof moduleId === 'number';
  }

  function assertModuleId(moduleId) {
    if (!isValidModuleId(moduleId)) {
      throw new TypeError('Module ID must be a non-null string or a number.');
    }
  }

  function getPromiseConstructor() {
    if (typeof global.Promise !== 'function') throw new Error('Your browser does not support Promise.');
    return global.Promise;
  }

  function loadScript(src, cache) {
    var Promise = getPromiseConstructor();

    var promise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var onScriptComplete;
      var onScriptError;
      var timeout;

      script.charset = 'utf-8';
      script.timeout = 120;
      script.src = src;

      onScriptComplete = function (_event) {
        script.onload = null;
        script.onerror = null;
        clearTimeout(timeout);
        if (cache) {
          cache[src] = 0;
        }
        resolve();
      };
      onScriptError = function (_event) {
        script.onload = null;
        script.onerror = null;
        clearTimeout(timeout);
        if (cache) {
          cache[src] = undefined;
        }
        reject(new Error('Failed to load script {' + src + '}.'));
      };
      timeout = setTimeout(function () {
        onScriptError({ type: 'timeout', target: script });
      }, 120000);
      script.onload = onScriptComplete;
      script.onerror = onScriptError;
      document.head.appendChild(script);
    });

    if (cache) {
      cache[src] = promise;
    }

    return promise;
  }

  function Module(id, parent) {
    this.id = id;
    this.loaded = false;
    this.exports = {};
    this.parent = parent;
    this.children = [];
  }

  Module.prototype.require = function (moduleId) {
    assertModuleId(moduleId);
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    if (!registeredModules[moduleId]) throw new Error('Module {' + moduleId + '} is not registered.');
    var module = installedModules[moduleId] = new Module(moduleId, this);
    registeredModules[moduleId].call(module.exports, module, module.exports, createRequireFromModule(module));
    module.loaded = true;
    this.children.push(module);
    return module.exports;
  };

  anonymousModule = new Module('anonymous', null);
  anonymousModule.loaded = true;

  function createDynamicImport(mod) {
    return function dynamicImport(src, moduleId) {
      var Promise = getPromiseConstructor();
      if (typeof src !== 'string') throw new TypeError('Script url must be a string.');

      var promise;
      var loadModule;

      loadModule = function () {
        if (isValidModuleId(moduleId)) {
          return mod.require(moduleId);
        }
      };

      if (asyncScripts[src] === 0) {
        promise = Promise.resolve();
      } else if (asyncScripts[src]) {
        promise = asyncScripts[src];
      } else {
        promise = loadScript(src, asyncScripts);
      }

      return promise.then(loadModule);
    };
  }

  function createRequireFromModule(mod) {
    function require(moduleId) {
      return mod.require(moduleId);
    }

    require.modules = registeredModules;
    require.cache = installedModules;
    require.main = mainModule;
    require.dynamicImport = createDynamicImport(mod);

    return require;
  }

  function register(moduleId, fn) {
    assertModuleId(moduleId);
    if (typeof fn !== 'function') throw new TypeError('Module body must be a function.');
    if (registeredModules[moduleId]) {
      if (global.console) {
        global.console.warn('Module {' + moduleId + '} has been registered.');
      }
      return;
    }
    registeredModules[moduleId] = fn;
  }

  function runAsMain(moduleId) {
    assertModuleId(moduleId);
    if (mainModule === undefined) {
      if (!registeredModules[moduleId]) throw new Error('Module {' + moduleId + '} is not registered.');
      var module = mainModule = installedModules[moduleId] = new Module(moduleId, null);
      registeredModules[moduleId].call(module.exports, module, module.exports, createRequireFromModule(module));
      module.loaded = true;
    } else {
      throw new Error('Call runAsMain only once.');
    }
  }

  global.bommon = {
    register: register,
    runAsMain: runAsMain,
    dynamicImport: createDynamicImport(anonymousModule),
    getVersion: getVersion
  };
}(window);
