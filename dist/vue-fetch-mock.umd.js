(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global['vue-fetch-mock'] = {}));
}(this, (function (exports) { 'use strict';

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /**
   * Helpers.
   */

  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === 'string' && val.length > 0) {
      return parse(val);
    } else if (type === 'number' && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      'val is not a non-empty string or a valid number. val=' +
        JSON.stringify(val)
    );
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();
    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;
      case 'days':
      case 'day':
      case 'd':
        return n * d;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;
      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;
      default:
        return undefined;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtShort(ms) {
    if (ms >= d) {
      return Math.round(ms / d) + 'd';
    }
    if (ms >= h) {
      return Math.round(ms / h) + 'h';
    }
    if (ms >= m) {
      return Math.round(ms / m) + 'm';
    }
    if (ms >= s) {
      return Math.round(ms / s) + 's';
    }
    return ms + 'ms';
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtLong(ms) {
    return plural(ms, d, 'day') ||
      plural(ms, h, 'hour') ||
      plural(ms, m, 'minute') ||
      plural(ms, s, 'second') ||
      ms + ' ms';
  }

  /**
   * Pluralization helper.
   */

  function plural(ms, n, name) {
    if (ms < n) {
      return;
    }
    if (ms < n * 1.5) {
      return Math.floor(ms / n) + ' ' + name;
    }
    return Math.ceil(ms / n) + ' ' + name + 's';
  }

  var debug = createCommonjsModule(function (module, exports) {
  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
  exports.coerce = coerce;
  exports.disable = disable;
  exports.enable = enable;
  exports.enabled = enabled;
  exports.humanize = ms;

  /**
   * The currently active debug mode names, and names to skip.
   */

  exports.names = [];
  exports.skips = [];

  /**
   * Map of special "%n" handling functions, for the debug "format" argument.
   *
   * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
   */

  exports.formatters = {};

  /**
   * Previous log timestamp.
   */

  var prevTime;

  /**
   * Select a color.
   * @param {String} namespace
   * @return {Number}
   * @api private
   */

  function selectColor(namespace) {
    var hash = 0, i;

    for (i in namespace) {
      hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    return exports.colors[Math.abs(hash) % exports.colors.length];
  }

  /**
   * Create a debugger with the given `namespace`.
   *
   * @param {String} namespace
   * @return {Function}
   * @api public
   */

  function createDebug(namespace) {

    function debug() {
      var arguments$1 = arguments;

      // disabled?
      if (!debug.enabled) { return; }

      var self = debug;

      // set `diff` timestamp
      var curr = +new Date();
      var ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;

      // turn the `arguments` into a proper Array
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments$1[i];
      }

      args[0] = exports.coerce(args[0]);

      if ('string' !== typeof args[0]) {
        // anything else let's inspect with %O
        args.unshift('%O');
      }

      // apply any `formatters` transformations
      var index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
        // if we encounter an escaped % then don't increase the array index
        if (match === '%%') { return match; }
        index++;
        var formatter = exports.formatters[format];
        if ('function' === typeof formatter) {
          var val = args[index];
          match = formatter.call(self, val);

          // now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      // apply env-specific formatting (colors, etc.)
      exports.formatArgs.call(self, args);

      var logFn = debug.log || exports.log || console.log.bind(console);
      logFn.apply(self, args);
    }

    debug.namespace = namespace;
    debug.enabled = exports.enabled(namespace);
    debug.useColors = exports.useColors();
    debug.color = selectColor(namespace);

    // env-specific initialization logic for debug instances
    if ('function' === typeof exports.init) {
      exports.init(debug);
    }

    return debug;
  }

  /**
   * Enables a debug mode by namespaces. This can include modes
   * separated by a colon and wildcards.
   *
   * @param {String} namespaces
   * @api public
   */

  function enable(namespaces) {
    exports.save(namespaces);

    exports.names = [];
    exports.skips = [];

    var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    var len = split.length;

    for (var i = 0; i < len; i++) {
      if (!split[i]) { continue; } // ignore empty strings
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
      } else {
        exports.names.push(new RegExp('^' + namespaces + '$'));
      }
    }
  }

  /**
   * Disable debug output.
   *
   * @api public
   */

  function disable() {
    exports.enable('');
  }

  /**
   * Returns true if the given mode name is enabled, false otherwise.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */

  function enabled(name) {
    var i, len;
    for (i = 0, len = exports.skips.length; i < len; i++) {
      if (exports.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = exports.names.length; i < len; i++) {
      if (exports.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Coerce `val`.
   *
   * @param {Mixed} val
   * @return {Mixed}
   * @api private
   */

  function coerce(val) {
    if (val instanceof Error) { return val.stack || val.message; }
    return val;
  }
  });
  var debug_1 = debug.coerce;
  var debug_2 = debug.disable;
  var debug_3 = debug.enable;
  var debug_4 = debug.enabled;
  var debug_5 = debug.humanize;
  var debug_6 = debug.names;
  var debug_7 = debug.skips;
  var debug_8 = debug.formatters;

  var browser = createCommonjsModule(function (module, exports) {
  /**
   * This is the web browser implementation of `debug()`.
   *
   * Expose `debug()` as the module.
   */

  exports = module.exports = debug;
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = 'undefined' != typeof chrome
                 && 'undefined' != typeof chrome.storage
                    ? chrome.storage.local
                    : localstorage();

  /**
   * Colors.
   */

  exports.colors = [
    'lightseagreen',
    'forestgreen',
    'goldenrod',
    'dodgerblue',
    'darkorchid',
    'crimson'
  ];

  /**
   * Currently only WebKit-based Web Inspectors, Firefox >= v31,
   * and the Firebug extension (any Firefox version) are known
   * to support "%c" CSS customizations.
   *
   * TODO: add a `localStorage` variable to explicitly enable/disable colors
   */

  function useColors() {
    // NB: In an Electron preload script, document will be defined but not fully
    // initialized. Since we know we're in Chrome, we'll just detect this case
    // explicitly
    if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
      return true;
    }

    // is webkit? http://stackoverflow.com/a/16459606/376773
    // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
      // is firebug? http://stackoverflow.com/a/398120/376773
      (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
      // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
      // double check webkit in userAgent just in case we are in a worker
      (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
  }

  /**
   * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
   */

  exports.formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (err) {
      return '[UnexpectedJSONParseError]: ' + err.message;
    }
  };


  /**
   * Colorize log arguments if enabled.
   *
   * @api public
   */

  function formatArgs(args) {
    var useColors = this.useColors;

    args[0] = (useColors ? '%c' : '')
      + this.namespace
      + (useColors ? ' %c' : ' ')
      + args[0]
      + (useColors ? '%c ' : ' ')
      + '+' + exports.humanize(this.diff);

    if (!useColors) { return; }

    var c = 'color: ' + this.color;
    args.splice(1, 0, c, 'color: inherit');

    // the final "%c" is somewhat tricky, because there could be other
    // arguments passed either before or after the %c, so we need to
    // figure out the correct index to insert the CSS into
    var index = 0;
    var lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, function(match) {
      if ('%%' === match) { return; }
      index++;
      if ('%c' === match) {
        // we only are interested in the *last* %c
        // (the user may have provided their own)
        lastC = index;
      }
    });

    args.splice(lastC, 0, c);
  }

  /**
   * Invokes `console.log()` when available.
   * No-op when `console.log` is not a "function".
   *
   * @api public
   */

  function log() {
    // this hackery is required for IE8/9, where
    // the `console.log` function doesn't have 'apply'
    return 'object' === typeof console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }

  /**
   * Save `namespaces`.
   *
   * @param {String} namespaces
   * @api private
   */

  function save(namespaces) {
    try {
      if (null == namespaces) {
        exports.storage.removeItem('debug');
      } else {
        exports.storage.debug = namespaces;
      }
    } catch(e) {}
  }

  /**
   * Load `namespaces`.
   *
   * @return {String} returns the previously persisted debug modes
   * @api private
   */

  function load() {
    var r;
    try {
      r = exports.storage.debug;
    } catch(e) {}

    // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    if (!r && typeof process !== 'undefined' && 'env' in process) {
      r = process.env.DEBUG;
    }

    return r;
  }

  /**
   * Enable namespaces listed in `localStorage.debug` initially.
   */

  exports.enable(load());

  /**
   * Localstorage attempts to return the localstorage.
   *
   * This is necessary because safari throws
   * when a user disables cookies/localstorage
   * and you attempt to access it.
   *
   * @return {LocalStorage}
   * @api private
   */

  function localstorage() {
    try {
      return window.localStorage;
    } catch (e) {}
  }
  });
  var browser_1 = browser.log;
  var browser_2 = browser.formatArgs;
  var browser_3 = browser.save;
  var browser_4 = browser.load;
  var browser_5 = browser.useColors;
  var browser_6 = browser.storage;
  var browser_7 = browser.colors;

  var debugFunc;
  var phase = 'default';
  var namespace = '';
  var newDebug = function () {
  	debugFunc = namespace
  		? browser(("fetch-mock:" + phase + ":" + namespace))
  		: browser(("fetch-mock:" + phase));
  };

  var newDebugSandbox = function (ns) { return browser(("fetch-mock:" + phase + ":" + ns)); };

  newDebug();

  var debug_1$1 = {
  	debug: function () {
  		var args = [], len = arguments.length;
  		while ( len-- ) args[ len ] = arguments[ len ];

  		debugFunc.apply(void 0, args);
  	},
  	setDebugNamespace: function (str) {
  		namespace = str;
  		newDebug();
  	},
  	setDebugPhase: function (str) {
  		phase = str || 'default';
  		newDebug();
  	},
  	getDebug: function (namespace) { return newDebugSandbox(namespace); }
  };

  var globToRegexp = function (glob, opts) {
    if (typeof glob !== 'string') {
      throw new TypeError('Expected a string');
    }

    var str = String(glob);

    // The regexp we are building, as a string.
    var reStr = "";

    // Whether we are matching so called "extended" globs (like bash) and should
    // support single character matching, matching ranges of characters, group
    // matching, etc.
    var extended = opts ? !!opts.extended : false;

    // When globstar is _false_ (default), '/foo/*' is translated a regexp like
    // '^\/foo\/.*$' which will match any string beginning with '/foo/'
    // When globstar is _true_, '/foo/*' is translated to regexp like
    // '^\/foo\/[^/]*$' which will match any string beginning with '/foo/' BUT
    // which does not have a '/' to the right of it.
    // E.g. with '/foo/*' these will match: '/foo/bar', '/foo/bar.txt' but
    // these will not '/foo/bar/baz', '/foo/bar/baz.txt'
    // Lastely, when globstar is _true_, '/foo/**' is equivelant to '/foo/*' when
    // globstar is _false_
    var globstar = opts ? !!opts.globstar : false;

    // If we are doing extended matching, this boolean is true when we are inside
    // a group (eg {*.html,*.js}), and false otherwise.
    var inGroup = false;

    // RegExp flags (eg "i" ) to pass in to RegExp constructor.
    var flags = opts && typeof( opts.flags ) === "string" ? opts.flags : "";

    var c;
    for (var i = 0, len = str.length; i < len; i++) {
      c = str[i];

      switch (c) {
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|":
        reStr += "\\" + c;
        break;

      case "?":
        if (extended) {
          reStr += ".";
  	    break;
        }

      case "[":
      case "]":
        if (extended) {
          reStr += c;
  	    break;
        }

      case "{":
        if (extended) {
          inGroup = true;
  	    reStr += "(";
  	    break;
        }

      case "}":
        if (extended) {
          inGroup = false;
  	    reStr += ")";
  	    break;
        }

      case ",":
        if (inGroup) {
          reStr += "|";
  	    break;
        }
        reStr += "\\" + c;
        break;

      case "*":
        // Move over all consecutive "*"'s.
        // Also store the previous and next characters
        var prevChar = str[i - 1];
        var starCount = 1;
        while(str[i + 1] === "*") {
          starCount++;
          i++;
        }
        var nextChar = str[i + 1];

        if (!globstar) {
          // globstar is disabled, so treat any number of "*" as one
          reStr += ".*";
        } else {
          // globstar is enabled, so determine if this is a globstar segment
          var isGlobstar = starCount > 1                      // multiple "*"'s
            && (prevChar === "/" || prevChar === undefined)   // from the start of the segment
            && (nextChar === "/" || nextChar === undefined);   // to the end of the segment

          if (isGlobstar) {
            // it's a globstar, so match zero or more path segments
            reStr += "((?:[^/]*(?:\/|$))*)";
            i++; // move over the "/"
          } else {
            // it's not a globstar, so only match one path segment
            reStr += "([^/]*)";
          }
        }
        break;

      default:
        reStr += c;
      }
    }

    // When regexp 'g' flag is specified don't
    // constrain the regular expression with ^ & $
    if (!flags || !~flags.indexOf('g')) {
      reStr = "^" + reStr + "$";
    }

    return new RegExp(reStr, flags);
  };

  /**
   * Expose `pathToRegexp`.
   */
  var pathToRegexp_1 = pathToRegexp;
  var parse_1 = parse$1;
  var compile_1 = compile;
  var tokensToFunction_1 = tokensToFunction;
  var tokensToRegExp_1 = tokensToRegExp;

  /**
   * Default configs.
   */
  var DEFAULT_DELIMITER = '/';
  var DEFAULT_DELIMITERS = './';

  /**
   * The main path matching regexp utility.
   *
   * @type {RegExp}
   */
  var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
    // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
  ].join('|'), 'g');

  /**
   * Parse a string for the raw tokens.
   *
   * @param  {string}  str
   * @param  {Object=} options
   * @return {!Array}
   */
  function parse$1 (str, options) {
    var tokens = [];
    var key = 0;
    var index = 0;
    var path = '';
    var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
    var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
    var pathEscaped = false;
    var res;

    while ((res = PATH_REGEXP.exec(str)) !== null) {
      var m = res[0];
      var escaped = res[1];
      var offset = res.index;
      path += str.slice(index, offset);
      index = offset + m.length;

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1];
        pathEscaped = true;
        continue
      }

      var prev = '';
      var next = str[index];
      var name = res[2];
      var capture = res[3];
      var group = res[4];
      var modifier = res[5];

      if (!pathEscaped && path.length) {
        var k = path.length - 1;

        if (delimiters.indexOf(path[k]) > -1) {
          prev = path[k];
          path = path.slice(0, k);
        }
      }

      // Push the current path onto the tokens.
      if (path) {
        tokens.push(path);
        path = '';
        pathEscaped = false;
      }

      var partial = prev !== '' && next !== undefined && next !== prev;
      var repeat = modifier === '+' || modifier === '*';
      var optional = modifier === '?' || modifier === '*';
      var delimiter = prev || defaultDelimiter;
      var pattern = capture || group;

      tokens.push({
        name: name || key++,
        prefix: prev,
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
      });
    }

    // Push any remaining characters.
    if (path || index < str.length) {
      tokens.push(path + str.substr(index));
    }

    return tokens
  }

  /**
   * Compile a string to a template function for the path.
   *
   * @param  {string}             str
   * @param  {Object=}            options
   * @return {!function(Object=, Object=)}
   */
  function compile (str, options) {
    return tokensToFunction(parse$1(str, options))
  }

  /**
   * Expose a method for transforming tokens into the path function.
   */
  function tokensToFunction (tokens) {
    // Compile all the tokens into regexps.
    var matches = new Array(tokens.length);

    // Compile all the patterns before compilation.
    for (var i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] === 'object') {
        matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
      }
    }

    return function (data, options) {
      var path = '';
      var encode = (options && options.encode) || encodeURIComponent;

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          path += token;
          continue
        }

        var value = data ? data[token.name] : undefined;
        var segment;

        if (Array.isArray(value)) {
          if (!token.repeat) {
            throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
          }

          if (value.length === 0) {
            if (token.optional) { continue }

            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }

          for (var j = 0; j < value.length; j++) {
            segment = encode(value[j], token);

            if (!matches[i].test(segment)) {
              throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
            }

            path += (j === 0 ? token.prefix : token.delimiter) + segment;
          }

          continue
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          segment = encode(String(value), token);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
          }

          path += token.prefix + segment;
          continue
        }

        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) { path += token.prefix; }

          continue
        }

        throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
      }

      return path
    }
  }

  /**
   * Escape a regular expression string.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
  }

  /**
   * Escape the capturing group by escaping special characters and meaning.
   *
   * @param  {string} group
   * @return {string}
   */
  function escapeGroup (group) {
    return group.replace(/([=!:$/()])/g, '\\$1')
  }

  /**
   * Get the flags for a regexp from the options.
   *
   * @param  {Object} options
   * @return {string}
   */
  function flags (options) {
    return options && options.sensitive ? '' : 'i'
  }

  /**
   * Pull out keys from a regexp.
   *
   * @param  {!RegExp} path
   * @param  {Array=}  keys
   * @return {!RegExp}
   */
  function regexpToRegexp (path, keys) {
    if (!keys) { return path }

    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g);

    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          pattern: null
        });
      }
    }

    return path
  }

  /**
   * Transform an array into a regexp.
   *
   * @param  {!Array}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function arrayToRegexp (path, keys, options) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source);
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options))
  }

  /**
   * Create a path regexp from string input.
   *
   * @param  {string}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse$1(path, options), keys, options)
  }

  /**
   * Expose a function for taking tokens and returning a RegExp.
   *
   * @param  {!Array}  tokens
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function tokensToRegExp (tokens, keys, options) {
    options = options || {};

    var strict = options.strict;
    var start = options.start !== false;
    var end = options.end !== false;
    var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
    var delimiters = options.delimiters || DEFAULT_DELIMITERS;
    var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    var route = start ? '^' : '';
    var isEndDelimited = tokens.length === 0;

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        route += escapeString(token);
        isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
      } else {
        var capture = token.repeat
          ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
          : token.pattern;

        if (keys) { keys.push(token); }

        if (token.optional) {
          if (token.partial) {
            route += escapeString(token.prefix) + '(' + capture + ')?';
          } else {
            route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
          }
        } else {
          route += escapeString(token.prefix) + '(' + capture + ')';
        }
      }
    }

    if (end) {
      if (!strict) { route += '(?:' + delimiter + ')?'; }

      route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
    } else {
      if (!strict) { route += '(?:' + delimiter + '(?=' + endsWith + '))?'; }
      if (!isEndDelimited) { route += '(?=' + delimiter + '|' + endsWith + ')'; }
    }

    return new RegExp(route, flags(options))
  }

  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   *
   * @param  {(string|RegExp|Array)} path
   * @param  {Array=}                keys
   * @param  {Object=}               options
   * @return {!RegExp}
   */
  function pathToRegexp (path, keys, options) {
    if (path instanceof RegExp) {
      return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
    }

    return stringToRegexp(/** @type {string} */ (path), keys, options)
  }
  pathToRegexp_1.parse = parse_1;
  pathToRegexp_1.compile = compile_1;
  pathToRegexp_1.tokensToFunction = tokensToFunction_1;
  pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

  // Copyright Joyent, Inc. and other Node contributors.

  // If obj.hasOwnProperty has been overridden, then calling
  // obj.hasOwnProperty(prop) will break.
  // See: https://github.com/joyent/node/issues/1707
  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  var decode = function(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};

    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }

    var regexp = /\+/g;
    qs = qs.split(sep);

    var maxKeys = 1000;
    if (options && typeof options.maxKeys === 'number') {
      maxKeys = options.maxKeys;
    }

    var len = qs.length;
    // maxKeys <= 0 means that we should not limit keys count
    if (maxKeys > 0 && len > maxKeys) {
      len = maxKeys;
    }

    for (var i = 0; i < len; ++i) {
      var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr, vstr, k, v;

      if (idx >= 0) {
        kstr = x.substr(0, idx);
        vstr = x.substr(idx + 1);
      } else {
        kstr = x;
        vstr = '';
      }

      k = decodeURIComponent(kstr);
      v = decodeURIComponent(vstr);

      if (!hasOwnProperty(obj, k)) {
        obj[k] = v;
      } else if (Array.isArray(obj[k])) {
        obj[k].push(v);
      } else {
        obj[k] = [obj[k], v];
      }
    }

    return obj;
  };

  // Copyright Joyent, Inc. and other Node contributors.

  var stringifyPrimitive = function(v) {
    switch (typeof v) {
      case 'string':
        return v;

      case 'boolean':
        return v ? 'true' : 'false';

      case 'number':
        return isFinite(v) ? v : '';

      default:
        return '';
    }
  };

  var encode = function(obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';
    if (obj === null) {
      obj = undefined;
    }

    if (typeof obj === 'object') {
      return Object.keys(obj).map(function(k) {
        var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
        if (Array.isArray(obj[k])) {
          return obj[k].map(function(v) {
            return ks + encodeURIComponent(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        }
      }).join(sep);

    }

    if (!name) { return ''; }
    return encodeURIComponent(stringifyPrimitive(name)) + eq +
           encodeURIComponent(stringifyPrimitive(obj));
  };

  var querystring = createCommonjsModule(function (module, exports) {

  exports.decode = exports.parse = decode;
  exports.encode = exports.stringify = encode;
  });
  var querystring_1 = querystring.decode;
  var querystring_2 = querystring.parse;
  var querystring_3 = querystring.encode;
  var querystring_4 = querystring.stringify;

  var URL;
  // https://stackoverflow.com/a/19709846/308237
  var absoluteUrlRX = new RegExp('^(?:[a-z]+:)?//', 'i');

  var headersToArray = function (headers) {
  	// node-fetch 1 Headers
  	if (typeof headers.raw === 'function') {
  		return Object.entries(headers.raw());
  	} else if (headers[Symbol.iterator]) {
  		return [].concat( headers );
  	} else {
  		return Object.entries(headers);
  	}
  };

  var zipObject = function (entries) { return entries.reduce(function (obj, ref) {
  	  var obj$1;

  	  var key = ref[0];
  	  var val = ref[1];
  	  return Object.assign(obj, ( obj$1 = {}, obj$1[key] = val, obj$1 ));
  	  }, {}); };

  var normalizeUrl = function (url) {
  	if (
  		typeof url === 'function' ||
  		url instanceof RegExp ||
  		/^(begin|end|glob|express|path)\:/.test(url)
  	) {
  		return url;
  	}
  	if (absoluteUrlRX.test(url)) {
  		var u = new URL(url);
  		return u.href;
  	} else {
  		var u$1 = new URL(url, 'http://dummy');
  		return u$1.pathname + u$1.search;
  	}
  };

  var requestUtils = {
  	setUrlImplementation: function (it) {
  		URL = it;
  	},
  	normalizeRequest: function (url, options, Request) {
  		if (Request.prototype.isPrototypeOf(url)) {
  			var derivedOptions = {
  				method: url.method
  			};
  			var normalizedRequestObject = {
  				url: normalizeUrl(url.url),
  				options: Object.assign(derivedOptions, options),
  				request: url,
  				signal: (options && options.signal) || url.signal
  			};

  			var headers = headersToArray(url.headers);

  			if (headers.length) {
  				normalizedRequestObject.options.headers = zipObject(headers);
  			}
  			return normalizedRequestObject;
  		} else if (
  			typeof url === 'string' ||
  			// horrible URL object duck-typing
  			(typeof url === 'object' && 'href' in url)
  		) {
  			return {
  				url: normalizeUrl(url),
  				options: options,
  				signal: options && options.signal
  			};
  		} else if (typeof url === 'object') {
  			throw new TypeError(
  				'fetch-mock: Unrecognised Request object. Read the Config and Installation sections of the docs'
  			);
  		} else {
  			throw new TypeError('fetch-mock: Invalid arguments passed to fetch');
  		}
  	},
  	normalizeUrl: normalizeUrl,
  	getPath: function (url) {
  		var u = absoluteUrlRX.test(url)
  			? new URL(url)
  			: new URL(url, 'http://dummy');
  		return u.pathname;
  	},

  	getQuery: function (url) {
  		var u = absoluteUrlRX.test(url)
  			? new URL(url)
  			: new URL(url, 'http://dummy');
  		return u.search ? u.search.substr(1) : '';
  	},
  	headers: {
  		normalize: function (headers) { return zipObject(headersToArray(headers)); },
  		toLowerCase: function (headers) { return Object.keys(headers).reduce(function (obj, k) {
  				obj[k.toLowerCase()] = headers[k];
  				return obj;
  			}, {}); },
  		equal: function (actualHeader, expectedHeader) {
  			actualHeader = Array.isArray(actualHeader)
  				? actualHeader
  				: [actualHeader];
  			expectedHeader = Array.isArray(expectedHeader)
  				? expectedHeader
  				: [expectedHeader];

  			if (actualHeader.length !== expectedHeader.length) {
  				return false;
  			}

  			return actualHeader.every(function (val, i) { return val === expectedHeader[i]; });
  		}
  	}
  };

  var lodash_isequal = createCommonjsModule(function (module, exports) {
  /**
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright JS Foundation and other contributors <https://js.foundation/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      asyncTag = '[object AsyncFunction]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      nullTag = '[object Null]',
      objectTag = '[object Object]',
      promiseTag = '[object Promise]',
      proxyTag = '[object Proxy]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]',
      undefinedTag = '[object Undefined]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }

  /** Used for built-in method references. */
  var arrayProto = Array.prototype,
      funcProto = Function.prototype,
      objectProto = Object.prototype;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root['__core-js_shared__'];

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /** Built-in value references. */
  var Buffer = moduleExports ? root.Buffer : undefined,
      Symbol = root.Symbol,
      Uint8Array = root.Uint8Array,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      splice = arrayProto.splice,
      symToStringTag = Symbol ? Symbol.toStringTag : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols,
      nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
      nativeKeys = overArg(Object.keys, Object);

  /* Built-in method references that are verified to be native. */
  var DataView = getNative(root, 'DataView'),
      Map = getNative(root, 'Map'),
      Promise = getNative(root, 'Promise'),
      Set = getNative(root, 'Set'),
      WeakMap = getNative(root, 'WeakMap'),
      nativeCreate = getNative(Object, 'create');

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView),
      mapCtorString = toSource(Map),
      promiseCtorString = toSource(Promise),
      setCtorString = toSource(Set),
      weakMapCtorString = toSource(WeakMap);

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = Symbol ? Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
  }

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
    return this;
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype['delete'] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype['delete'] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new Hash,
      'map': new (Map || ListCache),
      'string': new Hash
    };
  }

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype['delete'] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
        length = values == null ? 0 : values.length;

    this.__data__ = new MapCache;
    while (++index < length) {
      this.add(values[index]);
    }
  }

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache;
    this.size = 0;
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs = data.__data__;
      if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear;
  Stack.prototype['delete'] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value),
        isArg = !isArr && isArguments(value),
        isBuff = !isArr && !isArg && isBuffer(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag && symToStringTag in Object(value))
      ? getRawTag(value)
      : objectToString(value);
  }

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike(value) && baseGetTag(value) == argsTag;
  }

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Unordered comparison
   *  2 - Partial comparison
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = objIsArr ? arrayTag : getTag(object),
        othTag = othIsArr ? arrayTag : getTag(other);

    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;

    var objIsObj = objTag == objectTag,
        othIsObj = othTag == objectTag,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack);
      return (objIsArr || isTypedArray(object))
        ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
        : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new Stack);
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack);
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike(value) &&
      isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
        result = true,
        seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, arrValue, index, other, array, stack)
          : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!arraySome(other, function(othValue, othIndex) {
              if (!cacheHas(seen, othIndex) &&
                  (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
          result = false;
          break;
        }
      } else if (!(
            arrValue === othValue ||
              equalFunc(arrValue, othValue, bitmask, customizer, stack)
          )) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag:
        if ((object.byteLength != other.byteLength) ||
            (object.byteOffset != other.byteOffset)) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag:
        if ((object.byteLength != other.byteLength) ||
            !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq(+object, +other);

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == (other + '');

      case mapTag:
        var convert = mapToArray;

      case setTag:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
        convert || (convert = setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack['delete'](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
        objProps = getAllKeys(object),
        objLength = objProps.length,
        othProps = getAllKeys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, objValue, key, other, object, stack)
          : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined
            ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
            : compared
          )) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor &&
          ('constructor' in object && 'constructor' in other) &&
          !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
            typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag),
        tag = value[symToStringTag];

    try {
      value[symToStringTag] = undefined;
      var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable.call(object, symbol);
    });
  };

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
      (Map && getTag(new Map) != mapTag) ||
      (Promise && getTag(Promise.resolve()) != promiseTag) ||
      (Set && getTag(new Set) != setTag) ||
      (WeakMap && getTag(new WeakMap) != weakMapTag)) {
    getTag = function(value) {
      var result = baseGetTag(value),
          Ctor = result == objectTag ? value.constructor : undefined,
          ctorString = Ctor ? toSource(Ctor) : '';

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString: return dataViewTag;
          case mapCtorString: return mapTag;
          case promiseCtorString: return promiseTag;
          case setCtorString: return setTag;
          case weakMapCtorString: return weakMapTag;
        }
      }
      return result;
    };
  }

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length &&
      (typeof value == 'number' || reIsUint.test(value)) &&
      (value > -1 && value % 1 == 0 && value < length);
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

    return value === proto;
  }

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
    return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse;

  /**
   * Performs a deep comparison between two values to determine if they are
   * equivalent.
   *
   * **Note:** This method supports comparing arrays, array buffers, booleans,
   * date objects, error objects, maps, numbers, `Object` objects, regexes,
   * sets, strings, symbols, and typed arrays. `Object` objects are compared
   * by their own, not inherited, enumerable properties. Functions and DOM
   * nodes are compared by strict equality, i.e. `===`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.isEqual(object, other);
   * // => true
   *
   * object === other;
   * // => false
   */
  function isEqual(value, other) {
    return baseIsEqual(value, other);
  }

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  module.exports = isEqual;
  });

  var debug$1 = debug_1$1.debug;
  var setDebugNamespace = debug_1$1.setDebugNamespace;



  var headerUtils = requestUtils.headers;
  var getPath = requestUtils.getPath;
  var getQuery = requestUtils.getQuery;
  var normalizeUrl$1 = requestUtils.normalizeUrl;


  var debuggableUrlFunc = function (func) { return function (url) {
  	debug$1('Actual url:', url);
  	return func(url);
  }; };

  var stringMatchers = {
  	begin: function (targetString) { return debuggableUrlFunc(function (url) { return url.indexOf(targetString) === 0; }); },
  	end: function (targetString) { return debuggableUrlFunc(function (url) { return url.substr(-targetString.length) === targetString; }); },
  	glob: function (targetString) {
  		var urlRX = globToRegexp(targetString);
  		return debuggableUrlFunc(function (url) { return urlRX.test(url); });
  	},
  	express: function (targetString) {
  		var urlRX = pathToRegexp_1(targetString);
  		return debuggableUrlFunc(function (url) { return urlRX.test(getPath(url)); });
  	},
  	path: function (targetString) { return debuggableUrlFunc(function (url) { return getPath(url) === targetString; }); }
  };

  var getHeaderMatcher = function (ref) {
  	var expectedHeaders = ref.headers;

  	debug$1('Generating header matcher');
  	if (!expectedHeaders) {
  		debug$1('  No header expectations defined - skipping');
  		return;
  	}
  	var expectation = headerUtils.toLowerCase(expectedHeaders);
  	debug$1('  Expected headers:', expectation);
  	return function (url, ref) {
  		var headers = ref.headers; if ( headers === void 0 ) headers = {};

  		debug$1('Attempting to match headers');
  		var lowerCaseHeaders = headerUtils.toLowerCase(
  			headerUtils.normalize(headers)
  		);
  		debug$1('  Expected headers:', expectation);
  		debug$1('  Actual headers:', lowerCaseHeaders);
  		return Object.keys(expectation).every(function (headerName) { return headerUtils.equal(lowerCaseHeaders[headerName], expectation[headerName]); }
  		);
  	};
  };

  var getMethodMatcher = function (ref) {
  	var expectedMethod = ref.method;

  	debug$1('Generating method matcher');
  	if (!expectedMethod) {
  		debug$1('  No method expectations defined - skipping');
  		return;
  	}
  	debug$1('  Expected method:', expectedMethod);
  	return function (url, ref) {
  		var method = ref.method;

  		debug$1('Attempting to match method');
  		var actualMethod = method ? method.toLowerCase() : 'get';
  		debug$1('  Expected method:', expectedMethod);
  		debug$1('  Actual method:', actualMethod);
  		return expectedMethod === actualMethod;
  	};
  };

  var getQueryStringMatcher = function (ref) {
  	var expectedQuery = ref.query;

  	debug$1('Generating query parameters matcher');
  	if (!expectedQuery) {
  		debug$1('  No query parameters expectations defined - skipping');
  		return;
  	}
  	debug$1('  Expected query parameters:', expectedQuery);
  	var keys = Object.keys(expectedQuery);
  	return function (url) {
  		debug$1('Attempting to match query parameters');
  		var query = querystring.parse(getQuery(url));
  		debug$1('  Expected query parameters:', expectedQuery);
  		debug$1('  Actual query parameters:', query);
  		return keys.every(function (key) { return query[key] === expectedQuery[key]; });
  	};
  };

  var getParamsMatcher = function (ref) {
  	var expectedParams = ref.params;
  	var matcherUrl = ref.url;

  	debug$1('Generating path parameters matcher');
  	if (!expectedParams) {
  		debug$1('  No path parameters expectations defined - skipping');
  		return;
  	}
  	if (!/express:/.test(matcherUrl)) {
  		throw new Error(
  			'fetch-mock: matching on params is only possible when using an express: matcher'
  		);
  	}
  	debug$1('  Expected path parameters:', expectedParams);
  	var expectedKeys = Object.keys(expectedParams);
  	var keys = [];
  	var re = pathToRegexp_1(matcherUrl.replace(/^express:/, ''), keys);
  	return function (url) {
  		debug$1('Attempting to match path parameters');
  		var vals = re.exec(getPath(url)) || [];
  		vals.shift();
  		var params = keys.reduce(
  			function (map, ref, i) {
  				  var obj;

  				  var name = ref.name;
  				  return vals[i] ? Object.assign(map, ( obj = {}, obj[name] = vals[i], obj )) : map;
  		},
  			{}
  		);
  		debug$1('  Expected path parameters:', expectedParams);
  		debug$1('  Actual path parameters:', params);
  		return expectedKeys.every(function (key) { return params[key] === expectedParams[key]; });
  	};
  };

  var getBodyMatcher = function (ref) {
  	var expectedBody = ref.body;

  	debug$1('Generating body matcher');
  	return function (url, ref) {
  		var body = ref.body;
  		var method = ref.method; if ( method === void 0 ) method = 'get';

  		debug$1('Attempting to match body');
  		if (method.toLowerCase() === 'get') {
  			debug$1('  GET request - skip matching body');
  			// GET requests don’t send a body so the body matcher should be ignored for them
  			return true;
  		}

  		var sentBody;

  		try {
  			debug$1('  Parsing request body as JSON');
  			sentBody = JSON.parse(body);
  		} catch (err) {
  			debug$1('  Failed to parse request body as JSON', err);
  		}
  		debug$1('Expected body:', expectedBody);
  		debug$1('Actual body:', sentBody);

  		return sentBody && lodash_isequal(sentBody, expectedBody);
  	};
  };

  var getFullUrlMatcher = function (route, matcherUrl, query) {
  	// if none of the special syntaxes apply, it's just a simple string match
  	// but we have to be careful to normalize the url we check and the name
  	// of the route to allow for e.g. http://it.at.there being indistinguishable
  	// from http://it.at.there/ once we start generating Request/Url objects
  	debug$1('  Matching using full url', matcherUrl);
  	var expectedUrl = normalizeUrl$1(matcherUrl);
  	debug$1('  Normalised url to:', matcherUrl);
  	if (route.identifier === matcherUrl) {
  		debug$1('  Updating route identifier to match normalized url:', matcherUrl);
  		route.identifier = expectedUrl;
  	}

  	return function (matcherUrl) {
  		debug$1('Expected url:', expectedUrl);
  		debug$1('Actual url:', matcherUrl);
  		if (query && expectedUrl.indexOf('?')) {
  			debug$1('Ignoring query string when matching url');
  			return matcherUrl.indexOf(expectedUrl) === 0;
  		}
  		return normalizeUrl$1(matcherUrl) === expectedUrl;
  	};
  };

  var getFunctionMatcher = function (ref) {
  	var functionMatcher = ref.functionMatcher;

  	debug$1('Detected user defined function matcher', functionMatcher);
  	return function () {
  		var args = [], len = arguments.length;
  		while ( len-- ) args[ len ] = arguments[ len ];

  		debug$1('Calling function matcher with arguments', args);
  		return functionMatcher.apply(void 0, args);
  	};
  };

  var getUrlMatcher = function (route) {
  	debug$1('Generating url matcher');
  	var matcherUrl = route.url;
  	var query = route.query;

  	if (matcherUrl === '*') {
  		debug$1('  Using universal * rule to match any url');
  		return function () { return true; };
  	}

  	if (matcherUrl instanceof RegExp) {
  		debug$1('  Using regular expression to match url:', matcherUrl);
  		return function (url) { return matcherUrl.test(url); };
  	}

  	if (matcherUrl.href) {
  		debug$1("  Using URL object to match url", matcherUrl);
  		return getFullUrlMatcher(route, matcherUrl.href, query);
  	}

  	for (var shorthand in stringMatchers) {
  		if (matcherUrl.indexOf(shorthand + ':') === 0) {
  			debug$1(("  Using " + shorthand + ": pattern to match url"), matcherUrl);
  			var urlFragment = matcherUrl.replace(new RegExp(("^" + shorthand + ":")), '');
  			return stringMatchers[shorthand](urlFragment);
  		}
  	}

  	return getFullUrlMatcher(route, matcherUrl, query);
  };

  var generateMatcher = function (route) {
  	setDebugNamespace('generateMatcher()');
  	debug$1('Compiling matcher for route');
  	var matchers = [
  		route.query && getQueryStringMatcher(route),
  		route.method && getMethodMatcher(route),
  		route.headers && getHeaderMatcher(route),
  		route.params && getParamsMatcher(route),
  		route.body && getBodyMatcher(route),
  		route.functionMatcher && getFunctionMatcher(route),
  		route.url && getUrlMatcher(route)
  	].filter(function (matcher) { return !!matcher; });

  	debug$1('Compiled matcher for route');
  	setDebugNamespace();
  	return function (url, options, request) {
  		  if ( options === void 0 ) options = {};

  		  return matchers.every(function (matcher) { return matcher(url, options, request); });
  	};
  };

  var getDebug = debug_1$1.getDebug;


  var matcherProperties = [
  	'query',
  	'method',
  	'headers',
  	'params',
  	'body',
  	'functionMatcher',
  	'url'
  ];

  var isUrlMatcher = function (matcher) { return matcher instanceof RegExp ||
  	typeof matcher === 'string' ||
  	(typeof matcher === 'object' && 'href' in matcher); };

  var isFunctionMatcher = function (matcher) { return typeof matcher === 'function'; };

  var argsToRoute = function (args) {
  	var matcher = args[0];
  	var response = args[1];
  	var options = args[2]; if ( options === void 0 ) options = {};

  	var routeConfig = {};

  	if (isUrlMatcher(matcher) || isFunctionMatcher(matcher)) {
  		routeConfig.matcher = matcher;
  	} else {
  		Object.assign(routeConfig, matcher);
  	}

  	if (response) {
  		routeConfig.response = response;
  	}

  	Object.assign(routeConfig, options);
  	return routeConfig;
  };

  var sanitizeRoute = function (route) {
  	var debug = getDebug('sanitizeRoute()');
  	debug('Sanitizing route properties');
  	route = Object.assign({}, route);

  	if (route.method) {
  		debug(("Converting method " + (route.method) + " to lower case"));
  		route.method = route.method.toLowerCase();
  	}
  	if (isUrlMatcher(route.matcher)) {
  		debug('Mock uses a url matcher', route.matcher);
  		route.url = route.matcher;
  		delete route.matcher;
  	}

  	route.functionMatcher = route.matcher || route.functionMatcher;

  	debug('Setting route.identifier...');
  	debug(("  route.name is " + (route.name)));
  	debug(("  route.url is " + (route.url)));
  	debug(("  route.functionMatcher is " + (route.functionMatcher)));
  	route.identifier = route.name || route.url || route.functionMatcher;
  	debug(("  -> route.identifier set to " + (route.identifier)));
  	return route;
  };

  var validateRoute = function (route) {
  	if (!('response' in route)) {
  		throw new Error('fetch-mock: Each route must define a response');
  	}

  	if (!matcherProperties.some(function (matcherType) { return matcherType in route; })) {
  		throw new Error(
  			"fetch-mock: Each route must specify some criteria for matching calls to fetch. To match all calls use '*'"
  		);
  	}
  };

  var limit = function (route) {
  	var debug = getDebug('limit()');
  	debug('Limiting number of requests to handle by route');
  	if (!route.repeat) {
  		debug(
  			'  No `repeat` value set on route. Will match any number of requests'
  		);
  		return;
  	}

  	debug(("  Route set to repeat " + (route.repeat) + " times"));
  	var matcher = route.matcher;
  	var timesLeft = route.repeat;
  	route.matcher = function (url, options) {
  		var match = timesLeft && matcher(url, options);
  		if (match) {
  			timesLeft--;
  			return true;
  		}
  	};
  	route.reset = function () { return (timesLeft = route.repeat); };
  };

  var delayResponse = function (route) {
  	var debug = getDebug('delayResponse()');
  	debug("Applying response delay settings");
  	var delay = route.delay;
  	if (delay) {
  		debug(("  Wrapping response in delay of " + delay + " miliseconds"));
  		var response = route.response;
  		route.response = function () {
  			debug(("Delaying response by " + delay + " miliseconds"));
  			return new Promise(function (res) { return setTimeout(function () { return res(response); }, delay); });
  		};
  	} else {
  		debug(
  			"  No delay set on route. Will respond 'immediately' (but asynchronously)"
  		);
  	}
  };

  var compileRoute = function(args) {
  	var debug = getDebug('compileRoute()');
  	debug('Compiling route');
  	var route = sanitizeRoute(argsToRoute(args));
  	validateRoute(route);
  	route.matcher = generateMatcher(route);
  	limit(route);
  	delayResponse(route);
  	return route;
  };

  var compileRoute_1 = {
  	compileRoute: compileRoute,
  	sanitizeRoute: sanitizeRoute
  };

  var debug$2 = debug_1$1.debug;
  var setDebugPhase = debug_1$1.setDebugPhase;
  var compileRoute$1 = compileRoute_1.compileRoute;
  var FetchMock = {};

  FetchMock.mock = function() {
  	var args = [], len = arguments.length;
  	while ( len-- ) args[ len ] = arguments[ len ];

  	setDebugPhase('setup');
  	if (args.length) {
  		this.addRoute(args);
  	}

  	return this._mock();
  };

  FetchMock.addRoute = function(uncompiledRoute) {
  	var this$1 = this;

  	debug$2('Adding route', uncompiledRoute);
  	var route = this.compileRoute(uncompiledRoute);
  	var clashes = this.routes.filter(
  		function (ref) {
  			  var identifier = ref.identifier;
  			  var method = ref.method;

  			  return identifier === route.identifier &&
  			(!method || !route.method || method === route.method);
  	}
  	);

  	var overwriteRoutes =
  		'overwriteRoutes' in route
  			? route.overwriteRoutes
  			: this.config.overwriteRoutes;

  	if (overwriteRoutes === false || !clashes.length) {
  		this._uncompiledRoutes.push(uncompiledRoute);
  		return this.routes.push(route);
  	}

  	if (overwriteRoutes === true) {
  		clashes.forEach(function (clash) {
  			var index = this$1.routes.indexOf(clash);
  			this$1._uncompiledRoutes.splice(index, 1, uncompiledRoute);
  			this$1.routes.splice(index, 1, route);
  		});
  		return this.routes;
  	}

  	if (clashes.length) {
  		throw new Error(
  			'fetch-mock: Adding route with same name or matcher as existing route. See `overwriteRoutes` option.'
  		);
  	}

  	this._uncompiledRoutes.push(uncompiledRoute);
  	this.routes.push(route);
  };

  FetchMock._mock = function() {
  	if (!this.isSandbox) {
  		// Do this here rather than in the constructor to ensure it's scoped to the test
  		this.realFetch = this.realFetch || this.global.fetch;
  		this.global.fetch = this.fetchHandler;
  	}
  	setDebugPhase();
  	return this;
  };

  FetchMock.catch = function(response) {
  	if (this.fallbackResponse) {
  		console.warn(
  			'calling fetchMock.catch() twice - are you sure you want to overwrite the previous fallback response'
  		); // eslint-disable-line
  	}
  	this.fallbackResponse = response || 'ok';
  	return this._mock();
  };

  FetchMock.spy = function() {
  	this._mock();
  	return this.catch(this.getNativeFetch());
  };

  FetchMock.compileRoute = compileRoute$1;

  var defineShorthand = function (methodName, underlyingMethod, shorthandOptions) {
  	FetchMock[methodName] = function(matcher, response, options) {
  		return this[underlyingMethod](
  			matcher,
  			response,
  			Object.assign(options || {}, shorthandOptions)
  		);
  	};
  };
  defineShorthand('once', 'mock', { repeat: 1 });

  ['get', 'post', 'put', 'delete', 'head', 'patch'].forEach(function (method) {
  	defineShorthand(method, 'mock', { method: method });
  	defineShorthand((method + "Once"), 'once', { method: method });
  });

  FetchMock.resetBehavior = function() {
  	if (this.realFetch) {
  		this.global.fetch = this.realFetch;
  		this.realFetch = undefined;
  	}
  	this.fallbackResponse = undefined;
  	this.routes = [];
  	this._uncompiledRoutes = [];
  	return this;
  };

  FetchMock.resetHistory = function() {
  	this._calls = [];
  	this._holdingPromises = [];
  	this.routes.forEach(function (route) { return route.reset && route.reset(); });
  	return this;
  };

  FetchMock.restore = FetchMock.reset = function() {
  	this.resetBehavior();
  	this.resetHistory();
  	return this;
  };

  var setUpAndTearDown = FetchMock;

  var getDebug$1 = debug_1$1.getDebug;
  var responseConfigProps = [
  	'body',
  	'headers',
  	'throws',
  	'status',
  	'redirectUrl'
  ];

  var ResponseBuilder = function ResponseBuilder(options) {
  		this.debug = getDebug$1('ResponseBuilder()');
  		this.debug('Response builder created with options', options);
  		Object.assign(this, options);
  	};

  	ResponseBuilder.prototype.exec = function exec () {
  		this.debug('building response');
  		this.normalizeResponseConfig();
  		this.constructFetchOpts();
  		this.constructResponseBody();
  		return this.buildObservableResponse(
  			new this.fetchMock.config.Response(this.body, this.options)
  		);
  	};

  	ResponseBuilder.prototype.sendAsObject = function sendAsObject () {
  		var this$1 = this;

  		if (responseConfigProps.some(function (prop) { return this$1.responseConfig[prop]; })) {
  			if (
  				Object.keys(this.responseConfig).every(function (key) { return responseConfigProps.includes(key); }
  				)
  			) {
  				return false;
  			} else {
  				return true;
  			}
  		} else {
  			return true;
  		}
  	};

  	ResponseBuilder.prototype.normalizeResponseConfig = function normalizeResponseConfig () {
  		// If the response config looks like a status, start to generate a simple response
  		if (typeof this.responseConfig === 'number') {
  			this.debug('building response using status', this.responseConfig);
  			this.responseConfig = {
  				status: this.responseConfig
  			};
  			// If the response config is not an object, or is an object that doesn't use
  			// any reserved properties, assume it is meant to be the body of the response
  		} else if (typeof this.responseConfig === 'string' || this.sendAsObject()) {
  			this.debug('building text response from', this.responseConfig);
  			this.responseConfig = {
  				body: this.responseConfig
  			};
  		}
  	};

  	ResponseBuilder.prototype.validateStatus = function validateStatus (status) {
  		if (!status) {
  			this.debug('No status provided. Defaulting to 200');
  			return 200;
  		}

  		if (
  			(typeof status === 'number' &&
  				parseInt(status, 10) !== status &&
  				status >= 200) ||
  			status < 600
  		) {
  			this.debug('Valid status provided', status);
  			return status;
  		}

  		throw new TypeError(("fetch-mock: Invalid status " + status + " passed on response object.\nTo respond with a JSON object that has status as a property assign the object to body\ne.g. {\"body\": {\"status: \"registered\"}}"));
  	};

  	ResponseBuilder.prototype.constructFetchOpts = function constructFetchOpts () {
  		this.options = this.responseConfig.options || {};
  		this.options.url = this.responseConfig.redirectUrl || this.url;
  		this.options.status = this.validateStatus(this.responseConfig.status);
  		this.options.statusText = this.fetchMock.statusTextMap[
  			'' + this.options.status
  		];
  		// Set up response headers. The empty object is to cope with
  		// new Headers(undefined) throwing in Chrome
  		// https://code.google.com/p/chromium/issues/detail?id=335871
  		this.options.headers = new this.fetchMock.config.Headers(
  			this.responseConfig.headers || {}
  		);
  	};

  	ResponseBuilder.prototype.getOption = function getOption (name) {
  		return name in this.route ? this.route[name] : this.fetchMock.config[name];
  	};

  	ResponseBuilder.prototype.convertToJson = function convertToJson () {
  		// convert to json if we need to
  		if (
  			this.getOption('sendAsJson') &&
  			this.responseConfig.body != null && //eslint-disable-line
  			typeof this.body === 'object'
  		) {
  			this.debug('Stringifying JSON response body');
  			this.body = JSON.stringify(this.body);
  			if (!this.options.headers.has('Content-Type')) {
  				this.options.headers.set('Content-Type', 'application/json');
  			}
  		}
  	};

  	ResponseBuilder.prototype.setContentLength = function setContentLength () {
  		// add a Content-Length header if we need to
  		if (
  			this.getOption('includeContentLength') &&
  			typeof this.body === 'string' &&
  			!this.options.headers.has('Content-Length')
  		) {
  			this.debug('Setting content-length header:', this.body.length.toString());
  			this.options.headers.set('Content-Length', this.body.length.toString());
  		}
  	};

  	ResponseBuilder.prototype.constructResponseBody = function constructResponseBody () {
  		// start to construct the body
  		this.body = this.responseConfig.body;
  		this.convertToJson();
  		this.setContentLength();

  		// On the server we need to manually construct the readable stream for the
  		// Response object (on the client this done automatically)
  		if (this.Stream) {
  			this.debug('Creating response stream');
  			var stream = new this.Stream.Readable();
  			if (this.body != null) { //eslint-disable-line
  				stream.push(this.body, 'utf-8');
  			}
  			stream.push(null);
  			this.body = stream;
  		}
  		this.body = this.body;
  	};

  	ResponseBuilder.prototype.buildObservableResponse = function buildObservableResponse (response) {
  		var this$1 = this;

  		var fetchMock = this.fetchMock;

  		// Using a proxy means we can set properties that may not be writable on
  		// the original Response. It also means we can track the resolution of
  		// promises returned by res.json(), res.text() etc
  		this.debug('Wrappipng Response in ES proxy for observability');
  		return new Proxy(response, {
  			get: function (originalResponse, name) {
  				if (this$1.responseConfig.redirectUrl) {
  					if (name === 'url') {
  						this$1.debug(
  							'Retrieving redirect url',
  							this$1.responseConfig.redirectUrl
  						);
  						return this$1.responseConfig.redirectUrl;
  					}

  					if (name === 'redirected') {
  						this$1.debug('Retrieving redirected status', true);
  						return true;
  					}
  				}

  				if (typeof originalResponse[name] === 'function') {
  					this$1.debug('Wrapping body promises in ES proxies for observability');
  					return new Proxy(originalResponse[name], {
  						apply: function (func, thisArg, args) {
  							this$1.debug(("Calling res." + name));
  							var result = func.apply(response, args);
  							if (result.then) {
  								fetchMock._holdingPromises.push(result.catch(function () { return null; }));
  							}
  							return result;
  						}
  					});
  				}

  				return originalResponse[name];
  			}
  		});
  	};

  var responseBuilder = function (options) { return new ResponseBuilder(options).exec(); };

  var debug$3 = debug_1$1.debug;
  var setDebugPhase$1 = debug_1$1.setDebugPhase;
  var getDebug$2 = debug_1$1.getDebug;


  var FetchMock$1 = {};

  // see https://heycam.github.io/webidl/#aborterror for the standardised interface
  // Note that this differs slightly from node-fetch
  var AbortError = /*@__PURE__*/(function (Error) {
    function AbortError() {
  		Error.apply(this, arguments);
  		this.name = 'AbortError';
  		this.message = 'The operation was aborted.';

  		// Do not include this class in the stacktrace
  		if (Error.captureStackTrace) {
  			Error.captureStackTrace(this, this.constructor);
  		}
  	}

    if ( Error ) AbortError.__proto__ = Error;
    AbortError.prototype = Object.create( Error && Error.prototype );
    AbortError.prototype.constructor = AbortError;

    return AbortError;
  }(Error));

  var resolve = async function (
  	ref,
  	url,
  	options,
  	request
  ) {
  	var response = ref.response;
  	var responseIsFetch = ref.responseIsFetch; if ( responseIsFetch === void 0 ) responseIsFetch = false;

  	var debug = getDebug$2('resolve()');
  	debug('Recursively resolving function and promise responses');
  	// We want to allow things like
  	// - function returning a Promise for a response
  	// - delaying (using a timeout Promise) a function's execution to generate
  	//   a response
  	// Because of this we can't safely check for function before Promisey-ness,
  	// or vice versa. So to keep it DRY, and flexible, we keep trying until we
  	// have something that looks like neither Promise nor function
  	while (true) {
  		if (typeof response === 'function') {
  			debug('  Response is a function');
  			// in the case of falling back to the network we need to make sure we're using
  			// the original Request instance, not our normalised url + options
  			if (responseIsFetch) {
  				if (request) {
  					debug('  -> Calling fetch with Request instance');
  					return response(request);
  				}
  				debug('  -> Calling fetch with url and options');
  				return response(url, options);
  			} else {
  				debug('  -> Calling response function');
  				response = response(url, options, request);
  			}
  		} else if (typeof response.then === 'function') {
  			debug('  Response is a promise');
  			debug('  -> Resolving promise');
  			response = await response;
  		} else {
  			debug('  Response is not a function or a promise');
  			debug('  -> Exiting response resolution recursion');
  			return response;
  		}
  	}
  };

  FetchMock$1.fetchHandler = function(url, options, request) {
  	var this$1 = this;
  	var assign;

  	setDebugPhase$1('handle');
  	var debug = getDebug$2('fetchHandler()');
  	debug('fetch called with:', url, options);
  	var normalizedRequest = requestUtils.normalizeRequest(
  		url,
  		options,
  		this.config.Request
  	);

  	((assign = normalizedRequest, url = assign.url, options = assign.options, request = assign.request));

  	var signal = normalizedRequest.signal;

  	debug('Request normalised');
  	debug('  url', url);
  	debug('  options', options);
  	debug('  request', request);
  	debug('  signal', signal);

  	var route = this.executeRouter(url, options, request);

  	// this is used to power the .flush() method
  	var done;
  	this._holdingPromises.push(new this.config.Promise(function (res) { return (done = res); }));

  	// wrapped in this promise to make sure we respect custom Promise
  	// constructors defined by the user
  	return new this.config.Promise(function (res, rej) {
  		if (signal) {
  			debug('signal exists - enabling fetch abort');
  			var abort = function () {
  				debug('aborting fetch');
  				// note that DOMException is not available in node.js; even node-fetch uses a custom error class: https://github.com/bitinn/node-fetch/blob/master/src/abort-error.js
  				rej(
  					typeof DOMException !== 'undefined'
  						? new DOMException('The operation was aborted.', 'AbortError')
  						: new AbortError()
  				);
  				done();
  			};
  			if (signal.aborted) {
  				debug('signal is already aborted - aborting the fetch');
  				abort();
  			}
  			signal.addEventListener('abort', abort);
  		}

  		this$1.generateResponse(route, url, options, request)
  			.then(res, rej)
  			.then(done, done)
  			.then(function () {
  				setDebugPhase$1();
  			});
  	});
  };

  FetchMock$1.fetchHandler.isMock = true;

  FetchMock$1.executeRouter = function(url, options, request) {
  	var debug = getDebug$2('executeRouter()');
  	debug("Attempting to match request to a route");
  	if (this.config.fallbackToNetwork === 'always') {
  		debug(
  			'  Configured with fallbackToNetwork=always - passing through to fetch'
  		);
  		return { response: this.getNativeFetch(), responseIsFetch: true };
  	}

  	var match = this.router(url, options, request);

  	if (match) {
  		debug('  Matching route found');
  		return match;
  	}

  	if (this.config.warnOnFallback) {
  		console.warn(("Unmatched " + ((options && options.method) || 'GET') + " to " + url)); // eslint-disable-line
  	}

  	this.push({ url: url, options: options, request: request, isUnmatched: true });

  	if (this.fallbackResponse) {
  		debug('  No matching route found - using fallbackResponse');
  		return { response: this.fallbackResponse };
  	}

  	if (!this.config.fallbackToNetwork) {
  		throw new Error(
  			("fetch-mock: No fallback response defined for " + ((options &&
  				options.method) ||
  				'GET') + " to " + url)
  		);
  	}

  	debug('  Configured to fallbackToNetwork - passing through to fetch');
  	return { response: this.getNativeFetch(), responseIsFetch: true };
  };

  FetchMock$1.generateResponse = async function(route, url, options, request) {
  	var debug = getDebug$2('generateResponse()');
  	var response = await resolve(route, url, options, request);

  	// If the response says to throw an error, throw it
  	// Type checking is to deal with sinon spies having a throws property :-0
  	if (response.throws && typeof response !== 'function') {
  		debug('response.throws is defined - throwing an error');
  		throw response.throws;
  	}

  	// If the response is a pre-made Response, respond with it
  	if (this.config.Response.prototype.isPrototypeOf(response)) {
  		debug('response is already a Response instance - returning it');
  		return response;
  	}

  	// finally, if we need to convert config into a response, we do it
  	return responseBuilder({
  		url: url,
  		responseConfig: response,
  		fetchMock: this,
  		route: route
  	});
  };

  FetchMock$1.router = function(url, options, request) {
  	var route = this.routes.find(function (route, i) {
  		debug$3(("Trying to match route " + i));
  		return route.matcher(url, options, request);
  	});

  	if (route) {
  		this.push({
  			url: url,
  			options: options,
  			request: request,
  			identifier: route.identifier
  		});
  		return route;
  	}
  };

  FetchMock$1.getNativeFetch = function() {
  	var func = this.realFetch || (this.isSandbox && this.config.fetch);
  	if (!func) {
  		throw new Error(
  			'fetch-mock: Falling back to network only available on global fetch-mock, or by setting config.fetch on sandboxed fetch-mock'
  		);
  	}
  	return func;
  };

  FetchMock$1.push = function(ref) {
  	var url = ref.url;
  	var options = ref.options;
  	var request = ref.request;
  	var isUnmatched = ref.isUnmatched;
  	var identifier = ref.identifier;

  	debug$3('Recording fetch call', {
  		url: url,
  		options: options,
  		request: request,
  		isUnmatched: isUnmatched,
  		identifier: identifier
  	});
  	var args = [url, options];
  	args.request = request;
  	args.identifier = identifier;
  	args.isUnmatched = isUnmatched;
  	this._calls.push(args);
  };

  var fetchHandler = FetchMock$1;

  var setDebugPhase$2 = debug_1$1.setDebugPhase;
  var setDebugNamespace$1 = debug_1$1.setDebugNamespace;
  var debug$4 = debug_1$1.debug;
  var normalizeUrl$2 = requestUtils.normalizeUrl;
  var FetchMock$2 = {};
  var sanitizeRoute$1 = compileRoute_1.sanitizeRoute;

  var isName = function (nameOrMatcher) { return typeof nameOrMatcher === 'string' && /^[\da-zA-Z\-]+$/.test(nameOrMatcher); };

  var filterCallsWithMatcher = function (matcher, options, calls) {
  	if ( options === void 0 ) options = {};

  	matcher = generateMatcher(sanitizeRoute$1(Object.assign({ matcher: matcher }, options)));
  	return calls.filter(function (ref) {
  	  var url = ref[0];
  	  var options = ref[1];

  	  return matcher(normalizeUrl$2(url), options);
  	});
  };

  var formatDebug = function (func) {
  	return function() {
  		var args = [], len = arguments.length;
  		while ( len-- ) args[ len ] = arguments[ len ];

  		setDebugPhase$2('inspect');
  		var result = func.call.apply(func, [ this ].concat( args ));
  		setDebugPhase$2();
  		return result;
  	};
  };

  FetchMock$2.filterCalls = function(nameOrMatcher, options) {
  	debug$4('Filtering fetch calls');
  	var calls = this._calls;
  	var matcher = '*';

  	if ([true, 'matched'].includes(nameOrMatcher)) {
  		debug$4(("Filter provided is " + nameOrMatcher + ". Returning matched calls only"));
  		calls = calls.filter(function (ref) {
  		  var isUnmatched = ref.isUnmatched;

  		  return !isUnmatched;
  		});
  	} else if ([false, 'unmatched'].includes(nameOrMatcher)) {
  		debug$4(
  			("Filter provided is " + nameOrMatcher + ". Returning unmatched calls only")
  		);
  		calls = calls.filter(function (ref) {
  		  var isUnmatched = ref.isUnmatched;

  		  return isUnmatched;
  		});
  	} else if (typeof nameOrMatcher === 'undefined') {
  		debug$4("Filter provided is undefined. Returning all calls");
  		calls = calls;
  	} else if (isName(nameOrMatcher)) {
  		debug$4(
  			"Filter provided, looks like the name of a named route. Returning only calls handled by that route"
  		);
  		calls = calls.filter(function (ref) {
  		  var identifier = ref.identifier;

  		  return identifier === nameOrMatcher;
  		});
  	} else {
  		matcher = normalizeUrl$2(nameOrMatcher);
  		if (this.routes.some(function (ref) {
  		  var identifier = ref.identifier;

  		  return identifier === matcher;
  		})) {
  			debug$4(
  				("Filter provided, " + nameOrMatcher + ", identifies a route. Returning only calls handled by that route")
  			);
  			calls = calls.filter(function (call) { return call.identifier === matcher; });
  		}
  	}

  	if ((options || matcher !== '*') && calls.length) {
  		if (typeof options === 'string') {
  			options = { method: options };
  		}
  		debug$4(
  			'Compiling filter and options to route in order to filter all calls',
  			nameOrMatcher
  		);
  		calls = filterCallsWithMatcher(matcher, options, calls);
  	}
  	debug$4(("Retrieved " + (calls.length) + " calls"));
  	return calls;
  };

  FetchMock$2.calls = formatDebug(function(nameOrMatcher, options) {
  	debug$4('retrieving matching calls');
  	return this.filterCalls(nameOrMatcher, options);
  });

  FetchMock$2.lastCall = formatDebug(function(nameOrMatcher, options) {
  	debug$4('retrieving last matching call');
  	return [].concat( this.filterCalls(nameOrMatcher, options) ).pop();
  });

  FetchMock$2.lastUrl = formatDebug(function(nameOrMatcher, options) {
  	debug$4('retrieving url of last matching call');
  	return (this.lastCall(nameOrMatcher, options) || [])[0];
  });

  FetchMock$2.lastOptions = formatDebug(function(nameOrMatcher, options) {
  	debug$4('retrieving options of last matching call');
  	return (this.lastCall(nameOrMatcher, options) || [])[1];
  });

  FetchMock$2.called = formatDebug(function(nameOrMatcher, options) {
  	debug$4('checking if matching call was made');
  	return !!this.filterCalls(nameOrMatcher, options).length;
  });

  FetchMock$2.flush = formatDebug(async function(waitForResponseMethods) {
  	setDebugNamespace$1('flush');
  	debug$4(
  		("flushing all fetch calls. " + (waitForResponseMethods ? '' : 'Not ') + "waiting for response bodies to complete download")
  	);

  	var queuedPromises = this._holdingPromises;
  	this._holdingPromises = [];
  	debug$4(((queuedPromises.length) + " fetch calls to be awaited"));

  	await Promise.all(queuedPromises);
  	debug$4("All fetch calls have completed");
  	if (waitForResponseMethods && this._holdingPromises.length) {
  		debug$4("Awaiting all fetch bodies to download");
  		await this.flush(waitForResponseMethods);
  		debug$4("All fetch bodies have completed downloading");
  	}
  	setDebugNamespace$1();
  });

  FetchMock$2.done = formatDebug(function(nameOrMatcher) {
  	var this$1 = this;

  	setDebugPhase$2('inspect');
  	setDebugNamespace$1('done');
  	debug$4('Checking to see if expected calls have been made');
  	var routesToCheck;

  	if (nameOrMatcher && typeof nameOrMatcher !== 'boolean') {
  		debug$4(
  			'Checking to see if expected calls have been made for single route:',
  			nameOrMatcher
  		);
  		routesToCheck = [{ identifier: nameOrMatcher }];
  	} else {
  		debug$4('Checking to see if expected calls have been made for all routes');
  		routesToCheck = this.routes;
  	}

  	// Can't use array.every because would exit after first failure, which would
  	// break the logging
  	var result = routesToCheck
  		.map(function (ref) {
  			var identifier = ref.identifier;

  			if (!this$1.called(identifier)) {
  				debug$4('No calls made for route:', identifier);
  				console.warn(("Warning: " + identifier + " not called")); // eslint-disable-line
  				return false;
  			}

  			var expectedTimes = (
  				this$1.routes.find(function (r) { return r.identifier === identifier; }) || {}
  			).repeat;

  			if (!expectedTimes) {
  				debug$4(
  					'Route has been called at least once, and no expectation of more set:',
  					identifier
  				);
  				return true;
  			}
  			var actualTimes = this$1.filterCalls(identifier).length;

  			debug$4(("Route called " + actualTimes + " times:"), identifier);
  			if (expectedTimes > actualTimes) {
  				debug$4(
  					("Route called " + actualTimes + " times, but expected " + expectedTimes + ":"),
  					identifier
  				);
  				console.warn(
  					("Warning: " + identifier + " only called " + actualTimes + " times, but " + expectedTimes + " expected")
  				); // eslint-disable-line
  				return false;
  			} else {
  				return true;
  			}
  		})
  		.every(function (isDone) { return isDone; });

  	setDebugNamespace$1();
  	setDebugPhase$2();
  	return result;
  });

  var inspecting = FetchMock$2;

  var debug$5 = debug_1$1.debug;




  var FetchMock$3 = Object.assign({}, fetchHandler, setUpAndTearDown, inspecting);

  FetchMock$3.config = {
  	fallbackToNetwork: false,
  	includeContentLength: true,
  	sendAsJson: true,
  	warnOnFallback: true,
  	overwriteRoutes: undefined
  };

  FetchMock$3.createInstance = function() {
  	debug$5('Creating fetch-mock instance');
  	var instance = Object.create(FetchMock$3);
  	instance._uncompiledRoutes = (this._uncompiledRoutes || []).slice();
  	instance.routes = instance._uncompiledRoutes.map(function (config) { return instance.compileRoute(config); }
  	);
  	instance.fallbackResponse = this.fallbackResponse || undefined;
  	instance.config = Object.assign({}, this.config || FetchMock$3.config);
  	instance._calls = [];
  	instance._holdingPromises = [];
  	instance.bindMethods();
  	return instance;
  };

  FetchMock$3.bindMethods = function() {
  	this.fetchHandler = FetchMock$3.fetchHandler.bind(this);
  	this.reset = this.restore = FetchMock$3.reset.bind(this);
  	this.resetHistory = FetchMock$3.resetHistory.bind(this);
  	this.resetBehavior = FetchMock$3.resetBehavior.bind(this);
  };

  FetchMock$3.sandbox = function() {
  	debug$5('Creating sandboxed fetch-mock instance');
  	// this construct allows us to create a fetch-mock instance which is also
  	// a callable function, while circumventing circularity when defining the
  	// object that this function should be bound to
  	var proxy = function (url, options) { return sandbox.fetchHandler(url, options); };

  	var sandbox = Object.assign(
  		proxy, // Ensures that the entire returned object is a callable function
  		FetchMock$3, // prototype methods
  		this.createInstance() // instance data
  	);

  	sandbox.bindMethods();
  	sandbox.isSandbox = true;
  	return sandbox;
  };

  var lib = FetchMock$3;

  var statusTextMap = {
  	'100': 'Continue',
  	'101': 'Switching Protocols',
  	'102': 'Processing',
  	'200': 'OK',
  	'201': 'Created',
  	'202': 'Accepted',
  	'203': 'Non-Authoritative Information',
  	'204': 'No Content',
  	'205': 'Reset Content',
  	'206': 'Partial Content',
  	'207': 'Multi-Status',
  	'208': 'Already Reported',
  	'226': 'IM Used',
  	'300': 'Multiple Choices',
  	'301': 'Moved Permanently',
  	'302': 'Found',
  	'303': 'See Other',
  	'304': 'Not Modified',
  	'305': 'Use Proxy',
  	'307': 'Temporary Redirect',
  	'308': 'Permanent Redirect',
  	'400': 'Bad Request',
  	'401': 'Unauthorized',
  	'402': 'Payment Required',
  	'403': 'Forbidden',
  	'404': 'Not Found',
  	'405': 'Method Not Allowed',
  	'406': 'Not Acceptable',
  	'407': 'Proxy Authentication Required',
  	'408': 'Request Timeout',
  	'409': 'Conflict',
  	'410': 'Gone',
  	'411': 'Length Required',
  	'412': 'Precondition Failed',
  	'413': 'Payload Too Large',
  	'414': 'URI Too Long',
  	'415': 'Unsupported Media Type',
  	'416': 'Range Not Satisfiable',
  	'417': 'Expectation Failed',
  	'418': "I'm a teapot",
  	'421': 'Misdirected Request',
  	'422': 'Unprocessable Entity',
  	'423': 'Locked',
  	'424': 'Failed Dependency',
  	'425': 'Unordered Collection',
  	'426': 'Upgrade Required',
  	'428': 'Precondition Required',
  	'429': 'Too Many Requests',
  	'431': 'Request Header Fields Too Large',
  	'451': 'Unavailable For Legal Reasons',
  	'500': 'Internal Server Error',
  	'501': 'Not Implemented',
  	'502': 'Bad Gateway',
  	'503': 'Service Unavailable',
  	'504': 'Gateway Timeout',
  	'505': 'HTTP Version Not Supported',
  	'506': 'Variant Also Negotiates',
  	'507': 'Insufficient Storage',
  	'508': 'Loop Detected',
  	'509': 'Bandwidth Limit Exceeded',
  	'510': 'Not Extended',
  	'511': 'Network Authentication Required'
  };

  var statusText = statusTextMap;

  var theGlobal = typeof window !== 'undefined' ? window : self;
  var setUrlImplementation = requestUtils.setUrlImplementation;
  setUrlImplementation(theGlobal.URL);

  lib.global = theGlobal;
  lib.statusTextMap = statusText;

  lib.config = Object.assign(lib.config, {
  	Promise: theGlobal.Promise,
  	Request: theGlobal.Request,
  	Response: theGlobal.Response,
  	Headers: theGlobal.Headers
  });

  var client = lib.createInstance();

  //

  var script = {
      name: 'VueFetchMock',
      props: {
          logger: {
              type: Boolean,
              default: false
          },
          throttle: {
              type: Number,
              default: 300
          },
          mocks: {
              type: Array,
              default: function () { return []; }
          }
      },
      beforeMount: function beforeMount() {
          this.mock();
      },
      beforeDestroy: function beforeDestroy() {
          if (client.__prevProxy === this) { this.unmock(); }
      },
      methods: {
          mock: function mock() {
              var arguments$1 = arguments;
              var this$1 = this;

              this.unmock();
              var mocks = this.mocks;
              if (mocks) {
                  mocks.forEach(function (mock) {
                      client.mock(Object.assign({}, mock, {
                          response: function (url, opts) {
                              if (this$1.logger) { console.info('fetch', url, opts); }
                              var result = {
                                  body: mock.response,
                                  headers: new Headers({
                                      'content-type': 'application/json',
                                  }),
                              };

                              if (
                                  mock.response.hasOwnProperty('body') ||
                                  mock.response.hasOwnProperty('status') ||
                                  mock.response.hasOwnProperty('headers')
                              ) {
                                  result = Object.assign({},
                                      result,
                                      mock.response
                                  );
                              }
                              
                              return this$1.throttle
                                  ? new Promise(function (resolve) { setTimeout(function () { return resolve(result); }, this$1.throttle); })
                                  : result
                          }
                      }));
                  });

                  client.catch(function () { return client.realFetch.apply(window, arguments$1.concat()); });
                  client.__prevProxy = this;
              }
          },
          unmock: function unmock() {
              if (typeof client.restore === 'function') {
                  client.restore();
                  delete client.__prevProxy;
              }
          }
      }
  };

  function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
      if (typeof shadowMode !== 'boolean') {
          createInjectorSSR = createInjector;
          createInjector = shadowMode;
          shadowMode = false;
      }
      // Vue.extend constructor export interop.
      var options = typeof script === 'function' ? script.options : script;
      // render functions
      if (template && template.render) {
          options.render = template.render;
          options.staticRenderFns = template.staticRenderFns;
          options._compiled = true;
          // functional template
          if (isFunctionalTemplate) {
              options.functional = true;
          }
      }
      // scopedId
      if (scopeId) {
          options._scopeId = scopeId;
      }
      var hook;
      if (moduleIdentifier) {
          // server build
          hook = function (context) {
              // 2.3 injection
              context =
                  context || // cached call
                      (this.$vnode && this.$vnode.ssrContext) || // stateful
                      (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
              // 2.2 with runInNewContext: true
              if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                  context = __VUE_SSR_CONTEXT__;
              }
              // inject component styles
              if (style) {
                  style.call(this, createInjectorSSR(context));
              }
              // register component module identifier for async chunk inference
              if (context && context._registeredComponents) {
                  context._registeredComponents.add(moduleIdentifier);
              }
          };
          // used by ssr in case component is cached and beforeCreate
          // never gets called
          options._ssrRegister = hook;
      }
      else if (style) {
          hook = shadowMode
              ? function (context) {
                  style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
              }
              : function (context) {
                  style.call(this, createInjector(context));
              };
      }
      if (hook) {
          if (options.functional) {
              // register for functional component in vue file
              var originalRender = options.render;
              options.render = function renderWithStyleInjection(h, context) {
                  hook.call(context);
                  return originalRender(h, context);
              };
          }
          else {
              // inject component registration as beforeCreate hook
              var existing = options.beforeCreate;
              options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
          }
      }
      return script;
  }

  /* script */
  var __vue_script__ = script;

  /* template */
  var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_vm._t("default",[_vm._v("Issues Mounting Component")])],2)};
  var __vue_staticRenderFns__ = [];

    /* style */
    var __vue_inject_styles__ = undefined;
    /* scoped */
    var __vue_scope_id__ = undefined;
    /* module identifier */
    var __vue_module_identifier__ = undefined;
    /* functional template */
    var __vue_is_functional_template__ = false;
    /* style inject */
    
    /* style inject SSR */
    
    /* style inject shadow dom */
    

    
    var __vue_component__ = normalizeComponent(
      { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
      __vue_inject_styles__,
      __vue_script__,
      __vue_scope_id__,
      __vue_is_functional_template__,
      __vue_module_identifier__,
      false,
      undefined,
      undefined,
      undefined
    );

  var plugin = {
      // eslint-disable-next-line no-undef
      version: "0.1.0",
      install: function install(Vue) {
          Vue.component(__vue_component__.name, __vue_component__);
      },
  };

  var GlobalVue = null;
  if (typeof window !== 'undefined') {
      GlobalVue = window.Vue;
  } else if (typeof global !== 'undefined') {
      GlobalVue = global.Vue;
  }
  if (GlobalVue) {
      GlobalVue.use(plugin);
  }

  exports.VueFetchMock = __vue_component__;
  exports.default = plugin;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
