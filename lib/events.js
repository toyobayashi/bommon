!function (root, factory) {
  /* eslint-disable */
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    exports['events'] = factory();
  } else if (typeof bommon === 'object' && bommon !== null && typeof bommon.register === 'function') {
    bommon.register('events', function (module) { module.exports = factory(); });
  } else {
    root.nodejs = root.nodejs || {};
    root.nodejs['events'] = factory();
  }
  /* eslint-enable */
}(this, function () {
  // 'events' module extracted from Node.js v12.14.0

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  'use strict';

  var apply = Function.prototype.apply;

  var spliceOne;

  function EventEmitter() {
    EventEmitter.init.call(this);
  }

  // Backwards-compat with node 0.10.x
  EventEmitter.EventEmitter = EventEmitter;

  EventEmitter.usingDomains = false;

  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._eventsCount = 0;
  EventEmitter.prototype._maxListeners = undefined;

  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  var defaultMaxListeners = 10;

  function checkListener(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof value);
    }
  }

  try {
    Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
      enumerable: true,
      get: function () {
        return defaultMaxListeners;
      },
      set: function (arg) {
        if (typeof arg !== 'number' || arg < 0 || isNaN(arg)) {
          throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg);
        }
        defaultMaxListeners = arg;
      }
    });
  } catch (_e) {
    EventEmitter.defaultMaxListeners = defaultMaxListeners;
  }

  EventEmitter.init = function () {
    try {
      if (this._events === undefined ||
        this._events === Object.getPrototypeOf(this)._events) {
        this._events = Object.create(null);
        this._eventsCount = 0;
      }
    } catch (_e) {
      if (this._events === undefined) {
        this._events = {};
        this._eventsCount = 0;
      }
    }

    this._maxListeners = this._maxListeners || undefined;
  };

  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n)) {
      throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n);
    }
    this._maxListeners = n;
    return this;
  };

  function _getMaxListeners(that) {
    if (that._maxListeners === undefined)
      return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return _getMaxListeners(this);
  };

  // Returns the length and line number of the first sequence of `a` that fully
  // appears in `b` with a length of at least 4.
  function identicalSequenceRange(a, b) {
    for (var i = 0; i < a.length - 3; i++) {
      // Find the first entry of b that matches the current entry of a.
      var pos = b.indexOf(a[i]);
      if (pos !== -1) {
        var rest = b.length - pos;
        if (rest > 3) {
          var len = 1;
          var maxLen = Math.min(a.length - i, rest);
          // Count the number of consecutive entries.
          while (maxLen > len && a[i + len] === b[pos + len]) {
            len++;
          }
          if (len > 3) {
            return [len, i];
          }
        }
      }
    }

    return [0, 0];
  }

  function enhanceStackTrace(err, own) {
    var ctorInfo = '';
    try {
      var name = this.constructor.name;
      if (name !== 'EventEmitter')
        ctorInfo = ' on ' + name + ' instance';
    } catch (_e) {}
    var sep = '\nEmitted \'error\' event' + ctorInfo + ' at:\n';

    var errStack = err.stack.split('\n').slice(1);
    var ownStack = own.stack.split('\n').slice(1);

    var arr = identicalSequenceRange(ownStack, errStack);
    var len = arr[0];
    var off = arr[1];
    if (len > 0) {
      ownStack.splice(off + 1, len - 2, '    [... lines matching original stack trace ...]');
    }

    return err.stack + sep + ownStack.join('\n');
  }

  EventEmitter.prototype.emit = function emit() {
    var type = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1);
    var doError = (type === 'error');

    var events = this._events;
    if (events !== undefined)
      doError = (doError && events.error === undefined);
    else if (!doError)
      return false;

    // If there is no 'error' event listener then throw.
    if (doError) {
      var er;
      if (args.length > 0)
        er = args[0];
      if (er instanceof Error) {
        try {
          var capture = {};
          // eslint-disable-next-line no-restricted-syntax
          Error.captureStackTrace(capture, EventEmitter.prototype.emit);
          Object.defineProperty(er, 'kEnhanceStackBeforeInspector', {
            value: enhanceStackTrace.bind(this, er, capture),
            configurable: true
          });
        } catch (_e) {}

        // Note: The comments on the `throw` lines are intentional, they show
        // up in Node's output if this results in an unhandled exception.
        throw er; // Unhandled 'error' event
      }

      var stringifiedEr;

      try {
        stringifiedEr = er.toString();
      } catch (_e) {
        stringifiedEr = er;
      }

      // At least give some kind of context to the user
      var err = new Error('Unhandled error. ' + stringifiedEr);
      err.context = er;
      throw err; // Unhandled 'error' event
    }

    var handler = events[type];

    if (handler === undefined)
      return false;

    if (typeof handler === 'function') {
      apply.call(handler, this, args);
    } else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);
      for (var i = 0; i < len; ++i)
        apply.call(listeners[i], this, args);
    }

    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;

    checkListener(listener);

    events = target._events;
    if (events === undefined) {
      events = target._events = Object.create(null);
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener !== undefined) {
        target.emit('newListener', type, listener.listener ? listener.listener : listener);

        // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object
        events = target._events;
      }
      existing = events[type];
    }

    if (existing === undefined) {
      // Optimize the case of one listener. Don't need the extra array object.
      events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
        // If we've already got an array, just append.
      } else if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }

      // Check for listener leak
      m = _getMaxListeners(target);
      if (m > 0 && existing.length > m && !existing.warned) {
        existing.warned = true;
        // No error code for this since it is a Warning
        // eslint-disable-next-line no-restricted-syntax
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + String(type) + ' listeners ' +
                            'added to ' + target + '. Use ' +
                            'emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console !== 'undefined') {
          console.warn(w);
        }
      }
    }

    return target;
  }

  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener =
      function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };

  function createOnceWrapper(that) {
    return function onceWrapper() {
      if (!that.fired) {
        that.target.removeListener(that.type, that.wrapFn);
        that.fired = true;
        if (arguments.length === 0)
          return that.listener.call(that.target);
        return that.listener.apply(that.target, arguments);
      }
    };
  }

  function _onceWrap(target, type, listener) {
    var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
    var wrapped = createOnceWrapper(state);
    wrapped.listener = listener;
    state.wrapFn = wrapped;
    return wrapped;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    checkListener(listener);

    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener =
      function prependOnceListener(type, listener) {
        checkListener(listener);

        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };

  // Emits a 'removeListener' event if and only if the listener was removed.
  EventEmitter.prototype.removeListener =
      function removeListener(type, listener) {
        var originalListener;

        checkListener(listener);

        var events = this._events;
        if (events === undefined)
          return this;

        var list = events[type];
        if (list === undefined)
          return this;

        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit('removeListener', type, list.listener || listener);
          }
        } else if (typeof list !== 'function') {
          var position = -1;

          for (var i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }

          if (position < 0)
            return this;

          if (position === 0)
            list.shift();
          else {
            if (spliceOne === undefined)
              spliceOne = function spliceOne(list, index) {
                for (; index + 1 < list.length; index++)
                  list[index] = list[index + 1];
                list.pop();
              };
            spliceOne(list, position);
          }

          if (list.length === 1)
            events[type] = list[0];

          if (events.removeListener !== undefined)
            this.emit('removeListener', type, originalListener || listener);
        }

        return this;
      };

  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

  EventEmitter.prototype.removeAllListeners =
      function removeAllListeners(type) {
        var events = this._events;
        if (events === undefined)
          return this;

        // Not listening for removeListener, no need to emit
        if (events.removeListener === undefined) {
          if (arguments.length === 0) {
            this._events = Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== undefined) {
            if (--this._eventsCount === 0)
              this._events = Object.create(null);
            else
              delete events[type];
          }
          return this;
        }

        // Emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          for (var key in events) {
            if (Object.prototype.hasOwnProperty.call(events, key)) {
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
          }
          this.removeAllListeners('removeListener');
          this._events = Object.create(null);
          this._eventsCount = 0;
          return this;
        }

        var listeners = events[type];

        if (typeof listeners === 'function') {
          this.removeListener(type, listeners);
        } else if (listeners !== undefined) {
          // LIFO order
          for (var i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }

        return this;
      };

  function _listeners(target, type, unwrap) {
    var events = target._events;

    if (events === undefined)
      return [];

    var evlistener = events[type];
    if (evlistener === undefined)
      return [];

    if (typeof evlistener === 'function')
      return unwrap ? [evlistener.listener || evlistener] : [evlistener];

    return unwrap ?
      unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
  }

  EventEmitter.prototype.listeners = function listeners(type) {
    return _listeners(this, type, true);
  };

  EventEmitter.prototype.rawListeners = function rawListeners(type) {
    return _listeners(this, type, false);
  };

  EventEmitter.listenerCount = function (emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount;
  function listenerCount(type) {
    var events = this._events;

    if (events !== undefined) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener !== undefined) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? ownKeys(this._events) : [];
  };

  function arrayClone(arr, n) {
    var copy = new Array(n);
    for (var i = 0; i < n; ++i)
      copy[i] = arr[i];
    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }
    return ret;
  }

  function once(emitter, name) {
    if (typeof Promise !== 'function') throw new Error('Need Promise polyfill.');
    return new Promise(function (resolve, reject) {
      if (typeof emitter.addEventListener === 'function') {
        // EventTarget does not have `error` event semantics like Node
        // EventEmitters, we do not listen to `error` events here.
        emitter.addEventListener(
          name,
          function () { resolve(Array.prototype.slice.call(arguments)); },
          { once: true }
        );
        return;
      }

      var eventListener = function () {
        var args = Array.prototype.slice.call(arguments);
        if (errorListener !== undefined) {
          emitter.removeListener('error', errorListener);
        }
        resolve(args);
      };
      var errorListener;

      // Adding an error listener is not optional because
      // if an error is thrown on an event emitter we cannot
      // guarantee that the actual event we are waiting will
      // be fired. The result could be a silent way to create
      // memory or file descriptor leaks, which is something
      // we should avoid.
      if (name !== 'error') {
        errorListener = function (err) {
          emitter.removeListener(name, eventListener);
          reject(err);
        };

        emitter.once('error', errorListener);
      }

      emitter.once(name, eventListener);
    });
  }

  function ownKeys(obj) {
    var res;
    try {
      // eslint-disable-next-line
      res = Reflect.ownKeys(obj);
    } catch (_e) {
      res = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          res.push(key);
        }
      }
      if (Object.prototype.toString.call(obj) === '[object Array]') {
        res.push('length');
      }
    }

    return res;
  }

  EventEmitter.once = once;
  return EventEmitter;
});
