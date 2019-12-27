!function (global) {
  'use strict';
  var version = '1.0.0';
  var registeredModules = {};
  var installedModules = {};
  var mainModule = false;

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

  function require(moduleId) {
    assertModuleId(moduleId);
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    if (!registeredModules[moduleId]) throw new Error('Module {' + moduleId + '} is not registered.');

    var module = installedModules[moduleId] = {
      id: moduleId,
      loaded: false,
      exports: {}
    };

    registeredModules[moduleId].call(module.exports, module, module.exports, require);

    module.loaded = true;

    return module.exports;
  }

  require.modules = registeredModules;
  require.cache = installedModules;

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
    if (!mainModule) {
      mainModule = true
      require(moduleId);
    } else {
      throw new Error('Call runAsMain only once.');
    }
  }

  global.bommon = {
    register: register,
    runAsMain: runAsMain,
    getVersion: getVersion
  };
}(window);
