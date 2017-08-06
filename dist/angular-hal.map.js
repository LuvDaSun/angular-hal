(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.angularHal = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 */
var paramRegExp = /; *([!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) */g
var textRegExp = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/
var tokenRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */
var qescRegExp = /\\([\u000b\u0020-\u00ff])/g

/**
 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
 */
var quoteRegExp = /([\\"])/g

/**
 * RegExp to match type in RFC 6838
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
var typeRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+\/[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

/**
 * Module exports.
 * @public
 */

exports.format = format
exports.parse = parse

/**
 * Format object to media type.
 *
 * @param {object} obj
 * @return {string}
 * @public
 */

function format(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('argument obj is required')
  }

  var parameters = obj.parameters
  var type = obj.type

  if (!type || !typeRegExp.test(type)) {
    throw new TypeError('invalid type')
  }

  var string = type

  // append parameters
  if (parameters && typeof parameters === 'object') {
    var param
    var params = Object.keys(parameters).sort()

    for (var i = 0; i < params.length; i++) {
      param = params[i]

      if (!tokenRegExp.test(param)) {
        throw new TypeError('invalid parameter name')
      }

      string += '; ' + param + '=' + qstring(parameters[param])
    }
  }

  return string
}

/**
 * Parse media type to object.
 *
 * @param {string|object} string
 * @return {Object}
 * @public
 */

function parse(string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  if (typeof string === 'object') {
    // support req/res-like objects as argument
    string = getcontenttype(string)

    if (typeof string !== 'string') {
      throw new TypeError('content-type header is missing from object');
    }
  }

  if (typeof string !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  var index = string.indexOf(';')
  var type = index !== -1
    ? string.substr(0, index).trim()
    : string.trim()

  if (!typeRegExp.test(type)) {
    throw new TypeError('invalid media type')
  }

  var key
  var match
  var obj = new ContentType(type.toLowerCase())
  var value

  paramRegExp.lastIndex = index

  while (match = paramRegExp.exec(string)) {
    if (match.index !== index) {
      throw new TypeError('invalid parameter format')
    }

    index += match[0].length
    key = match[1].toLowerCase()
    value = match[2]

    if (value[0] === '"') {
      // remove quotes and escapes
      value = value
        .substr(1, value.length - 2)
        .replace(qescRegExp, '$1')
    }

    obj.parameters[key] = value
  }

  if (index !== -1 && index !== string.length) {
    throw new TypeError('invalid parameter format')
  }

  return obj
}

/**
 * Get content-type from req/res objects.
 *
 * @param {object}
 * @return {Object}
 * @private
 */

function getcontenttype(obj) {
  if (typeof obj.getHeader === 'function') {
    // res-like
    return obj.getHeader('content-type')
  }

  if (typeof obj.headers === 'object') {
    // req-like
    return obj.headers && obj.headers['content-type']
  }
}

/**
 * Quote a string if necessary.
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function qstring(val) {
  var str = String(val)

  // no need to quote tokens
  if (tokenRegExp.test(str)) {
    return str
  }

  if (str.length > 0 && !textRegExp.test(str)) {
    throw new TypeError('invalid parameter value')
  }

  return '"' + str.replace(quoteRegExp, '\\$1') + '"'
}

/**
 * Class to represent a content type.
 * @private
 */
function ContentType(type) {
  this.parameters = Object.create(null)
  this.type = type
}

},{}],2:[function(require,module,exports){
/* jshint node:true */

var UriTemplate = require('./UriTemplate');

function Router() {
    var routes = [];

    this.add = function (template, handler) {

        routes.push({
            template: new UriTemplate(template),
            handler: handler
        }); //

    }; //add

    this.handle = function (url) {

        return routes.some(function (route) {
            var data = route.template.parse(url);
            return data && route.handler(data) !== false;
        });

    }; //exec

} //Router

module.exports = Router;
},{"./UriTemplate":3}],3:[function(require,module,exports){
/* jshint node:true */

module.exports = UriTemplate;


var operatorOptions = {
    "": {
        "prefix": "",
        "seperator": ",",
        "assignment": false,
        "assignEmpty": false,
        "encode": percentEncode
    },
    "+": {
        "prefix": "",
        "seperator": ",",
        "assignment": false,
        "assignEmpty": false,
        "encode": encodeURI
    },
    "#": {
        "prefix": "#",
        "seperator": ",",
        "assignment": false,
        "assignEmpty": false,
        "encode": encodeURI
    },
    ".": {
        "prefix": ".",
        "seperator": ".",
        "assignment": false,
        "assignEmpty": false,
        "encode": percentEncode
    },
    "/": {
        "prefix": "/",
        "seperator": "/",
        "assignment": false,
        "encode": encodeURIComponent
    },
    ";": {
        "prefix": ";",
        "seperator": ";",
        "assignment": true,
        "assignEmpty": false,
        "encode": encodeURIComponent
    },
    "?": {
        "prefix": "?",
        "seperator": "&",
        "assignment": true,
        "assignEmpty": true,
        "encode": encodeURIComponent
    },
    "&": {
        "prefix": "&",
        "seperator": "&",
        "assignment": true,
        "assignEmpty": true,
        "encode": encodeURIComponent
    }
}; //operatorOptions

function percentEncode(value) {
    /*
	http://tools.ietf.org/html/rfc3986#section-2.3
	*/
    var unreserved = "-._~";

    if (isUndefined(value)) return '';

    value = value.toString();

    return Array.prototype.map.call(value, function (ch) {
        var charCode = ch.charCodeAt(0);

        if (charCode >= 0x30 && charCode <= 0x39) return ch;
        if (charCode >= 0x41 && charCode <= 0x5a) return ch;
        if (charCode >= 0x61 && charCode <= 0x7a) return ch;

        if (~unreserved.indexOf(ch)) return ch;

        return '%' + charCode.toString(16).toUpperCase();
    }).join('');

} //percentEncode

function isDefined(value) {
    return !isUndefined(value);
} //isDefined
function isUndefined(value) {
    /*
	http://tools.ietf.org/html/rfc6570#section-2.3
	*/
    if (value === null) return true;
    if (value === undefined) return true;
    if (Array.isArray(value)) {
        if (value.length === 0) return true;
    }

    return false;
} //isUndefined


function UriTemplate(template) {
    /*
	http://tools.ietf.org/html/rfc6570#section-2.2

	expression    =  "{" [ operator ] variable-list "}"
	operator      =  op-level2 / op-level3 / op-reserve
	op-level2     =  "+" / "#"
	op-level3     =  "." / "/" / ";" / "?" / "&"
	op-reserve    =  "=" / "," / "!" / "@" / "|"
	*/
    var reTemplate = /\{([\+#\.\/;\?&=\,!@\|]?)([A-Za-z0-9_\,\.\:\*]+?)\}/g;
    var reVariable = /^([\$_a-z][\$_a-z0-9]*)((?:\:[1-9][0-9]?[0-9]?[0-9]?)?)(\*?)$/i;
    var match;
    var pieces = [];
    var glues = [];
    var offset = 0;
    var pieceCount = 0;

    while ( !! (match = reTemplate.exec(template))) {
        glues.push(template.substring(offset, match.index));
        /*
		The operator characters equals ("="), comma (","), exclamation ("!"),
		at sign ("@"), and pipe ("|") are reserved for future extensions.
		*/
        if (match[1] && ~'=,!@|'.indexOf(match[1])) {
            throw "operator '" + match[1] + "' is reserved for future extensions";
        }

        offset = match.index;
        pieces.push({
            operator: match[1],
            variables: match[2].split(',').map(variableMapper)
        });
        offset += match[0].length;
        pieceCount++;
    }

    function variableMapper(variable) {
        var match = reVariable.exec(variable);
        return {
            name: match[1],
            maxLength: match[2] && parseInt(match[2].substring(1), 10),
            composite: !! match[3]
        };
    }

    glues.push(template.substring(offset));

    this.parse = function (str) {
        var data = {};
        var offset = 0;
        var offsets = [];

        if (!glues.every(function (glue, glueIndex) {
            var index;
            if (glueIndex > 0 && glue === '') index = str.length;
            else index = str.indexOf(glue, offset);

            offset = index;
            offsets.push(offset);
            offset += glue.length;

            return~ index;
        })) return false;

        if (!pieces.every(function (piece, pieceIndex) {
            var options = operatorOptions[piece.operator];
            var value, values;
            var offsetBegin = offsets[pieceIndex] + glues[pieceIndex].length;
            var offsetEnd = offsets[pieceIndex + 1];

            value = str.substring(offsetBegin, offsetEnd);
            if (value.length === 0) return true;
            if (value.substring(0, options.prefix.length) !== options.prefix) return false;
            value = value.substring(options.prefix.length);
            values = value.split(options.seperator);

            if (!piece.variables.every(function (variable, variableIndex) {
                var value = values[variableIndex];
                var name;

                if (value === undefined) return true;

                name = variable.name;

                if (options.assignment) {
                    if (value.substring(0, name.length) !== name) return false;
                    value = value.substring(name.length);
                    if (value.length === 0 && options.assignEmpty) return false;
                    if (value.length > 0) {
                        if (value[0] !== '=') return false;
                        value = value.substring(1);
                    }
                }
                value = decodeURIComponent(value);
                data[name] = value;

                return true;
            })) return false;

            return true;

        })) return false;

        return data;
    }; //parse

    this.stringify = function (data) {
        var str = '';
        data = data || {};

        str += glues[0];
        if (!pieces.every(function (piece, pieceIndex) {

            var options = operatorOptions[piece.operator];
            var parts;

            parts = piece.variables.map(function (variable) {
                var value = data[variable.name];

                if (!Array.isArray(value)) value = [value];

                value = value.filter(isDefined);

                if (isUndefined(value)) return null;

                if (variable.composite) {
                    value = value.map(function (value) {

                        if (typeof value === 'object') {

                            value = Object.keys(value).map(function (key) {
                                var keyValue = value[key];
                                if (variable.maxLength) keyValue = keyValue.substring(0, variable.maxLength);

                                keyValue = options.encode(keyValue);

                                if (keyValue) keyValue = key + '=' + keyValue;
                                else {
                                    keyValue = key;
                                    if (options.assignEmpty) keyValue += '=';
                                }

                                return keyValue;
                            }).join(options.seperator);

                        } else {
                            if (variable.maxLength) value = value.substring(0, variable.maxLength);

                            value = options.encode(value);

                            if (options.assignment) {
                                if (value) value = variable.name + '=' + value;
                                else {
                                    value = variable.name;
                                    if (options.assignEmpty) value += '=';
                                }
                            }
                        }

                        return value;
                    });

                    value = value.join(options.seperator);
                } else {
                    value = value.map(function (value) {
                        if (typeof value === 'object') {
                            return Object.keys(value).map(function (key) {
                                var keyValue = value[key];
                                if (variable.maxLength) keyValue = keyValue.substring(0, variable.maxLength);
                                return key + ',' + options.encode(keyValue);
                            }).join(',');
                        } else {
                            if (variable.maxLength) value = value.substring(0, variable.maxLength);

                            return options.encode(value);
                        }

                    });
                    value = value.join(',');

                    if (options.assignment) {
                        if (value) value = variable.name + '=' + value;
                        else {
                            value = variable.name;
                            if (options.assignEmpty) value += '=';
                        }
                    }

                }

                return value;
            });

            parts = parts.filter(isDefined);
            if (isDefined(parts)) {
                str += options.prefix;
                str += parts.join(options.seperator);
            }

            str += glues[pieceIndex + 1];
            return true;
        })) return false;

        return str;
    }; //stringify

} //UriTemplate
},{}],4:[function(require,module,exports){
/* jshint node:true */

module.exports = {
    Router: require('./Router'),
    UriTemplate: require('./UriTemplate')
};
},{"./Router":2,"./UriTemplate":3}],5:[function(require,module,exports){
"use strict";

/**
 * @deprecated The halClient service is deprecated. Please use $http directly instead.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HalClient = function () {
  /**
   * @param {Log}      $log
   * @param {Http}     $http
   * @param {Function} LinkHeader
   * @param {Object}   $halConfiguration
   */
  function HalClient($log, $http, LinkHeader, $halConfiguration) {
    _classCallCheck(this, HalClient);

    this._$log = $log;
    this._$http = $http;
    this._$halConfiguration = $halConfiguration;
    this.LinkHeader = LinkHeader;
  }

  _createClass(HalClient, [{
    key: "$get",
    value: function $get(href, options) {
      return this.$request("GET", href, options);
    }
  }, {
    key: "$post",
    value: function $post(href, options, data) {
      return this.$request("POST", href, options, data);
    }
  }, {
    key: "$put",
    value: function $put(href, options, data) {
      return this.$request("PUT", href, options, data);
    }
  }, {
    key: "$patch",
    value: function $patch(href, options, data) {
      return this.$request("PATCH", href, options, data);
    }
  }, {
    key: "$delete",
    value: function $delete(href, options) {
      return this.$request("DELETE", href, options);
    }
  }, {
    key: "$link",
    value: function $link(href, options, linkHeaders) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Link = linkHeaders.map(function (link) {
        return link.toString();
      });
      return this.$request("LINK", href, options);
    }
  }, {
    key: "$unlink",
    value: function $unlink(href, options, linkHeaders) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Link = linkHeaders.map(function (link) {
        return link.toString();
      });
      return this.$request("UNLINK", href, options);
    }
  }, {
    key: "$request",
    value: function $request(method, href, options, data) {
      options = options || {};
      this._$log.log("The halClient service is deprecated. Please use $http directly instead.");
      return this._$http(angular.extend({}, options, {
        method: method,
        url: this._$halConfiguration.urlTransformer(href),
        data: data
      })).then(function (_ref) {
        var resource = _ref.data;
        return resource;
      });
    }
  }]);

  return HalClient;
}();

// Inject Dependencies


exports.default = HalClient;
HalClient.$inject = ["$log", "$http", "LinkHeader", "$halConfiguration"];

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _halClient = require("./hal-client");

var _halClient2 = _interopRequireDefault(_halClient);

var _linkHeader = require("./link-header");

var _linkHeader2 = _interopRequireDefault(_linkHeader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = "angular-hal.client";

// Add module for client
angular.module(MODULE_NAME, []).service("halClient", _halClient2.default).service("$halClient", _halClient2.default).value("LinkHeader", _linkHeader2.default);

exports.default = MODULE_NAME;

},{"./hal-client":5,"./link-header":7}],7:[function(require,module,exports){
"use strict";

/**
 * Link Header
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinkHeader = function () {
  /**
   * @param {String} uriReference The Link Value
   * @param {Object} linkParams   The Link Params
   */
  function LinkHeader(uriReference, linkParams) {
    _classCallCheck(this, LinkHeader);

    this.uriReference = uriReference;
    this.linkParams = angular.extend({
      rel: null,
      anchor: null,
      rev: null,
      hreflang: null,
      media: null,
      title: null,
      type: null
    }, linkParams);
  }
  /**
   * @return {String}
   */


  _createClass(LinkHeader, [{
    key: "toString",
    value: function toString() {
      var result = "<" + this.uriReference + ">",
          params = [];

      for (var paramName in this.linkParams) {
        var paramValue = this.linkParams[paramName];
        if (paramValue) {
          params.push(paramName + '="' + paramValue + '"');
        }
      }

      if (params.length < 1) {
        return result;
      }

      result = result + ";" + params.join(";");

      return result;
    }
  }]);

  return LinkHeader;
}();

exports.default = LinkHeader;

},{}],8:[function(require,module,exports){
"use strict";

/**
 * @param {String}
 * @return {String}
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.noopUrlTransformer = noopUrlTransformer;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function noopUrlTransformer(url) {
  return url;
}

var HalConfigurationProvider = function () {
  function HalConfigurationProvider() {
    _classCallCheck(this, HalConfigurationProvider);

    this._linksAttribute = "_links";
    this._embeddedAttribute = "_embedded";
    this._ignoreAttributePrefixes = ["_", "$"];
    this._selfLink = "self";
    this._forceJSONResource = false;
    this._urlTransformer = noopUrlTransformer;

    this.$get.$inject = ["$log"];
  }

  /**
   * @param {String} linksAttribute
   */


  _createClass(HalConfigurationProvider, [{
    key: "setLinksAttribute",
    value: function setLinksAttribute(linksAttribute) {
      this._linksAttribute = linksAttribute;
    }

    /**
     * @param {String} embeddedAttribute
     */

  }, {
    key: "setEmbeddedAttribute",
    value: function setEmbeddedAttribute(embeddedAttribute) {
      this._embeddedAttribute = embeddedAttribute;
    }

    /**
     * @param {String[]} ignoreAttributePrefixes
     */

  }, {
    key: "setIgnoreAttributePrefixes",
    value: function setIgnoreAttributePrefixes(ignoreAttributePrefixes) {
      this._ignoreAttributePrefixes = ignoreAttributePrefixes;
    }

    /**
     * @param {String} ignoreAttributePrefix
     */

  }, {
    key: "addIgnoreAttributePrefix",
    value: function addIgnoreAttributePrefix(ignoreAttributePrefix) {
      this._ignoreAttributePrefixes.push(ignoreAttributePrefix);
    }

    /**
     * @param {String} selfLink
     */

  }, {
    key: "setSelfLink",
    value: function setSelfLink(selfLink) {
      this._selfLink = selfLink;
    }

    /**
     * @param {Boolean} forceJSONResource
     */

  }, {
    key: "setForceJSONResource",
    value: function setForceJSONResource(forceJSONResource) {
      this._forceJSONResource = forceJSONResource;
    }

    /**
     * @param {Function} urlTransformer
     * @deprecated $halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.
     * @see https://docs.angularjs.org/api/ng/service/$http#interceptors
     */

  }, {
    key: "setUrlTransformer",
    value: function setUrlTransformer(urlTransformer) {
      this._urlTransformer = urlTransformer;
    }

    /**
     * Get Configuration
     * @param  {Log} $log logger
     * @return {Object}
     */

  }, {
    key: "$get",
    value: function $get($log) {
      if (this._urlTransformer !== noopUrlTransformer) {
        $log.log("$halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.");
      }

      return Object.freeze({
        linksAttribute: this._linksAttribute,
        embeddedAttribute: this._embeddedAttribute,
        ignoreAttributePrefixes: this._ignoreAttributePrefixes,
        selfLink: this._selfLink,
        forceJSONResource: this._forceJSONResource,
        urlTransformer: this._urlTransformer
      });
    }
  }]);

  return HalConfigurationProvider;
}();

exports.default = HalConfigurationProvider;

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _halConfiguration = require("./hal-configuration.provider");

var _halConfiguration2 = _interopRequireDefault(_halConfiguration);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = "angular-hal.configuration";

// Add module for configuration
angular.module(MODULE_NAME, []).provider("$halConfiguration", _halConfiguration2.default);

exports.default = MODULE_NAME;

},{"./hal-configuration.provider":8}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HttpInterceptorConfiguration;

var _resourceHttpInterceptor = require("./resource-http-interceptor.factory");

var _resourceHttpInterceptor2 = _interopRequireDefault(_resourceHttpInterceptor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {HttpProvider} $httpProvider
 */
function HttpInterceptorConfiguration($httpProvider) {
  $httpProvider.interceptors.push(_resourceHttpInterceptor2.default);
}

HttpInterceptorConfiguration.$inject = ["$httpProvider"];

},{"./resource-http-interceptor.factory":12}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require("../resource/index");

var _index2 = _interopRequireDefault(_index);

var _index3 = require("../configuration/index");

var _index4 = _interopRequireDefault(_index3);

var _httpInterception = require("./http-interception.config");

var _httpInterception2 = _interopRequireDefault(_httpInterception);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = "angular-hal.http-interception";

// Add module for http interception
angular.module(MODULE_NAME, [_index2.default, _index4.default]).config(_httpInterception2.default);

exports.default = MODULE_NAME;

},{"../configuration/index":9,"../resource/index":15,"./http-interception.config":10}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ResourceHttpInterceptorFactory;

var _contentType = require("content-type");

var CONTENT_TYPE = "application/hal+json";

function ResourceHttpInterceptorFactory($halConfiguration, Resource) {
  return {
    request: transformRequest,
    response: transformResponse
  };

  /**
   * Add Hal Json As an accepted format
   * @param {Request} request
   * @return {Request}
   */
  function transformRequest(request) {
    if (typeof request.headers.Accept === "undefined") {
      request.headers.Accept = CONTENT_TYPE;
    } else {
      request.headers.Accept = [CONTENT_TYPE, request.headers.Accept].join(", ");
    }

    return request;
  }

  /**
   * Transform Response
   *
   * @param {Response} response
   * @return {Response|Resource}
   */
  function transformResponse(response) {
    try {
      if ((0, _contentType.parse)(response.headers("Content-Type")).type === CONTENT_TYPE) {
        return transformResponseToResource(response);
      }
    } catch (e) {
      // The parse function could throw an error, we do not want that.
    }
    if (response.config.forceHal) {
      return transformResponseToResource(response);
    }
    if ((response.headers("Content-Type") === "application/json" || response.headers("Content-Type") === null) && $halConfiguration.forceJSONResource) {
      return transformResponseToResource(response);
    }

    return response;
  }
  function transformResponseToResource(response) {
    response.data = new Resource(response.data, response);
    return response;
  }
}

ResourceHttpInterceptorFactory.$inject = ["$halConfiguration", "Resource"];

},{"content-type":1}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require("./http-interception/index");

var _index2 = _interopRequireDefault(_index);

var _index3 = require("./client/index");

var _index4 = _interopRequireDefault(_index3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = "angular-hal";

// Combine needed Modules
angular.module(MODULE_NAME, [_index2.default, _index4.default]);

exports.default = MODULE_NAME;

},{"./client/index":6,"./http-interception/index":11}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HalResourceClientFactory;

var _extendReadOnly = require("../utility/extend-read-only");

var _extendReadOnly2 = _interopRequireDefault(_extendReadOnly);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Factory for HalResourceClient
 * @param {Q}        $q
 * @param {Injector} $injector Prevent Circular Dependency by injecting $injector instead of $http
 * @param {Object}   $halConfiguration
 */
function HalResourceClientFactory($q, $injector, $halConfiguration) {
  return HalResourceClient;

  /**
   * @param {Resource} resource
   * @param {Object}   links
   * @param {Object}   embedded
   */
  function HalResourceClient(resource, embedded) {
    var self = this,
        $http = $injector.get("$http");

    /**
     * Initialize the client
     */
    (function init() {
      (0, _extendReadOnly2.default)(self, {
        $request: $request,
        $get: $get,
        $getCollection: $getCollection,
        $post: $post,
        $put: $put,
        $patch: $patch,
        $delete: $delete,
        $del: $delete,
        $link: $link,
        $unlink: $unlink,
        $getSelf: $getSelf,
        $postSelf: $postSelf,
        $putSelf: $putSelf,
        $patchSelf: $patchSelf,
        $deleteSelf: $deleteSelf,
        $delSelf: $deleteSelf,
        $linkSelf: $linkSelf,
        $unlinkSelf: $unlinkSelf
      });
    })();

    /**
     * Execute a HTTP request against a link
     *
     * @param {String}      method
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {mixed|null}  body
     * @param {Object}      options
     * @return {Promise}
     */
    function $request(method, rel, urlParams, body, options) {
      var promises;

      method = method || "GET";
      rel = rel || $halConfiguration.selfLink;
      urlParams = urlParams || {};
      body = body || null;
      options = options || {};

      if (method === "GET" && rel === $halConfiguration.selfLink) {
        return $q.resolve(resource);
      }

      if (resource.$hasEmbedded(rel) && Array.isArray(embedded[rel])) {
        promises = [];
        for (var i = 0; i < embedded[rel].length; i++) {
          promises.push(embedded[rel][i].$request().$request(method, "self", urlParams, body, options));
        }
        return $q.all(promises);
      }

      if (resource.$hasEmbedded(rel)) {
        return embedded[rel].$request().$request(method, "self", urlParams, body, options);
      }

      if (resource.$hasLink(rel)) {
        var url = resource.$href(rel, urlParams);

        angular.extend(options, {
          method: method,
          data: body
        });

        if (Array.isArray(url)) {
          promises = [];
          for (var j = 0; j < url.length; j++) {
            promises.push($http(angular.extend({}, options, { url: url[j] })));
          }
          // map the HTTP responses to actual resources
          var resources = promises.map(function (promise) {
            return promise.then(function (_ref) {
              var resource = _ref.data;
              return resource;
            });
          });
          return $q.all(resources);
        }

        return performHttpRequest(rel, urlParams, options);
      }

      return $q.reject(new Error('link "' + rel + '" is undefined'));
    }

    /**
     * Execute a HTTP GET request against a link or
     * load an embedded resource
     *
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {Object}      options
     * @return {Promise}
     */
    function $get(rel, urlParams, options) {
      return $request("GET", rel, urlParams, undefined, options);
    }

    /**
     * Execute a HTTP GET request to load a collection. If no embedded collection is found in the response,
     * returns an empty array.
     *
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {Object}      options
     * @return {Promise}
     */
    function $getCollection(rel, urlParams, options) {
      return $get(rel, urlParams, options).then(function (resource) {
        if (!resource.$has(rel)) {
          return [];
        } else {
          return resource.$request().$get(rel);
        }
      });
    }

    /**
     * Execute a HTTP POST request against a link
     *
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {mixed|null}  body
     * @param {Object}      options
     * @return {Promise}
     */
    function $post(rel, urlParams, body, options) {
      return $request("POST", rel, urlParams, body, options);
    }

    /**
     * Execute a HTTP PUT request against a link
     *
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {mixed|null}  body
     * @param {Object}      options
     * @return {Promise}
     */
    function $put(rel, urlParams, body, options) {
      return $request("PUT", rel, urlParams, body, options);
    }

    /**
     * Execute a HTTP PATCH request against a link
     *
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {mixed|null}  body
     * @param {Object}      options
     * @return {Promise}
     */
    function $patch(rel, urlParams, body, options) {
      return $request("PATCH", rel, urlParams, body, options);
    }

    /**
     * Execute a HTTP DELEET request against a link
     *
     * @param {String}      rel
     * @param {Object|null} urlParams
     * @param {Object}      options
     * @return {Promise}
     */
    function $delete(rel, urlParams, options) {
      return $request("DELETE", rel, urlParams, undefined, options);
    }

    /**
     * Execute a HTTP LINK request against a link
     *
     * @param {String}       rel
     * @param {Object|null}  urlParams
     * @param {LinkHeader[]} body
     * @param {Object}       options
     * @return {Promise}
     */
    function $link(rel, urlParams, links, options) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Link = links.map(toStringItem);
      return $request("LINK", rel, urlParams, undefined, options);
    }

    /**
     * Execute a HTTP UNLINK request against a link
     *
     * @param {String}       rel
     * @param {Object|null}  urlParams
     * @param {LinkHeader[]} body
     * @param {Object}       options
     * @return {Promise}
     */
    function $unlink(rel, urlParams, links, options) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Link = links.map(toStringItem);
      return $request("UNLINK", rel, urlParams, undefined, options);
    }

    /**
     * @param {mixed} item
     * @return {String}
     */
    function toStringItem(item) {
      return item.toString();
    }

    /**
     * Execute a HTTP GET request on self
     *
     * @param {Object}      options
     * @return {Promise}
     */
    function $getSelf(options) {
      var fullOptions = angular.extend({}, options, { method: "GET" });
      return performHttpRequest($halConfiguration.selfLink, {}, fullOptions);
    }

    /**
     * Perform a PUT request on self
     * @param payload
     * @param options
     * @returns {Promise}
     */
    function $putSelf(payload, options) {
      return $put($halConfiguration.selfLink, null, payload, options);
    }

    /**
     * Perform a POST request on self
     * @param payload
     * @param options
     * @returns {Promise}
     */
    function $postSelf(payload, options) {
      return $post($halConfiguration.selfLink, null, payload, options);
    }

    /**
     * Perform a PATCH request on self
     * @param payload
     * @param options
     * @returns {Promise}
     */
    function $patchSelf(payload, options) {
      return $patch($halConfiguration.selfLink, null, payload, options);
    }

    /**
     * Perform a LINK request on self
     * @param payload
     * @param options
     * @returns {Promise}
     */
    function $linkSelf(links, options) {
      return $link($halConfiguration.selfLink, null, links, options);
    }

    /**
     * Perform an UNLINK request on self
     * @param payload
     * @param options
     * @returns {Promise}
     */
    function $unlinkSelf(links, options) {
      return $unlink($halConfiguration.selfLink, null, links, options);
    }

    /**
     * Perform a DELETE request on self
     * @param options
     * @returns {Promise}
     */
    function $deleteSelf(options) {
      return $delete($halConfiguration.selfLink, null, options);
    }

    /**
     * Peform http request on resource's rel
     * @param rel link name
     * @param urlParams
     * @param options
     * @returns {*}
     */
    function performHttpRequest(rel, urlParams, options) {
      return $http(angular.extend({}, options, {
        url: resource.$href(rel, urlParams)
      })).then(function (_ref2) {
        var resource = _ref2.data;
        return resource;
      });
    }
  }
}

HalResourceClientFactory.$inject = ["$q", "$injector", "$halConfiguration"];

},{"../utility/extend-read-only":18}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require("../configuration/index");

var _index2 = _interopRequireDefault(_index);

var _resource = require("./resource.factory");

var _resource2 = _interopRequireDefault(_resource);

var _halResourceClient = require("./hal-resource-client.factory");

var _halResourceClient2 = _interopRequireDefault(_halResourceClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = "angular-hal.resource";

// Add module for resource
angular.module(MODULE_NAME, [_index2.default]).factory("Resource", _resource2.default).factory("HalResourceClient", _halResourceClient2.default);

exports.default = MODULE_NAME;

},{"../configuration/index":9,"./hal-resource-client.factory":14,"./resource.factory":16}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = ResourceFactory;

var _extendReadOnly = require("../utility/extend-read-only");

var _extendReadOnly2 = _interopRequireDefault(_extendReadOnly);

var _defineReadOnly = require("../utility/define-read-only");

var _defineReadOnly2 = _interopRequireDefault(_defineReadOnly);

var _generateUrl = require("../utility/generate-url");

var _generateUrl2 = _interopRequireDefault(_generateUrl);

var _normalizeLink = require("../utility/normalize-link");

var _normalizeLink2 = _interopRequireDefault(_normalizeLink);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Factory for Resource
 *
 * @param {Function} HalResourceClient
 * @param {Object}   $halConfiguration
 * @param {Log}      $log
 */
function ResourceFactory(HalResourceClient, $halConfiguration, $log) {
  return Resource;

  /**
   * @param {Object} data
   * @param {Object} response
   */
  function Resource(data, response) {
    var self = this,
        links = {},
        embedded = {},
        client;

    /**
     * Initialize the Resource
     */
    (function init() {
      if ((typeof data === "undefined" ? "undefined" : _typeof(data)) !== "object" || data === null) {
        data = {};
      }
      initializeData();
      initializeEmbedded();
      initializeLinks();
      inititalizeClient();

      (0, _extendReadOnly2.default)(self, {
        $hasLink: $hasLink,
        $hasEmbedded: $hasEmbedded,
        $has: $has,
        $href: $href,
        $meta: $meta,
        $link: $link,
        $request: $request,
        $response: $response
      });
    })();

    /**
     * Add all data from data to itself
     */
    function initializeData() {
      for (var propertyName in data) {
        if (!data.hasOwnProperty(propertyName)) {
          continue;
        }
        if (isMetaProperty(propertyName)) {
          continue;
        }
        (0, _defineReadOnly2.default)(self, propertyName, data[propertyName]);
      }
    }

    /**
     * Normalize all Links
     */
    function initializeLinks() {
      if (_typeof(data[$halConfiguration.linksAttribute]) !== "object") {
        return;
      }

      Object.keys(data[$halConfiguration.linksAttribute]).forEach(function (rel) {
        var link = data[$halConfiguration.linksAttribute][rel];
        links[rel] = (0, _normalizeLink2.default)(response.config.url, link);
      });
    }

    /**
     * Normalize Embedded Contents
     */
    function initializeEmbedded() {
      if (_typeof(data[$halConfiguration.embeddedAttribute]) !== "object") {
        return;
      }

      Object.keys(data[$halConfiguration.embeddedAttribute]).forEach(function (rel) {
        embedResource(rel, data[$halConfiguration.embeddedAttribute][rel]);
      });
    }

    /**
     * Initialize the HTTP CLIENT
     */
    function inititalizeClient() {
      client = new HalResourceClient(self, embedded);
    }

    /**
     * Embed a resource(s)
     *
     * @param {String}          rel
     * @param {Object|Object[]} resources
     */
    function embedResource(rel, resources) {
      if (Array.isArray(resources)) {
        embedded[rel] = [];
        resources.forEach(function (resource) {
          embedded[rel].push(new Resource(resource, response));
        });
        return;
      }
      embedded[rel] = new Resource(resources, response);
    }

    /**
     * Determine if a property name is a meta property
     * @param {String} propertyName
     * @return {Boolean}
     */
    function isMetaProperty(propertyName) {
      for (var i = 0; i < $halConfiguration.ignoreAttributePrefixes.length; i++) {
        if (propertyName.substr(0, 1) === $halConfiguration.ignoreAttributePrefixes[i]) {
          return true;
        }
        if (propertyName === $halConfiguration.linksAttribute || propertyName === $halConfiguration.embeddedAttribute) {
          return true;
        }
      }
      return false;
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $hasLink(rel) {
      return typeof links[rel] !== "undefined";
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $hasEmbedded(rel) {
      return typeof embedded[rel] !== "undefined";
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $has(rel) {
      return $hasLink(rel) || $hasEmbedded(rel);
    }

    /**
     * Get the href of a Link
     *
     * @param {String} rel
     * @param {Object} parameters
     * @return {String}
     */
    function $href(rel, parameters) {
      var link = $link(rel),
          href = link.href;

      if (Array.isArray(link)) {
        href = [];
        for (var i = 0; i < link.length; i++) {
          var subLink = link[i],
              subHref = subLink.href;
          if (typeof subLink.templated !== "undefined" && subLink.templated) {
            subHref = (0, _generateUrl2.default)(subLink.href, parameters);
          }
          subHref = $halConfiguration.urlTransformer(subHref);
          href.push(subHref);
        }
      } else {
        if (typeof link.templated !== "undefined" && link.templated) {
          href = (0, _generateUrl2.default)(link.href, parameters);
        }

        href = $halConfiguration.urlTransformer(href);
      }

      return href;
    }

    /**
     * Get a link
     *
     * !! To get a href, use $href instead !!
     *
     * @param {String} rel
     * @return {Object}
     */
    function $link(rel) {
      if (!$hasLink(rel)) {
        throw new Error('link "' + rel + '" is undefined');
      }
      var link = links[rel];

      if (typeof link.deprecation !== "undefined") {
        $log.warn("The link \"" + rel + "\" is marked as deprecated with the value \"" + link.deprecation + "\".");
      }

      return link;
    }

    /**
     * Get meta properties
     *
     * !! To get a href, use $href instead !!
     * !! To get a link, use $link instead !!
     * !! To get an embedded resource, use $request().$get(rel) instead !!
     *
     * @param {String} rel
     * @return {Object}
     */
    function $meta(name) {
      for (var i = 0; i < $halConfiguration.ignoreAttributePrefixes.length; i++) {
        var fullName = $halConfiguration.ignoreAttributePrefixes[i] + name;
        return data[fullName];
      }
    }

    /**
     * Get the Original Response
     *
     * @return {Object)}
     */
    function $response() {
      return response;
    }

    /**
     * Get the client to perform requests
     *
     * @return {HalResourceClient)}
     */
    function $request() {
      return client;
    }
  }
}
ResourceFactory.$inject = ["HalResourceClient", "$halConfiguration", "$log"];

},{"../utility/define-read-only":17,"../utility/extend-read-only":18,"../utility/generate-url":19,"../utility/normalize-link":20}],17:[function(require,module,exports){
'use strict';

/**
 * Define read-only property in target
 * @param {Object} target
 * @param {String} key
 * @param {mixed}  value
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = defineReadOnly;
function defineReadOnly(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: false,
    enumerable: true,
    value: value,
    writable: false
  });
}

},{}],18:[function(require,module,exports){
"use strict";

/**
 * Extend properties from copy read-only to target
 * @param {Object} target
 * @param {Object} copy
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extendReadOnly;
function extendReadOnly(target, copy) {
  for (var key in copy) {
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: false,
      value: copy[key]
    });
  }
}

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = generateUrl;

var _main = require('rfc6570/src/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate url from template
 *
 * @param  {String} template
 * @param  {Object} parameters
 * @return {String}
 */
function generateUrl(template, parameters) {
  return new _main2.default.UriTemplate(template).stringify(parameters);
}

},{"rfc6570/src/main":4}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = normalizeLink;

var _resolveUrl = require("../utility/resolve-url");

var _resolveUrl2 = _interopRequireDefault(_resolveUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {String} baseUrl
 * @param {mixed}  link
 * @return {Object}
 */
function normalizeLink(baseUrl, link) {
  if (Array.isArray(link)) {
    return link.map(function (item) {
      return normalizeLink(baseUrl, item);
    });
  }
  if (typeof link === "string") {
    return {
      href: (0, _resolveUrl2.default)(baseUrl, link)
    };
  }
  if (typeof link.href === "string") {
    link.href = (0, _resolveUrl2.default)(baseUrl, link.href);
    return link;
  }
  if (Array.isArray(link.href)) {
    return link.href.map(function (href) {
      var newLink = angular.extend({}, link, {
        href: href
      });
      return normalizeLink(baseUrl, newLink);
    });
  }
  return {
    href: baseUrl
  };
}

},{"../utility/resolve-url":21}],21:[function(require,module,exports){
"use strict";

/**
 * Resolve whole URL
 *
 * @param {String} baseUrl
 * @param {String} path
 * @return {String}
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolveUrl;
function resolveUrl(baseUrl, path) {
  var resultHref = "",
      reFullUrl = /^((?:\w+:)?)((?:\/\/)?)([^/]*)((?:\/.*)?)$/,
      baseHrefMatch = reFullUrl.exec(baseUrl),
      hrefMatch = reFullUrl.exec(path);

  for (var partIndex = 1; partIndex < 5; partIndex++) {
    if (hrefMatch[partIndex]) {
      resultHref += hrefMatch[partIndex];
    } else {
      resultHref += baseHrefMatch[partIndex];
    }
  }

  return resultHref;
}

},{}]},{},[13])(13)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29udGVudC10eXBlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JmYzY1NzAvc3JjL1JvdXRlci5qcyIsIm5vZGVfbW9kdWxlcy9yZmM2NTcwL3NyYy9VcmlUZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZmM2NTcwL3NyYy9tYWluLmpzIiwic3JjL2NsaWVudC9oYWwtY2xpZW50LmpzIiwic3JjL2NsaWVudC9pbmRleC5qcyIsInNyYy9jbGllbnQvbGluay1oZWFkZXIuanMiLCJzcmMvY29uZmlndXJhdGlvbi9oYWwtY29uZmlndXJhdGlvbi5wcm92aWRlci5qcyIsInNyYy9jb25maWd1cmF0aW9uL2luZGV4LmpzIiwic3JjL2h0dHAtaW50ZXJjZXB0aW9uL2h0dHAtaW50ZXJjZXB0aW9uLmNvbmZpZy5qcyIsInNyYy9odHRwLWludGVyY2VwdGlvbi9pbmRleC5qcyIsInNyYy9odHRwLWludGVyY2VwdGlvbi9yZXNvdXJjZS1odHRwLWludGVyY2VwdG9yLmZhY3RvcnkuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvcmVzb3VyY2UvaGFsLXJlc291cmNlLWNsaWVudC5mYWN0b3J5LmpzIiwic3JjL3Jlc291cmNlL2luZGV4LmpzIiwic3JjL3Jlc291cmNlL3Jlc291cmNlLmZhY3RvcnkuanMiLCJzcmMvdXRpbGl0eS9kZWZpbmUtcmVhZC1vbmx5LmpzIiwic3JjL3V0aWxpdHkvZXh0ZW5kLXJlYWQtb25seS5qcyIsInNyYy91dGlsaXR5L2dlbmVyYXRlLXVybC5qcyIsInNyYy91dGlsaXR5L25vcm1hbGl6ZS1saW5rLmpzIiwic3JjL3V0aWxpdHkvcmVzb2x2ZS11cmwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q0FBYyxLQUFLLElBQW5CLENBQUosRUFBOEI7QUFDNUIsV0FBTyxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWMsVUFBUyxJQUFULEVBQWU7QUFDbEMsVUFBSSxVQUFVLFFBQVEsTUFBUixDQUFlLEVBQWYsRUFBbUIsSUFBbkIsRUFBeUI7QUFDckMsY0FBTTtBQUQrQixPQUF6QixDQUFkO0FBR0EsYUFBTyxjQUFjLE9BQWQsRUFBdUIsT0FBdkIsQ0FBUDtBQUNELEtBTE0sQ0FBUDtBQU1EO0FBQ0QsU0FBTztBQUNMLFVBQU07QUFERCxHQUFQO0FBR0Q7OztBQ25DRDs7QUFFQTs7Ozs7Ozs7Ozs7a0JBT3dCLFU7QUFBVCxTQUFTLFVBQVQsQ0FBb0IsT0FBcEIsRUFBNkIsSUFBN0IsRUFBbUM7QUFDaEQsTUFBSSxhQUFhLEVBQWpCO0FBQUEsTUFDRSxZQUFZLDRDQURkO0FBQUEsTUFFRSxnQkFBZ0IsVUFBVSxJQUFWLENBQWUsT0FBZixDQUZsQjtBQUFBLE1BR0UsWUFBWSxVQUFVLElBQVYsQ0FBZSxJQUFmLENBSGQ7O0FBS0EsT0FBSyxJQUFJLFlBQVksQ0FBckIsRUFBd0IsWUFBWSxDQUFwQyxFQUF1QyxXQUF2QyxFQUFvRDtBQUNsRCxRQUFJLFVBQVUsU0FBVixDQUFKLEVBQTBCO0FBQ3hCLG9CQUFjLFVBQVUsU0FBVixDQUFkO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsb0JBQWMsY0FBYyxTQUFkLENBQWQ7QUFDRDtBQUNGOztBQUVELFNBQU8sVUFBUDtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogY29udGVudC10eXBlXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbi8qKlxuICogUmVnRXhwIHRvIG1hdGNoICooIFwiO1wiIHBhcmFtZXRlciApIGluIFJGQyA3MjMxIHNlYyAzLjEuMS4xXG4gKlxuICogcGFyYW1ldGVyICAgICA9IHRva2VuIFwiPVwiICggdG9rZW4gLyBxdW90ZWQtc3RyaW5nIClcbiAqIHRva2VuICAgICAgICAgPSAxKnRjaGFyXG4gKiB0Y2hhciAgICAgICAgID0gXCIhXCIgLyBcIiNcIiAvIFwiJFwiIC8gXCIlXCIgLyBcIiZcIiAvIFwiJ1wiIC8gXCIqXCJcbiAqICAgICAgICAgICAgICAgLyBcIitcIiAvIFwiLVwiIC8gXCIuXCIgLyBcIl5cIiAvIFwiX1wiIC8gXCJgXCIgLyBcInxcIiAvIFwiflwiXG4gKiAgICAgICAgICAgICAgIC8gRElHSVQgLyBBTFBIQVxuICogICAgICAgICAgICAgICA7IGFueSBWQ0hBUiwgZXhjZXB0IGRlbGltaXRlcnNcbiAqIHF1b3RlZC1zdHJpbmcgPSBEUVVPVEUgKiggcWR0ZXh0IC8gcXVvdGVkLXBhaXIgKSBEUVVPVEVcbiAqIHFkdGV4dCAgICAgICAgPSBIVEFCIC8gU1AgLyAleDIxIC8gJXgyMy01QiAvICV4NUQtN0UgLyBvYnMtdGV4dFxuICogb2JzLXRleHQgICAgICA9ICV4ODAtRkZcbiAqIHF1b3RlZC1wYWlyICAgPSBcIlxcXCIgKCBIVEFCIC8gU1AgLyBWQ0hBUiAvIG9icy10ZXh0IClcbiAqL1xudmFyIHBhcmFtUmVnRXhwID0gLzsgKihbISMkJSYnXFwqXFwrXFwtXFwuXFxeX2BcXHx+MC05QS1aYS16XSspICo9ICooXCIoPzpbXFx1MDAwYlxcdTAwMjBcXHUwMDIxXFx1MDAyMy1cXHUwMDViXFx1MDA1ZC1cXHUwMDdlXFx1MDA4MC1cXHUwMGZmXXxcXFxcW1xcdTAwMGJcXHUwMDIwLVxcdTAwZmZdKSpcInxbISMkJSYnXFwqXFwrXFwtXFwuXFxeX2BcXHx+MC05QS1aYS16XSspICovZ1xudmFyIHRleHRSZWdFeHAgPSAvXltcXHUwMDBiXFx1MDAyMC1cXHUwMDdlXFx1MDA4MC1cXHUwMGZmXSskL1xudmFyIHRva2VuUmVnRXhwID0gL15bISMkJSYnXFwqXFwrXFwtXFwuXFxeX2BcXHx+MC05QS1aYS16XSskL1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBxdW90ZWQtcGFpciBpbiBSRkMgNzIzMCBzZWMgMy4yLjZcbiAqXG4gKiBxdW90ZWQtcGFpciA9IFwiXFxcIiAoIEhUQUIgLyBTUCAvIFZDSEFSIC8gb2JzLXRleHQgKVxuICogb2JzLXRleHQgICAgPSAleDgwLUZGXG4gKi9cbnZhciBxZXNjUmVnRXhwID0gL1xcXFwoW1xcdTAwMGJcXHUwMDIwLVxcdTAwZmZdKS9nXG5cbi8qKlxuICogUmVnRXhwIHRvIG1hdGNoIGNoYXJzIHRoYXQgbXVzdCBiZSBxdW90ZWQtcGFpciBpbiBSRkMgNzIzMCBzZWMgMy4yLjZcbiAqL1xudmFyIHF1b3RlUmVnRXhwID0gLyhbXFxcXFwiXSkvZ1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCB0eXBlIGluIFJGQyA2ODM4XG4gKlxuICogbWVkaWEtdHlwZSA9IHR5cGUgXCIvXCIgc3VidHlwZVxuICogdHlwZSAgICAgICA9IHRva2VuXG4gKiBzdWJ0eXBlICAgID0gdG9rZW5cbiAqL1xudmFyIHR5cGVSZWdFeHAgPSAvXlshIyQlJidcXCpcXCtcXC1cXC5cXF5fYFxcfH4wLTlBLVphLXpdK1xcL1shIyQlJidcXCpcXCtcXC1cXC5cXF5fYFxcfH4wLTlBLVphLXpdKyQvXG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKiBAcHVibGljXG4gKi9cblxuZXhwb3J0cy5mb3JtYXQgPSBmb3JtYXRcbmV4cG9ydHMucGFyc2UgPSBwYXJzZVxuXG4vKipcbiAqIEZvcm1hdCBvYmplY3QgdG8gbWVkaWEgdHlwZS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0KG9iaikge1xuICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IG9iaiBpcyByZXF1aXJlZCcpXG4gIH1cblxuICB2YXIgcGFyYW1ldGVycyA9IG9iai5wYXJhbWV0ZXJzXG4gIHZhciB0eXBlID0gb2JqLnR5cGVcblxuICBpZiAoIXR5cGUgfHwgIXR5cGVSZWdFeHAudGVzdCh0eXBlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ludmFsaWQgdHlwZScpXG4gIH1cblxuICB2YXIgc3RyaW5nID0gdHlwZVxuXG4gIC8vIGFwcGVuZCBwYXJhbWV0ZXJzXG4gIGlmIChwYXJhbWV0ZXJzICYmIHR5cGVvZiBwYXJhbWV0ZXJzID09PSAnb2JqZWN0Jykge1xuICAgIHZhciBwYXJhbVxuICAgIHZhciBwYXJhbXMgPSBPYmplY3Qua2V5cyhwYXJhbWV0ZXJzKS5zb3J0KClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyYW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwYXJhbSA9IHBhcmFtc1tpXVxuXG4gICAgICBpZiAoIXRva2VuUmVnRXhwLnRlc3QocGFyYW0pKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ludmFsaWQgcGFyYW1ldGVyIG5hbWUnKVxuICAgICAgfVxuXG4gICAgICBzdHJpbmcgKz0gJzsgJyArIHBhcmFtICsgJz0nICsgcXN0cmluZyhwYXJhbWV0ZXJzW3BhcmFtXSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3RyaW5nXG59XG5cbi8qKlxuICogUGFyc2UgbWVkaWEgdHlwZSB0byBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBzdHJpbmdcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHJpbmcpIHtcbiAgaWYgKCFzdHJpbmcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzdHJpbmcgaXMgcmVxdWlyZWQnKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBzdHJpbmcgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gc3VwcG9ydCByZXEvcmVzLWxpa2Ugb2JqZWN0cyBhcyBhcmd1bWVudFxuICAgIHN0cmluZyA9IGdldGNvbnRlbnR0eXBlKHN0cmluZylcblxuICAgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignY29udGVudC10eXBlIGhlYWRlciBpcyBtaXNzaW5nIGZyb20gb2JqZWN0Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc3RyaW5nIGlzIHJlcXVpcmVkIHRvIGJlIGEgc3RyaW5nJylcbiAgfVxuXG4gIHZhciBpbmRleCA9IHN0cmluZy5pbmRleE9mKCc7JylcbiAgdmFyIHR5cGUgPSBpbmRleCAhPT0gLTFcbiAgICA/IHN0cmluZy5zdWJzdHIoMCwgaW5kZXgpLnRyaW0oKVxuICAgIDogc3RyaW5nLnRyaW0oKVxuXG4gIGlmICghdHlwZVJlZ0V4cC50ZXN0KHR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBtZWRpYSB0eXBlJylcbiAgfVxuXG4gIHZhciBrZXlcbiAgdmFyIG1hdGNoXG4gIHZhciBvYmogPSBuZXcgQ29udGVudFR5cGUodHlwZS50b0xvd2VyQ2FzZSgpKVxuICB2YXIgdmFsdWVcblxuICBwYXJhbVJlZ0V4cC5sYXN0SW5kZXggPSBpbmRleFxuXG4gIHdoaWxlIChtYXRjaCA9IHBhcmFtUmVnRXhwLmV4ZWMoc3RyaW5nKSkge1xuICAgIGlmIChtYXRjaC5pbmRleCAhPT0gaW5kZXgpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ludmFsaWQgcGFyYW1ldGVyIGZvcm1hdCcpXG4gICAgfVxuXG4gICAgaW5kZXggKz0gbWF0Y2hbMF0ubGVuZ3RoXG4gICAga2V5ID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKVxuICAgIHZhbHVlID0gbWF0Y2hbMl1cblxuICAgIGlmICh2YWx1ZVswXSA9PT0gJ1wiJykge1xuICAgICAgLy8gcmVtb3ZlIHF1b3RlcyBhbmQgZXNjYXBlc1xuICAgICAgdmFsdWUgPSB2YWx1ZVxuICAgICAgICAuc3Vic3RyKDEsIHZhbHVlLmxlbmd0aCAtIDIpXG4gICAgICAgIC5yZXBsYWNlKHFlc2NSZWdFeHAsICckMScpXG4gICAgfVxuXG4gICAgb2JqLnBhcmFtZXRlcnNba2V5XSA9IHZhbHVlXG4gIH1cblxuICBpZiAoaW5kZXggIT09IC0xICYmIGluZGV4ICE9PSBzdHJpbmcubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBwYXJhbWV0ZXIgZm9ybWF0JylcbiAgfVxuXG4gIHJldHVybiBvYmpcbn1cblxuLyoqXG4gKiBHZXQgY29udGVudC10eXBlIGZyb20gcmVxL3JlcyBvYmplY3RzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fVxuICogQHJldHVybiB7T2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBnZXRjb250ZW50dHlwZShvYmopIHtcbiAgaWYgKHR5cGVvZiBvYmouZ2V0SGVhZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gcmVzLWxpa2VcbiAgICByZXR1cm4gb2JqLmdldEhlYWRlcignY29udGVudC10eXBlJylcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqLmhlYWRlcnMgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gcmVxLWxpa2VcbiAgICByZXR1cm4gb2JqLmhlYWRlcnMgJiYgb2JqLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddXG4gIH1cbn1cblxuLyoqXG4gKiBRdW90ZSBhIHN0cmluZyBpZiBuZWNlc3NhcnkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbFxuICogQHJldHVybiB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBxc3RyaW5nKHZhbCkge1xuICB2YXIgc3RyID0gU3RyaW5nKHZhbClcblxuICAvLyBubyBuZWVkIHRvIHF1b3RlIHRva2Vuc1xuICBpZiAodG9rZW5SZWdFeHAudGVzdChzdHIpKSB7XG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgaWYgKHN0ci5sZW5ndGggPiAwICYmICF0ZXh0UmVnRXhwLnRlc3Qoc3RyKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ludmFsaWQgcGFyYW1ldGVyIHZhbHVlJylcbiAgfVxuXG4gIHJldHVybiAnXCInICsgc3RyLnJlcGxhY2UocXVvdGVSZWdFeHAsICdcXFxcJDEnKSArICdcIidcbn1cblxuLyoqXG4gKiBDbGFzcyB0byByZXByZXNlbnQgYSBjb250ZW50IHR5cGUuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBDb250ZW50VHlwZSh0eXBlKSB7XG4gIHRoaXMucGFyYW1ldGVycyA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgdGhpcy50eXBlID0gdHlwZVxufVxuIiwiLyoganNoaW50IG5vZGU6dHJ1ZSAqL1xuXG52YXIgVXJpVGVtcGxhdGUgPSByZXF1aXJlKCcuL1VyaVRlbXBsYXRlJyk7XG5cbmZ1bmN0aW9uIFJvdXRlcigpIHtcbiAgICB2YXIgcm91dGVzID0gW107XG5cbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgaGFuZGxlcikge1xuXG4gICAgICAgIHJvdXRlcy5wdXNoKHtcbiAgICAgICAgICAgIHRlbXBsYXRlOiBuZXcgVXJpVGVtcGxhdGUodGVtcGxhdGUpLFxuICAgICAgICAgICAgaGFuZGxlcjogaGFuZGxlclxuICAgICAgICB9KTsgLy9cblxuICAgIH07IC8vYWRkXG5cbiAgICB0aGlzLmhhbmRsZSA9IGZ1bmN0aW9uICh1cmwpIHtcblxuICAgICAgICByZXR1cm4gcm91dGVzLnNvbWUoZnVuY3Rpb24gKHJvdXRlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJvdXRlLnRlbXBsYXRlLnBhcnNlKHVybCk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YSAmJiByb3V0ZS5oYW5kbGVyKGRhdGEpICE9PSBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9OyAvL2V4ZWNcblxufSAvL1JvdXRlclxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcjsiLCIvKiBqc2hpbnQgbm9kZTp0cnVlICovXG5cbm1vZHVsZS5leHBvcnRzID0gVXJpVGVtcGxhdGU7XG5cblxudmFyIG9wZXJhdG9yT3B0aW9ucyA9IHtcbiAgICBcIlwiOiB7XG4gICAgICAgIFwicHJlZml4XCI6IFwiXCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiLFwiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogZmFsc2UsXG4gICAgICAgIFwiYXNzaWduRW1wdHlcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IHBlcmNlbnRFbmNvZGVcbiAgICB9LFxuICAgIFwiK1wiOiB7XG4gICAgICAgIFwicHJlZml4XCI6IFwiXCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiLFwiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogZmFsc2UsXG4gICAgICAgIFwiYXNzaWduRW1wdHlcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IGVuY29kZVVSSVxuICAgIH0sXG4gICAgXCIjXCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCIjXCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiLFwiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogZmFsc2UsXG4gICAgICAgIFwiYXNzaWduRW1wdHlcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IGVuY29kZVVSSVxuICAgIH0sXG4gICAgXCIuXCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCIuXCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiLlwiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogZmFsc2UsXG4gICAgICAgIFwiYXNzaWduRW1wdHlcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IHBlcmNlbnRFbmNvZGVcbiAgICB9LFxuICAgIFwiL1wiOiB7XG4gICAgICAgIFwicHJlZml4XCI6IFwiL1wiLFxuICAgICAgICBcInNlcGVyYXRvclwiOiBcIi9cIixcbiAgICAgICAgXCJhc3NpZ25tZW50XCI6IGZhbHNlLFxuICAgICAgICBcImVuY29kZVwiOiBlbmNvZGVVUklDb21wb25lbnRcbiAgICB9LFxuICAgIFwiO1wiOiB7XG4gICAgICAgIFwicHJlZml4XCI6IFwiO1wiLFxuICAgICAgICBcInNlcGVyYXRvclwiOiBcIjtcIixcbiAgICAgICAgXCJhc3NpZ25tZW50XCI6IHRydWUsXG4gICAgICAgIFwiYXNzaWduRW1wdHlcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IGVuY29kZVVSSUNvbXBvbmVudFxuICAgIH0sXG4gICAgXCI/XCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCI/XCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiJlwiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogdHJ1ZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiB0cnVlLFxuICAgICAgICBcImVuY29kZVwiOiBlbmNvZGVVUklDb21wb25lbnRcbiAgICB9LFxuICAgIFwiJlwiOiB7XG4gICAgICAgIFwicHJlZml4XCI6IFwiJlwiLFxuICAgICAgICBcInNlcGVyYXRvclwiOiBcIiZcIixcbiAgICAgICAgXCJhc3NpZ25tZW50XCI6IHRydWUsXG4gICAgICAgIFwiYXNzaWduRW1wdHlcIjogdHJ1ZSxcbiAgICAgICAgXCJlbmNvZGVcIjogZW5jb2RlVVJJQ29tcG9uZW50XG4gICAgfVxufTsgLy9vcGVyYXRvck9wdGlvbnNcblxuZnVuY3Rpb24gcGVyY2VudEVuY29kZSh2YWx1ZSkge1xuICAgIC8qXG5cdGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM5ODYjc2VjdGlvbi0yLjNcblx0Ki9cbiAgICB2YXIgdW5yZXNlcnZlZCA9IFwiLS5fflwiO1xuXG4gICAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSkgcmV0dXJuICcnO1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh2YWx1ZSwgZnVuY3Rpb24gKGNoKSB7XG4gICAgICAgIHZhciBjaGFyQ29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG5cbiAgICAgICAgaWYgKGNoYXJDb2RlID49IDB4MzAgJiYgY2hhckNvZGUgPD0gMHgzOSkgcmV0dXJuIGNoO1xuICAgICAgICBpZiAoY2hhckNvZGUgPj0gMHg0MSAmJiBjaGFyQ29kZSA8PSAweDVhKSByZXR1cm4gY2g7XG4gICAgICAgIGlmIChjaGFyQ29kZSA+PSAweDYxICYmIGNoYXJDb2RlIDw9IDB4N2EpIHJldHVybiBjaDtcblxuICAgICAgICBpZiAofnVucmVzZXJ2ZWQuaW5kZXhPZihjaCkpIHJldHVybiBjaDtcblxuICAgICAgICByZXR1cm4gJyUnICsgY2hhckNvZGUudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gICAgfSkuam9pbignJyk7XG5cbn0gLy9wZXJjZW50RW5jb2RlXG5cbmZ1bmN0aW9uIGlzRGVmaW5lZCh2YWx1ZSkge1xuICAgIHJldHVybiAhaXNVbmRlZmluZWQodmFsdWUpO1xufSAvL2lzRGVmaW5lZFxuZnVuY3Rpb24gaXNVbmRlZmluZWQodmFsdWUpIHtcbiAgICAvKlxuXHRodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2NTcwI3NlY3Rpb24tMi4zXG5cdCovXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbn0gLy9pc1VuZGVmaW5lZFxuXG5cbmZ1bmN0aW9uIFVyaVRlbXBsYXRlKHRlbXBsYXRlKSB7XG4gICAgLypcblx0aHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjU3MCNzZWN0aW9uLTIuMlxuXG5cdGV4cHJlc3Npb24gICAgPSAgXCJ7XCIgWyBvcGVyYXRvciBdIHZhcmlhYmxlLWxpc3QgXCJ9XCJcblx0b3BlcmF0b3IgICAgICA9ICBvcC1sZXZlbDIgLyBvcC1sZXZlbDMgLyBvcC1yZXNlcnZlXG5cdG9wLWxldmVsMiAgICAgPSAgXCIrXCIgLyBcIiNcIlxuXHRvcC1sZXZlbDMgICAgID0gIFwiLlwiIC8gXCIvXCIgLyBcIjtcIiAvIFwiP1wiIC8gXCImXCJcblx0b3AtcmVzZXJ2ZSAgICA9ICBcIj1cIiAvIFwiLFwiIC8gXCIhXCIgLyBcIkBcIiAvIFwifFwiXG5cdCovXG4gICAgdmFyIHJlVGVtcGxhdGUgPSAvXFx7KFtcXCsjXFwuXFwvO1xcPyY9XFwsIUBcXHxdPykoW0EtWmEtejAtOV9cXCxcXC5cXDpcXCpdKz8pXFx9L2c7XG4gICAgdmFyIHJlVmFyaWFibGUgPSAvXihbXFwkX2Etel1bXFwkX2EtejAtOV0qKSgoPzpcXDpbMS05XVswLTldP1swLTldP1swLTldPyk/KShcXCo/KSQvaTtcbiAgICB2YXIgbWF0Y2g7XG4gICAgdmFyIHBpZWNlcyA9IFtdO1xuICAgIHZhciBnbHVlcyA9IFtdO1xuICAgIHZhciBvZmZzZXQgPSAwO1xuICAgIHZhciBwaWVjZUNvdW50ID0gMDtcblxuICAgIHdoaWxlICggISEgKG1hdGNoID0gcmVUZW1wbGF0ZS5leGVjKHRlbXBsYXRlKSkpIHtcbiAgICAgICAgZ2x1ZXMucHVzaCh0ZW1wbGF0ZS5zdWJzdHJpbmcob2Zmc2V0LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICAvKlxuXHRcdFRoZSBvcGVyYXRvciBjaGFyYWN0ZXJzIGVxdWFscyAoXCI9XCIpLCBjb21tYSAoXCIsXCIpLCBleGNsYW1hdGlvbiAoXCIhXCIpLFxuXHRcdGF0IHNpZ24gKFwiQFwiKSwgYW5kIHBpcGUgKFwifFwiKSBhcmUgcmVzZXJ2ZWQgZm9yIGZ1dHVyZSBleHRlbnNpb25zLlxuXHRcdCovXG4gICAgICAgIGlmIChtYXRjaFsxXSAmJiB+Jz0sIUB8Jy5pbmRleE9mKG1hdGNoWzFdKSkge1xuICAgICAgICAgICAgdGhyb3cgXCJvcGVyYXRvciAnXCIgKyBtYXRjaFsxXSArIFwiJyBpcyByZXNlcnZlZCBmb3IgZnV0dXJlIGV4dGVuc2lvbnNcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCA9IG1hdGNoLmluZGV4O1xuICAgICAgICBwaWVjZXMucHVzaCh7XG4gICAgICAgICAgICBvcGVyYXRvcjogbWF0Y2hbMV0sXG4gICAgICAgICAgICB2YXJpYWJsZXM6IG1hdGNoWzJdLnNwbGl0KCcsJykubWFwKHZhcmlhYmxlTWFwcGVyKVxuICAgICAgICB9KTtcbiAgICAgICAgb2Zmc2V0ICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgcGllY2VDb3VudCsrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhcmlhYmxlTWFwcGVyKHZhcmlhYmxlKSB7XG4gICAgICAgIHZhciBtYXRjaCA9IHJlVmFyaWFibGUuZXhlYyh2YXJpYWJsZSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgICAgIG1heExlbmd0aDogbWF0Y2hbMl0gJiYgcGFyc2VJbnQobWF0Y2hbMl0uc3Vic3RyaW5nKDEpLCAxMCksXG4gICAgICAgICAgICBjb21wb3NpdGU6ICEhIG1hdGNoWzNdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZ2x1ZXMucHVzaCh0ZW1wbGF0ZS5zdWJzdHJpbmcob2Zmc2V0KSk7XG5cbiAgICB0aGlzLnBhcnNlID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgdmFyIG9mZnNldHMgPSBbXTtcblxuICAgICAgICBpZiAoIWdsdWVzLmV2ZXJ5KGZ1bmN0aW9uIChnbHVlLCBnbHVlSW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBpbmRleDtcbiAgICAgICAgICAgIGlmIChnbHVlSW5kZXggPiAwICYmIGdsdWUgPT09ICcnKSBpbmRleCA9IHN0ci5sZW5ndGg7XG4gICAgICAgICAgICBlbHNlIGluZGV4ID0gc3RyLmluZGV4T2YoZ2x1ZSwgb2Zmc2V0KTtcblxuICAgICAgICAgICAgb2Zmc2V0ID0gaW5kZXg7XG4gICAgICAgICAgICBvZmZzZXRzLnB1c2gob2Zmc2V0KTtcbiAgICAgICAgICAgIG9mZnNldCArPSBnbHVlLmxlbmd0aDtcblxuICAgICAgICAgICAgcmV0dXJufiBpbmRleDtcbiAgICAgICAgfSkpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBpZiAoIXBpZWNlcy5ldmVyeShmdW5jdGlvbiAocGllY2UsIHBpZWNlSW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gb3BlcmF0b3JPcHRpb25zW3BpZWNlLm9wZXJhdG9yXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgdmFsdWVzO1xuICAgICAgICAgICAgdmFyIG9mZnNldEJlZ2luID0gb2Zmc2V0c1twaWVjZUluZGV4XSArIGdsdWVzW3BpZWNlSW5kZXhdLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBvZmZzZXRFbmQgPSBvZmZzZXRzW3BpZWNlSW5kZXggKyAxXTtcblxuICAgICAgICAgICAgdmFsdWUgPSBzdHIuc3Vic3RyaW5nKG9mZnNldEJlZ2luLCBvZmZzZXRFbmQpO1xuICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBpZiAodmFsdWUuc3Vic3RyaW5nKDAsIG9wdGlvbnMucHJlZml4Lmxlbmd0aCkgIT09IG9wdGlvbnMucHJlZml4KSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyhvcHRpb25zLnByZWZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgdmFsdWVzID0gdmFsdWUuc3BsaXQob3B0aW9ucy5zZXBlcmF0b3IpO1xuXG4gICAgICAgICAgICBpZiAoIXBpZWNlLnZhcmlhYmxlcy5ldmVyeShmdW5jdGlvbiAodmFyaWFibGUsIHZhcmlhYmxlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbdmFyaWFibGVJbmRleF07XG4gICAgICAgICAgICAgICAgdmFyIG5hbWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgICAgICBuYW1lID0gdmFyaWFibGUubmFtZTtcblxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmFzc2lnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLnN1YnN0cmluZygwLCBuYW1lLmxlbmd0aCkgIT09IG5hbWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcobmFtZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwICYmIG9wdGlvbnMuYXNzaWduRW1wdHkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZVswXSAhPT0gJz0nKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgZGF0YVtuYW1lXSA9IHZhbHVlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICB9KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07IC8vcGFyc2VcblxuICAgIHRoaXMuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICBkYXRhID0gZGF0YSB8fCB7fTtcblxuICAgICAgICBzdHIgKz0gZ2x1ZXNbMF07XG4gICAgICAgIGlmICghcGllY2VzLmV2ZXJ5KGZ1bmN0aW9uIChwaWVjZSwgcGllY2VJbmRleCkge1xuXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IG9wZXJhdG9yT3B0aW9uc1twaWVjZS5vcGVyYXRvcl07XG4gICAgICAgICAgICB2YXIgcGFydHM7XG5cbiAgICAgICAgICAgIHBhcnRzID0gcGllY2UudmFyaWFibGVzLm1hcChmdW5jdGlvbiAodmFyaWFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3ZhcmlhYmxlLm5hbWVdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSkgdmFsdWUgPSBbdmFsdWVdO1xuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5maWx0ZXIoaXNEZWZpbmVkKTtcblxuICAgICAgICAgICAgICAgIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLmNvbXBvc2l0ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLm1hcChmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gT2JqZWN0LmtleXModmFsdWUpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IHZhbHVlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS5tYXhMZW5ndGgpIGtleVZhbHVlID0ga2V5VmFsdWUuc3Vic3RyaW5nKDAsIHZhcmlhYmxlLm1heExlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5VmFsdWUgPSBvcHRpb25zLmVuY29kZShrZXlWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleVZhbHVlKSBrZXlWYWx1ZSA9IGtleSArICc9JyArIGtleVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleVZhbHVlID0ga2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzaWduRW1wdHkpIGtleVZhbHVlICs9ICc9JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5qb2luKG9wdGlvbnMuc2VwZXJhdG9yKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUubWF4TGVuZ3RoKSB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCB2YXJpYWJsZS5tYXhMZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBvcHRpb25zLmVuY29kZSh2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hc3NpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSkgdmFsdWUgPSB2YXJpYWJsZS5uYW1lICsgJz0nICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YXJpYWJsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzaWduRW1wdHkpIHZhbHVlICs9ICc9JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4ob3B0aW9ucy5zZXBlcmF0b3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUubWFwKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IHZhbHVlW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS5tYXhMZW5ndGgpIGtleVZhbHVlID0ga2V5VmFsdWUuc3Vic3RyaW5nKDAsIHZhcmlhYmxlLm1heExlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXkgKyAnLCcgKyBvcHRpb25zLmVuY29kZShrZXlWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuam9pbignLCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUubWF4TGVuZ3RoKSB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCB2YXJpYWJsZS5tYXhMZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZW5jb2RlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcsJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB2YWx1ZSA9IHZhcmlhYmxlLm5hbWUgKyAnPScgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFyaWFibGUubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hc3NpZ25FbXB0eSkgdmFsdWUgKz0gJz0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcGFydHMgPSBwYXJ0cy5maWx0ZXIoaXNEZWZpbmVkKTtcbiAgICAgICAgICAgIGlmIChpc0RlZmluZWQocGFydHMpKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IG9wdGlvbnMucHJlZml4O1xuICAgICAgICAgICAgICAgIHN0ciArPSBwYXJ0cy5qb2luKG9wdGlvbnMuc2VwZXJhdG9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyICs9IGdsdWVzW3BpZWNlSW5kZXggKyAxXTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTsgLy9zdHJpbmdpZnlcblxufSAvL1VyaVRlbXBsYXRlIiwiLyoganNoaW50IG5vZGU6dHJ1ZSAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBSb3V0ZXI6IHJlcXVpcmUoJy4vUm91dGVyJyksXG4gICAgVXJpVGVtcGxhdGU6IHJlcXVpcmUoJy4vVXJpVGVtcGxhdGUnKVxufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBUaGUgaGFsQ2xpZW50IHNlcnZpY2UgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSAkaHR0cCBkaXJlY3RseSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIYWxDbGllbnQge1xuICAvKipcbiAgICogQHBhcmFtIHtMb2d9ICAgICAgJGxvZ1xuICAgKiBAcGFyYW0ge0h0dHB9ICAgICAkaHR0cFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBMaW5rSGVhZGVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICRoYWxDb25maWd1cmF0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcigkbG9nLCAkaHR0cCwgTGlua0hlYWRlciwgJGhhbENvbmZpZ3VyYXRpb24pIHtcbiAgICB0aGlzLl8kbG9nID0gJGxvZztcbiAgICB0aGlzLl8kaHR0cCA9ICRodHRwO1xuICAgIHRoaXMuXyRoYWxDb25maWd1cmF0aW9uID0gJGhhbENvbmZpZ3VyYXRpb247XG4gICAgdGhpcy5MaW5rSGVhZGVyID0gTGlua0hlYWRlcjtcbiAgfVxuICAkZ2V0KGhyZWYsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy4kcmVxdWVzdChcIkdFVFwiLCBocmVmLCBvcHRpb25zKTtcbiAgfVxuICAkcG9zdChocmVmLCBvcHRpb25zLCBkYXRhKSB7XG4gICAgcmV0dXJuIHRoaXMuJHJlcXVlc3QoXCJQT1NUXCIsIGhyZWYsIG9wdGlvbnMsIGRhdGEpO1xuICB9XG4gICRwdXQoaHJlZiwgb3B0aW9ucywgZGF0YSkge1xuICAgIHJldHVybiB0aGlzLiRyZXF1ZXN0KFwiUFVUXCIsIGhyZWYsIG9wdGlvbnMsIGRhdGEpO1xuICB9XG4gICRwYXRjaChocmVmLCBvcHRpb25zLCBkYXRhKSB7XG4gICAgcmV0dXJuIHRoaXMuJHJlcXVlc3QoXCJQQVRDSFwiLCBocmVmLCBvcHRpb25zLCBkYXRhKTtcbiAgfVxuICAkZGVsZXRlKGhyZWYsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy4kcmVxdWVzdChcIkRFTEVURVwiLCBocmVmLCBvcHRpb25zKTtcbiAgfVxuICAkbGluayhocmVmLCBvcHRpb25zLCBsaW5rSGVhZGVycykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyB8fCB7fTtcbiAgICBvcHRpb25zLmhlYWRlcnMuTGluayA9IGxpbmtIZWFkZXJzLm1hcChmdW5jdGlvbihsaW5rKSB7XG4gICAgICByZXR1cm4gbGluay50b1N0cmluZygpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLiRyZXF1ZXN0KFwiTElOS1wiLCBocmVmLCBvcHRpb25zKTtcbiAgfVxuICAkdW5saW5rKGhyZWYsIG9wdGlvbnMsIGxpbmtIZWFkZXJzKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIHx8IHt9O1xuICAgIG9wdGlvbnMuaGVhZGVycy5MaW5rID0gbGlua0hlYWRlcnMubWFwKGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgIHJldHVybiBsaW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuJHJlcXVlc3QoXCJVTkxJTktcIiwgaHJlZiwgb3B0aW9ucyk7XG4gIH1cbiAgJHJlcXVlc3QobWV0aG9kLCBocmVmLCBvcHRpb25zLCBkYXRhKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5fJGxvZy5sb2coXG4gICAgICBcIlRoZSBoYWxDbGllbnQgc2VydmljZSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlICRodHRwIGRpcmVjdGx5IGluc3RlYWQuXCJcbiAgICApO1xuICAgIHJldHVybiB0aGlzLl8kaHR0cChcbiAgICAgIGFuZ3VsYXIuZXh0ZW5kKHt9LCBvcHRpb25zLCB7XG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICB1cmw6IHRoaXMuXyRoYWxDb25maWd1cmF0aW9uLnVybFRyYW5zZm9ybWVyKGhyZWYpLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgICB9KVxuICAgICkudGhlbigoeyBkYXRhOiByZXNvdXJjZSB9KSA9PiByZXNvdXJjZSk7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuSGFsQ2xpZW50LiRpbmplY3QgPSBbXCIkbG9nXCIsIFwiJGh0dHBcIiwgXCJMaW5rSGVhZGVyXCIsIFwiJGhhbENvbmZpZ3VyYXRpb25cIl07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgTU9EVUxFX05BTUUgPSBcImFuZ3VsYXItaGFsLmNsaWVudFwiO1xuXG5pbXBvcnQgSGFsQ2xpZW50IGZyb20gXCIuL2hhbC1jbGllbnRcIjtcbmltcG9ydCBMaW5rSGVhZGVyIGZyb20gXCIuL2xpbmstaGVhZGVyXCI7XG5cbi8vIEFkZCBtb2R1bGUgZm9yIGNsaWVudFxuYW5ndWxhclxuICAubW9kdWxlKE1PRFVMRV9OQU1FLCBbXSlcbiAgLnNlcnZpY2UoXCJoYWxDbGllbnRcIiwgSGFsQ2xpZW50KVxuICAuc2VydmljZShcIiRoYWxDbGllbnRcIiwgSGFsQ2xpZW50KVxuICAudmFsdWUoXCJMaW5rSGVhZGVyXCIsIExpbmtIZWFkZXIpO1xuXG5leHBvcnQgZGVmYXVsdCBNT0RVTEVfTkFNRTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIExpbmsgSGVhZGVyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmtIZWFkZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHVyaVJlZmVyZW5jZSBUaGUgTGluayBWYWx1ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gbGlua1BhcmFtcyAgIFRoZSBMaW5rIFBhcmFtc1xuICAgKi9cbiAgY29uc3RydWN0b3IodXJpUmVmZXJlbmNlLCBsaW5rUGFyYW1zKSB7XG4gICAgdGhpcy51cmlSZWZlcmVuY2UgPSB1cmlSZWZlcmVuY2U7XG4gICAgdGhpcy5saW5rUGFyYW1zID0gYW5ndWxhci5leHRlbmQoXG4gICAgICB7XG4gICAgICAgIHJlbDogbnVsbCxcbiAgICAgICAgYW5jaG9yOiBudWxsLFxuICAgICAgICByZXY6IG51bGwsXG4gICAgICAgIGhyZWZsYW5nOiBudWxsLFxuICAgICAgICBtZWRpYTogbnVsbCxcbiAgICAgICAgdGl0bGU6IG51bGwsXG4gICAgICAgIHR5cGU6IG51bGxcbiAgICAgIH0sXG4gICAgICBsaW5rUGFyYW1zXG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgdG9TdHJpbmcoKSB7XG4gICAgdmFyIHJlc3VsdCA9IFwiPFwiICsgdGhpcy51cmlSZWZlcmVuY2UgKyBcIj5cIixcbiAgICAgIHBhcmFtcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgcGFyYW1OYW1lIGluIHRoaXMubGlua1BhcmFtcykge1xuICAgICAgbGV0IHBhcmFtVmFsdWUgPSB0aGlzLmxpbmtQYXJhbXNbcGFyYW1OYW1lXTtcbiAgICAgIGlmIChwYXJhbVZhbHVlKSB7XG4gICAgICAgIHBhcmFtcy5wdXNoKHBhcmFtTmFtZSArICc9XCInICsgcGFyYW1WYWx1ZSArICdcIicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwYXJhbXMubGVuZ3RoIDwgMSkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXN1bHQgPSByZXN1bHQgKyBcIjtcIiArIHBhcmFtcy5qb2luKFwiO1wiKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIEBwYXJhbSB7U3RyaW5nfVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9vcFVybFRyYW5zZm9ybWVyKHVybCkge1xuICByZXR1cm4gdXJsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIYWxDb25maWd1cmF0aW9uUHJvdmlkZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9saW5rc0F0dHJpYnV0ZSA9IFwiX2xpbmtzXCI7XG4gICAgdGhpcy5fZW1iZWRkZWRBdHRyaWJ1dGUgPSBcIl9lbWJlZGRlZFwiO1xuICAgIHRoaXMuX2lnbm9yZUF0dHJpYnV0ZVByZWZpeGVzID0gW1wiX1wiLCBcIiRcIl07XG4gICAgdGhpcy5fc2VsZkxpbmsgPSBcInNlbGZcIjtcbiAgICB0aGlzLl9mb3JjZUpTT05SZXNvdXJjZSA9IGZhbHNlO1xuICAgIHRoaXMuX3VybFRyYW5zZm9ybWVyID0gbm9vcFVybFRyYW5zZm9ybWVyO1xuXG4gICAgdGhpcy4kZ2V0LiRpbmplY3QgPSBbXCIkbG9nXCJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBsaW5rc0F0dHJpYnV0ZVxuICAgKi9cbiAgc2V0TGlua3NBdHRyaWJ1dGUobGlua3NBdHRyaWJ1dGUpIHtcbiAgICB0aGlzLl9saW5rc0F0dHJpYnV0ZSA9IGxpbmtzQXR0cmlidXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBlbWJlZGRlZEF0dHJpYnV0ZVxuICAgKi9cbiAgc2V0RW1iZWRkZWRBdHRyaWJ1dGUoZW1iZWRkZWRBdHRyaWJ1dGUpIHtcbiAgICB0aGlzLl9lbWJlZGRlZEF0dHJpYnV0ZSA9IGVtYmVkZGVkQXR0cmlidXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nW119IGlnbm9yZUF0dHJpYnV0ZVByZWZpeGVzXG4gICAqL1xuICBzZXRJZ25vcmVBdHRyaWJ1dGVQcmVmaXhlcyhpZ25vcmVBdHRyaWJ1dGVQcmVmaXhlcykge1xuICAgIHRoaXMuX2lnbm9yZUF0dHJpYnV0ZVByZWZpeGVzID0gaWdub3JlQXR0cmlidXRlUHJlZml4ZXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlnbm9yZUF0dHJpYnV0ZVByZWZpeFxuICAgKi9cbiAgYWRkSWdub3JlQXR0cmlidXRlUHJlZml4KGlnbm9yZUF0dHJpYnV0ZVByZWZpeCkge1xuICAgIHRoaXMuX2lnbm9yZUF0dHJpYnV0ZVByZWZpeGVzLnB1c2goaWdub3JlQXR0cmlidXRlUHJlZml4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VsZkxpbmtcbiAgICovXG4gIHNldFNlbGZMaW5rKHNlbGZMaW5rKSB7XG4gICAgdGhpcy5fc2VsZkxpbmsgPSBzZWxmTGluaztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlSlNPTlJlc291cmNlXG4gICAqL1xuICBzZXRGb3JjZUpTT05SZXNvdXJjZShmb3JjZUpTT05SZXNvdXJjZSkge1xuICAgIHRoaXMuX2ZvcmNlSlNPTlJlc291cmNlID0gZm9yY2VKU09OUmVzb3VyY2U7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gdXJsVHJhbnNmb3JtZXJcbiAgICogQGRlcHJlY2F0ZWQgJGhhbENvbmZpZ3VyYXRpb25Qcm92aWRlci5zZXRVcmxUcmFuc2Zvcm1lciBpcyBkZXByZWNhdGVkLiBQbGVhc2Ugd3JpdGUgYSBodHRwIGludGVyY2VwdG9yIGluc3RlYWQuXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nL3NlcnZpY2UvJGh0dHAjaW50ZXJjZXB0b3JzXG4gICAqL1xuICBzZXRVcmxUcmFuc2Zvcm1lcih1cmxUcmFuc2Zvcm1lcikge1xuICAgIHRoaXMuX3VybFRyYW5zZm9ybWVyID0gdXJsVHJhbnNmb3JtZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0IENvbmZpZ3VyYXRpb25cbiAgICogQHBhcmFtICB7TG9nfSAkbG9nIGxvZ2dlclxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICAkZ2V0KCRsb2cpIHtcbiAgICBpZiAodGhpcy5fdXJsVHJhbnNmb3JtZXIgIT09IG5vb3BVcmxUcmFuc2Zvcm1lcikge1xuICAgICAgJGxvZy5sb2coXG4gICAgICAgIFwiJGhhbENvbmZpZ3VyYXRpb25Qcm92aWRlci5zZXRVcmxUcmFuc2Zvcm1lciBpcyBkZXByZWNhdGVkLiBQbGVhc2Ugd3JpdGUgYSBodHRwIGludGVyY2VwdG9yIGluc3RlYWQuXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUoe1xuICAgICAgbGlua3NBdHRyaWJ1dGU6IHRoaXMuX2xpbmtzQXR0cmlidXRlLFxuICAgICAgZW1iZWRkZWRBdHRyaWJ1dGU6IHRoaXMuX2VtYmVkZGVkQXR0cmlidXRlLFxuICAgICAgaWdub3JlQXR0cmlidXRlUHJlZml4ZXM6IHRoaXMuX2lnbm9yZUF0dHJpYnV0ZVByZWZpeGVzLFxuICAgICAgc2VsZkxpbms6IHRoaXMuX3NlbGZMaW5rLFxuICAgICAgZm9yY2VKU09OUmVzb3VyY2U6IHRoaXMuX2ZvcmNlSlNPTlJlc291cmNlLFxuICAgICAgdXJsVHJhbnNmb3JtZXI6IHRoaXMuX3VybFRyYW5zZm9ybWVyXG4gICAgfSk7XG4gIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBNT0RVTEVfTkFNRSA9IFwiYW5ndWxhci1oYWwuY29uZmlndXJhdGlvblwiO1xuXG5pbXBvcnQgSGFsQ29uZmlndXJhdGlvblByb3ZpZGVyIGZyb20gXCIuL2hhbC1jb25maWd1cmF0aW9uLnByb3ZpZGVyXCI7XG5cbi8vIEFkZCBtb2R1bGUgZm9yIGNvbmZpZ3VyYXRpb25cbmFuZ3VsYXJcbiAgLm1vZHVsZShNT0RVTEVfTkFNRSwgW10pXG4gIC5wcm92aWRlcihcIiRoYWxDb25maWd1cmF0aW9uXCIsIEhhbENvbmZpZ3VyYXRpb25Qcm92aWRlcik7XG5cbmV4cG9ydCBkZWZhdWx0IE1PRFVMRV9OQU1FO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCBSZXNvdXJjZUh0dHBJbnRlcmNlcHRvckZhY3RvcnkgZnJvbSBcIi4vcmVzb3VyY2UtaHR0cC1pbnRlcmNlcHRvci5mYWN0b3J5XCI7XG5cbi8qKlxuICogQHBhcmFtIHtIdHRwUHJvdmlkZXJ9ICRodHRwUHJvdmlkZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSHR0cEludGVyY2VwdG9yQ29uZmlndXJhdGlvbigkaHR0cFByb3ZpZGVyKSB7XG4gICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goUmVzb3VyY2VIdHRwSW50ZXJjZXB0b3JGYWN0b3J5KTtcbn1cblxuSHR0cEludGVyY2VwdG9yQ29uZmlndXJhdGlvbi4kaW5qZWN0ID0gW1wiJGh0dHBQcm92aWRlclwiXTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBNT0RVTEVfTkFNRSA9IFwiYW5ndWxhci1oYWwuaHR0cC1pbnRlcmNlcHRpb25cIjtcblxuaW1wb3J0IHJlc291cmNlIGZyb20gXCIuLi9yZXNvdXJjZS9pbmRleFwiO1xuaW1wb3J0IGNvbmZpZ3VyYXRpb24gZnJvbSBcIi4uL2NvbmZpZ3VyYXRpb24vaW5kZXhcIjtcblxuaW1wb3J0IEh0dHBJbnRlcmNlcHRvckNvbmZpZ3VyYXRpb24gZnJvbSBcIi4vaHR0cC1pbnRlcmNlcHRpb24uY29uZmlnXCI7XG5cbi8vIEFkZCBtb2R1bGUgZm9yIGh0dHAgaW50ZXJjZXB0aW9uXG5hbmd1bGFyXG4gIC5tb2R1bGUoTU9EVUxFX05BTUUsIFtyZXNvdXJjZSwgY29uZmlndXJhdGlvbl0pXG4gIC5jb25maWcoSHR0cEludGVyY2VwdG9yQ29uZmlndXJhdGlvbik7XG5cbmV4cG9ydCBkZWZhdWx0IE1PRFVMRV9OQU1FO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IENPTlRFTlRfVFlQRSA9IFwiYXBwbGljYXRpb24vaGFsK2pzb25cIjtcblxuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiY29udGVudC10eXBlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJlc291cmNlSHR0cEludGVyY2VwdG9yRmFjdG9yeShcbiAgJGhhbENvbmZpZ3VyYXRpb24sXG4gIFJlc291cmNlXG4pIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1ZXN0OiB0cmFuc2Zvcm1SZXF1ZXN0LFxuICAgIHJlc3BvbnNlOiB0cmFuc2Zvcm1SZXNwb25zZVxuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgSGFsIEpzb24gQXMgYW4gYWNjZXB0ZWQgZm9ybWF0XG4gICAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICAgKi9cbiAgZnVuY3Rpb24gdHJhbnNmb3JtUmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0LmhlYWRlcnMuQWNjZXB0ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXF1ZXN0LmhlYWRlcnMuQWNjZXB0ID0gQ09OVEVOVF9UWVBFO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0LmhlYWRlcnMuQWNjZXB0ID0gW0NPTlRFTlRfVFlQRSwgcmVxdWVzdC5oZWFkZXJzLkFjY2VwdF0uam9pbihcbiAgICAgICAgXCIsIFwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiByZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybSBSZXNwb25zZVxuICAgKlxuICAgKiBAcGFyYW0ge1Jlc3BvbnNlfSByZXNwb25zZVxuICAgKiBAcmV0dXJuIHtSZXNwb25zZXxSZXNvdXJjZX1cbiAgICovXG4gIGZ1bmN0aW9uIHRyYW5zZm9ybVJlc3BvbnNlKHJlc3BvbnNlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChwYXJzZShyZXNwb25zZS5oZWFkZXJzKFwiQ29udGVudC1UeXBlXCIpKS50eXBlID09PSBDT05URU5UX1RZUEUpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVJlc3BvbnNlVG9SZXNvdXJjZShyZXNwb25zZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gVGhlIHBhcnNlIGZ1bmN0aW9uIGNvdWxkIHRocm93IGFuIGVycm9yLCB3ZSBkbyBub3Qgd2FudCB0aGF0LlxuICAgIH1cbiAgICBpZiAocmVzcG9uc2UuY29uZmlnLmZvcmNlSGFsKSB7XG4gICAgICByZXR1cm4gdHJhbnNmb3JtUmVzcG9uc2VUb1Jlc291cmNlKHJlc3BvbnNlKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgKHJlc3BvbnNlLmhlYWRlcnMoXCJDb250ZW50LVR5cGVcIikgPT09IFwiYXBwbGljYXRpb24vanNvblwiIHx8XG4gICAgICAgIHJlc3BvbnNlLmhlYWRlcnMoXCJDb250ZW50LVR5cGVcIikgPT09IG51bGwpICYmXG4gICAgICAkaGFsQ29uZmlndXJhdGlvbi5mb3JjZUpTT05SZXNvdXJjZVxuICAgICkge1xuICAgICAgcmV0dXJuIHRyYW5zZm9ybVJlc3BvbnNlVG9SZXNvdXJjZShyZXNwb25zZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG4gIGZ1bmN0aW9uIHRyYW5zZm9ybVJlc3BvbnNlVG9SZXNvdXJjZShyZXNwb25zZSkge1xuICAgIHJlc3BvbnNlLmRhdGEgPSBuZXcgUmVzb3VyY2UocmVzcG9uc2UuZGF0YSwgcmVzcG9uc2UpO1xuICAgIHJldHVybiByZXNwb25zZTtcbiAgfVxufVxuXG5SZXNvdXJjZUh0dHBJbnRlcmNlcHRvckZhY3RvcnkuJGluamVjdCA9IFtcIiRoYWxDb25maWd1cmF0aW9uXCIsIFwiUmVzb3VyY2VcIl07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgTU9EVUxFX05BTUUgPSBcImFuZ3VsYXItaGFsXCI7XG5cbmltcG9ydCBodHRwSW50ZXJjZXB0aW9uIGZyb20gXCIuL2h0dHAtaW50ZXJjZXB0aW9uL2luZGV4XCI7XG5pbXBvcnQgY2xpZW50IGZyb20gXCIuL2NsaWVudC9pbmRleFwiO1xuXG4vLyBDb21iaW5lIG5lZWRlZCBNb2R1bGVzXG5hbmd1bGFyLm1vZHVsZShNT0RVTEVfTkFNRSwgW2h0dHBJbnRlcmNlcHRpb24sIGNsaWVudF0pO1xuXG5leHBvcnQgZGVmYXVsdCBNT0RVTEVfTkFNRTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgZXh0ZW5kUmVhZE9ubHkgZnJvbSBcIi4uL3V0aWxpdHkvZXh0ZW5kLXJlYWQtb25seVwiO1xuXG4vKipcbiAqIEZhY3RvcnkgZm9yIEhhbFJlc291cmNlQ2xpZW50XG4gKiBAcGFyYW0ge1F9ICAgICAgICAkcVxuICogQHBhcmFtIHtJbmplY3Rvcn0gJGluamVjdG9yIFByZXZlbnQgQ2lyY3VsYXIgRGVwZW5kZW5jeSBieSBpbmplY3RpbmcgJGluamVjdG9yIGluc3RlYWQgb2YgJGh0dHBcbiAqIEBwYXJhbSB7T2JqZWN0fSAgICRoYWxDb25maWd1cmF0aW9uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEhhbFJlc291cmNlQ2xpZW50RmFjdG9yeShcbiAgJHEsXG4gICRpbmplY3RvcixcbiAgJGhhbENvbmZpZ3VyYXRpb25cbikge1xuICByZXR1cm4gSGFsUmVzb3VyY2VDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIGxpbmtzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIGVtYmVkZGVkXG4gICAqL1xuICBmdW5jdGlvbiBIYWxSZXNvdXJjZUNsaWVudChyZXNvdXJjZSwgZW1iZWRkZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAkaHR0cCA9ICRpbmplY3Rvci5nZXQoXCIkaHR0cFwiKTtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgdGhlIGNsaWVudFxuICAgICAqL1xuICAgIChmdW5jdGlvbiBpbml0KCkge1xuICAgICAgZXh0ZW5kUmVhZE9ubHkoc2VsZiwge1xuICAgICAgICAkcmVxdWVzdDogJHJlcXVlc3QsXG4gICAgICAgICRnZXQ6ICRnZXQsXG4gICAgICAgICRnZXRDb2xsZWN0aW9uOiAkZ2V0Q29sbGVjdGlvbixcbiAgICAgICAgJHBvc3Q6ICRwb3N0LFxuICAgICAgICAkcHV0OiAkcHV0LFxuICAgICAgICAkcGF0Y2g6ICRwYXRjaCxcbiAgICAgICAgJGRlbGV0ZTogJGRlbGV0ZSxcbiAgICAgICAgJGRlbDogJGRlbGV0ZSxcbiAgICAgICAgJGxpbms6ICRsaW5rLFxuICAgICAgICAkdW5saW5rOiAkdW5saW5rLFxuICAgICAgICAkZ2V0U2VsZjogJGdldFNlbGYsXG4gICAgICAgICRwb3N0U2VsZjogJHBvc3RTZWxmLFxuICAgICAgICAkcHV0U2VsZjogJHB1dFNlbGYsXG4gICAgICAgICRwYXRjaFNlbGY6ICRwYXRjaFNlbGYsXG4gICAgICAgICRkZWxldGVTZWxmOiAkZGVsZXRlU2VsZixcbiAgICAgICAgJGRlbFNlbGY6ICRkZWxldGVTZWxmLFxuICAgICAgICAkbGlua1NlbGY6ICRsaW5rU2VsZixcbiAgICAgICAgJHVubGlua1NlbGY6ICR1bmxpbmtTZWxmXG4gICAgICB9KTtcbiAgICB9KSgpO1xuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgbWV0aG9kXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHttaXhlZHxudWxsfSAgYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRyZXF1ZXN0KG1ldGhvZCwgcmVsLCB1cmxQYXJhbXMsIGJvZHksIG9wdGlvbnMpIHtcbiAgICAgIHZhciBwcm9taXNlcztcblxuICAgICAgbWV0aG9kID0gbWV0aG9kIHx8IFwiR0VUXCI7XG4gICAgICByZWwgPSByZWwgfHwgJGhhbENvbmZpZ3VyYXRpb24uc2VsZkxpbms7XG4gICAgICB1cmxQYXJhbXMgPSB1cmxQYXJhbXMgfHwge307XG4gICAgICBib2R5ID0gYm9keSB8fCBudWxsO1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIGlmIChtZXRob2QgPT09IFwiR0VUXCIgJiYgcmVsID09PSAkaGFsQ29uZmlndXJhdGlvbi5zZWxmTGluaykge1xuICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShyZXNvdXJjZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXNvdXJjZS4kaGFzRW1iZWRkZWQocmVsKSAmJiBBcnJheS5pc0FycmF5KGVtYmVkZGVkW3JlbF0pKSB7XG4gICAgICAgIHByb21pc2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW1iZWRkZWRbcmVsXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHByb21pc2VzLnB1c2goXG4gICAgICAgICAgICBlbWJlZGRlZFtyZWxdW2ldXG4gICAgICAgICAgICAgIC4kcmVxdWVzdCgpXG4gICAgICAgICAgICAgIC4kcmVxdWVzdChtZXRob2QsIFwic2VsZlwiLCB1cmxQYXJhbXMsIGJvZHksIG9wdGlvbnMpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJHEuYWxsKHByb21pc2VzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc291cmNlLiRoYXNFbWJlZGRlZChyZWwpKSB7XG4gICAgICAgIHJldHVybiBlbWJlZGRlZFtyZWxdXG4gICAgICAgICAgLiRyZXF1ZXN0KClcbiAgICAgICAgICAuJHJlcXVlc3QobWV0aG9kLCBcInNlbGZcIiwgdXJsUGFyYW1zLCBib2R5LCBvcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc291cmNlLiRoYXNMaW5rKHJlbCkpIHtcbiAgICAgICAgdmFyIHVybCA9IHJlc291cmNlLiRocmVmKHJlbCwgdXJsUGFyYW1zKTtcblxuICAgICAgICBhbmd1bGFyLmV4dGVuZChvcHRpb25zLCB7XG4gICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgZGF0YTogYm9keVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1cmwpKSB7XG4gICAgICAgICAgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHVybC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaCgkaHR0cChhbmd1bGFyLmV4dGVuZCh7fSwgb3B0aW9ucywgeyB1cmw6IHVybFtqXSB9KSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBtYXAgdGhlIEhUVFAgcmVzcG9uc2VzIHRvIGFjdHVhbCByZXNvdXJjZXNcbiAgICAgICAgICBjb25zdCByZXNvdXJjZXMgPSBwcm9taXNlcy5tYXAocHJvbWlzZSA9PlxuICAgICAgICAgICAgcHJvbWlzZS50aGVuKCh7IGRhdGE6IHJlc291cmNlIH0pID0+IHJlc291cmNlKVxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuICRxLmFsbChyZXNvdXJjZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBlcmZvcm1IdHRwUmVxdWVzdChyZWwsIHVybFBhcmFtcywgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAkcS5yZWplY3QobmV3IEVycm9yKCdsaW5rIFwiJyArIHJlbCArICdcIiBpcyB1bmRlZmluZWQnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgR0VUIHJlcXVlc3QgYWdhaW5zdCBhIGxpbmsgb3JcbiAgICAgKiBsb2FkIGFuIGVtYmVkZGVkIHJlc291cmNlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gICAgICByZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxudWxsfSB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkZ2V0KHJlbCwgdXJsUGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gJHJlcXVlc3QoXCJHRVRcIiwgcmVsLCB1cmxQYXJhbXMsIHVuZGVmaW5lZCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgR0VUIHJlcXVlc3QgdG8gbG9hZCBhIGNvbGxlY3Rpb24uIElmIG5vIGVtYmVkZGVkIGNvbGxlY3Rpb24gaXMgZm91bmQgaW4gdGhlIHJlc3BvbnNlLFxuICAgICAqIHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gICAgICByZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxudWxsfSB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkZ2V0Q29sbGVjdGlvbihyZWwsIHVybFBhcmFtcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRnZXQocmVsLCB1cmxQYXJhbXMsIG9wdGlvbnMpLnRoZW4ocmVzb3VyY2UgPT4ge1xuICAgICAgICBpZiAoIXJlc291cmNlLiRoYXMocmVsKSkge1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcmVzb3VyY2UuJHJlcXVlc3QoKS4kZ2V0KHJlbCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBIVFRQIFBPU1QgcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHttaXhlZHxudWxsfSAgYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRwb3N0KHJlbCwgdXJsUGFyYW1zLCBib2R5LCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gJHJlcXVlc3QoXCJQT1NUXCIsIHJlbCwgdXJsUGFyYW1zLCBib2R5LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgSFRUUCBQVVQgcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHttaXhlZHxudWxsfSAgYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRwdXQocmVsLCB1cmxQYXJhbXMsIGJvZHksIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiAkcmVxdWVzdChcIlBVVFwiLCByZWwsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgUEFUQ0ggcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHttaXhlZHxudWxsfSAgYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRwYXRjaChyZWwsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KFwiUEFUQ0hcIiwgcmVsLCB1cmxQYXJhbXMsIGJvZHksIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBIVFRQIERFTEVFVCByZXF1ZXN0IGFnYWluc3QgYSBsaW5rXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gICAgICByZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxudWxsfSB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkZGVsZXRlKHJlbCwgdXJsUGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gJHJlcXVlc3QoXCJERUxFVEVcIiwgcmVsLCB1cmxQYXJhbXMsIHVuZGVmaW5lZCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgTElOSyByZXF1ZXN0IGFnYWluc3QgYSBsaW5rXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gIHVybFBhcmFtc1xuICAgICAqIEBwYXJhbSB7TGlua0hlYWRlcltdfSBib2R5XG4gICAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRsaW5rKHJlbCwgdXJsUGFyYW1zLCBsaW5rcywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICBvcHRpb25zLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge307XG4gICAgICBvcHRpb25zLmhlYWRlcnMuTGluayA9IGxpbmtzLm1hcCh0b1N0cmluZ0l0ZW0pO1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KFwiTElOS1wiLCByZWwsIHVybFBhcmFtcywgdW5kZWZpbmVkLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgSFRUUCBVTkxJTksgcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgIHJlbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fG51bGx9ICB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0ge0xpbmtIZWFkZXJbXX0gYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkdW5saW5rKHJlbCwgdXJsUGFyYW1zLCBsaW5rcywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICBvcHRpb25zLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge307XG4gICAgICBvcHRpb25zLmhlYWRlcnMuTGluayA9IGxpbmtzLm1hcCh0b1N0cmluZ0l0ZW0pO1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KFwiVU5MSU5LXCIsIHJlbCwgdXJsUGFyYW1zLCB1bmRlZmluZWQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7bWl4ZWR9IGl0ZW1cbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9TdHJpbmdJdGVtKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgR0VUIHJlcXVlc3Qgb24gc2VsZlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGdldFNlbGYob3B0aW9ucykge1xuICAgICAgY29uc3QgZnVsbE9wdGlvbnMgPSBhbmd1bGFyLmV4dGVuZCh7fSwgb3B0aW9ucywgeyBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgICByZXR1cm4gcGVyZm9ybUh0dHBSZXF1ZXN0KCRoYWxDb25maWd1cmF0aW9uLnNlbGZMaW5rLCB7fSwgZnVsbE9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gYSBQVVQgcmVxdWVzdCBvbiBzZWxmXG4gICAgICogQHBhcmFtIHBheWxvYWRcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRwdXRTZWxmKHBheWxvYWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiAkcHV0KCRoYWxDb25maWd1cmF0aW9uLnNlbGZMaW5rLCBudWxsLCBwYXlsb2FkLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtIGEgUE9TVCByZXF1ZXN0IG9uIHNlbGZcbiAgICAgKiBAcGFyYW0gcGF5bG9hZFxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJHBvc3RTZWxmKHBheWxvYWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiAkcG9zdCgkaGFsQ29uZmlndXJhdGlvbi5zZWxmTGluaywgbnVsbCwgcGF5bG9hZCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBhIFBBVENIIHJlcXVlc3Qgb24gc2VsZlxuICAgICAqIEBwYXJhbSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkcGF0Y2hTZWxmKHBheWxvYWQsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiAkcGF0Y2goJGhhbENvbmZpZ3VyYXRpb24uc2VsZkxpbmssIG51bGwsIHBheWxvYWQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gYSBMSU5LIHJlcXVlc3Qgb24gc2VsZlxuICAgICAqIEBwYXJhbSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkbGlua1NlbGYobGlua3MsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiAkbGluaygkaGFsQ29uZmlndXJhdGlvbi5zZWxmTGluaywgbnVsbCwgbGlua3MsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gYW4gVU5MSU5LIHJlcXVlc3Qgb24gc2VsZlxuICAgICAqIEBwYXJhbSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkdW5saW5rU2VsZihsaW5rcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICR1bmxpbmsoJGhhbENvbmZpZ3VyYXRpb24uc2VsZkxpbmssIG51bGwsIGxpbmtzLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtIGEgREVMRVRFIHJlcXVlc3Qgb24gc2VsZlxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGRlbGV0ZVNlbGYob3B0aW9ucykge1xuICAgICAgcmV0dXJuICRkZWxldGUoJGhhbENvbmZpZ3VyYXRpb24uc2VsZkxpbmssIG51bGwsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBlZm9ybSBodHRwIHJlcXVlc3Qgb24gcmVzb3VyY2UncyByZWxcbiAgICAgKiBAcGFyYW0gcmVsIGxpbmsgbmFtZVxuICAgICAqIEBwYXJhbSB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHBlcmZvcm1IdHRwUmVxdWVzdChyZWwsIHVybFBhcmFtcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRodHRwKFxuICAgICAgICBhbmd1bGFyLmV4dGVuZCh7fSwgb3B0aW9ucywge1xuICAgICAgICAgIHVybDogcmVzb3VyY2UuJGhyZWYocmVsLCB1cmxQYXJhbXMpXG4gICAgICAgIH0pXG4gICAgICApLnRoZW4oKHsgZGF0YTogcmVzb3VyY2UgfSkgPT4gcmVzb3VyY2UpO1xuICAgIH1cbiAgfVxufVxuXG5IYWxSZXNvdXJjZUNsaWVudEZhY3RvcnkuJGluamVjdCA9IFtcIiRxXCIsIFwiJGluamVjdG9yXCIsIFwiJGhhbENvbmZpZ3VyYXRpb25cIl07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgTU9EVUxFX05BTUUgPSBcImFuZ3VsYXItaGFsLnJlc291cmNlXCI7XG5cbmltcG9ydCBjb25maWd1cmF0aW9uIGZyb20gXCIuLi9jb25maWd1cmF0aW9uL2luZGV4XCI7XG5cbmltcG9ydCBSZXNvdXJjZUZhY3RvcnkgZnJvbSBcIi4vcmVzb3VyY2UuZmFjdG9yeVwiO1xuaW1wb3J0IEhhbFJlc291cmNlQ2xpZW50RmFjdG9yeSBmcm9tIFwiLi9oYWwtcmVzb3VyY2UtY2xpZW50LmZhY3RvcnlcIjtcblxuLy8gQWRkIG1vZHVsZSBmb3IgcmVzb3VyY2VcbmFuZ3VsYXJcbiAgLm1vZHVsZShNT0RVTEVfTkFNRSwgW2NvbmZpZ3VyYXRpb25dKVxuICAuZmFjdG9yeShcIlJlc291cmNlXCIsIFJlc291cmNlRmFjdG9yeSlcbiAgLmZhY3RvcnkoXCJIYWxSZXNvdXJjZUNsaWVudFwiLCBIYWxSZXNvdXJjZUNsaWVudEZhY3RvcnkpO1xuXG5leHBvcnQgZGVmYXVsdCBNT0RVTEVfTkFNRTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQgZXh0ZW5kUmVhZE9ubHkgZnJvbSBcIi4uL3V0aWxpdHkvZXh0ZW5kLXJlYWQtb25seVwiO1xuaW1wb3J0IGRlZmluZVJlYWRPbmx5IGZyb20gXCIuLi91dGlsaXR5L2RlZmluZS1yZWFkLW9ubHlcIjtcbmltcG9ydCBnZW5lcmF0ZVVybCBmcm9tIFwiLi4vdXRpbGl0eS9nZW5lcmF0ZS11cmxcIjtcbmltcG9ydCBub3JtYWxpemVMaW5rIGZyb20gXCIuLi91dGlsaXR5L25vcm1hbGl6ZS1saW5rXCI7XG5cbi8qKlxuICogRmFjdG9yeSBmb3IgUmVzb3VyY2VcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBIYWxSZXNvdXJjZUNsaWVudFxuICogQHBhcmFtIHtPYmplY3R9ICAgJGhhbENvbmZpZ3VyYXRpb25cbiAqIEBwYXJhbSB7TG9nfSAgICAgICRsb2dcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUmVzb3VyY2VGYWN0b3J5KFxuICBIYWxSZXNvdXJjZUNsaWVudCxcbiAgJGhhbENvbmZpZ3VyYXRpb24sXG4gICRsb2dcbikge1xuICByZXR1cm4gUmVzb3VyY2U7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZVxuICAgKi9cbiAgZnVuY3Rpb24gUmVzb3VyY2UoZGF0YSwgcmVzcG9uc2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBsaW5rcyA9IHt9LFxuICAgICAgZW1iZWRkZWQgPSB7fSxcbiAgICAgIGNsaWVudDtcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgdGhlIFJlc291cmNlXG4gICAgICovXG4gICAgKGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICBpZiAodHlwZW9mIGRhdGEgIT09IFwib2JqZWN0XCIgfHwgZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICBpbml0aWFsaXplRGF0YSgpO1xuICAgICAgaW5pdGlhbGl6ZUVtYmVkZGVkKCk7XG4gICAgICBpbml0aWFsaXplTGlua3MoKTtcbiAgICAgIGluaXRpdGFsaXplQ2xpZW50KCk7XG5cbiAgICAgIGV4dGVuZFJlYWRPbmx5KHNlbGYsIHtcbiAgICAgICAgJGhhc0xpbms6ICRoYXNMaW5rLFxuICAgICAgICAkaGFzRW1iZWRkZWQ6ICRoYXNFbWJlZGRlZCxcbiAgICAgICAgJGhhczogJGhhcyxcbiAgICAgICAgJGhyZWY6ICRocmVmLFxuICAgICAgICAkbWV0YTogJG1ldGEsXG4gICAgICAgICRsaW5rOiAkbGluayxcbiAgICAgICAgJHJlcXVlc3Q6ICRyZXF1ZXN0LFxuICAgICAgICAkcmVzcG9uc2U6ICRyZXNwb25zZVxuICAgICAgfSk7XG4gICAgfSkoKTtcblxuICAgIC8qKlxuICAgICAqIEFkZCBhbGwgZGF0YSBmcm9tIGRhdGEgdG8gaXRzZWxmXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZURhdGEoKSB7XG4gICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gZGF0YSkge1xuICAgICAgICBpZiAoIWRhdGEuaGFzT3duUHJvcGVydHkocHJvcGVydHlOYW1lKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc01ldGFQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZGVmaW5lUmVhZE9ubHkoc2VsZiwgcHJvcGVydHlOYW1lLCBkYXRhW3Byb3BlcnR5TmFtZV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZSBhbGwgTGlua3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbml0aWFsaXplTGlua3MoKSB7XG4gICAgICBpZiAodHlwZW9mIGRhdGFbJGhhbENvbmZpZ3VyYXRpb24ubGlua3NBdHRyaWJ1dGVdICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgT2JqZWN0LmtleXMoZGF0YVskaGFsQ29uZmlndXJhdGlvbi5saW5rc0F0dHJpYnV0ZV0pLmZvckVhY2goZnVuY3Rpb24oXG4gICAgICAgIHJlbFxuICAgICAgKSB7XG4gICAgICAgIHZhciBsaW5rID0gZGF0YVskaGFsQ29uZmlndXJhdGlvbi5saW5rc0F0dHJpYnV0ZV1bcmVsXTtcbiAgICAgICAgbGlua3NbcmVsXSA9IG5vcm1hbGl6ZUxpbmsocmVzcG9uc2UuY29uZmlnLnVybCwgbGluayk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemUgRW1iZWRkZWQgQ29udGVudHNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbml0aWFsaXplRW1iZWRkZWQoKSB7XG4gICAgICBpZiAodHlwZW9mIGRhdGFbJGhhbENvbmZpZ3VyYXRpb24uZW1iZWRkZWRBdHRyaWJ1dGVdICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgT2JqZWN0LmtleXMoZGF0YVskaGFsQ29uZmlndXJhdGlvbi5lbWJlZGRlZEF0dHJpYnV0ZV0pLmZvckVhY2goZnVuY3Rpb24oXG4gICAgICAgIHJlbFxuICAgICAgKSB7XG4gICAgICAgIGVtYmVkUmVzb3VyY2UocmVsLCBkYXRhWyRoYWxDb25maWd1cmF0aW9uLmVtYmVkZGVkQXR0cmlidXRlXVtyZWxdKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgdGhlIEhUVFAgQ0xJRU5UXG4gICAgICovXG4gICAgZnVuY3Rpb24gaW5pdGl0YWxpemVDbGllbnQoKSB7XG4gICAgICBjbGllbnQgPSBuZXcgSGFsUmVzb3VyY2VDbGllbnQoc2VsZiwgZW1iZWRkZWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVtYmVkIGEgcmVzb3VyY2UocylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgICAgICAgICByZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxPYmplY3RbXX0gcmVzb3VyY2VzXG4gICAgICovXG4gICAgZnVuY3Rpb24gZW1iZWRSZXNvdXJjZShyZWwsIHJlc291cmNlcykge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzb3VyY2VzKSkge1xuICAgICAgICBlbWJlZGRlZFtyZWxdID0gW107XG4gICAgICAgIHJlc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgICAgICAgZW1iZWRkZWRbcmVsXS5wdXNoKG5ldyBSZXNvdXJjZShyZXNvdXJjZSwgcmVzcG9uc2UpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGVtYmVkZGVkW3JlbF0gPSBuZXcgUmVzb3VyY2UocmVzb3VyY2VzLCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIGlmIGEgcHJvcGVydHkgbmFtZSBpcyBhIG1ldGEgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlOYW1lXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc01ldGFQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIGZvciAoXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgaSA8ICRoYWxDb25maWd1cmF0aW9uLmlnbm9yZUF0dHJpYnV0ZVByZWZpeGVzLmxlbmd0aDtcbiAgICAgICAgaSsrXG4gICAgICApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHByb3BlcnR5TmFtZS5zdWJzdHIoMCwgMSkgPT09XG4gICAgICAgICAgJGhhbENvbmZpZ3VyYXRpb24uaWdub3JlQXR0cmlidXRlUHJlZml4ZXNbaV1cbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHByb3BlcnR5TmFtZSA9PT0gJGhhbENvbmZpZ3VyYXRpb24ubGlua3NBdHRyaWJ1dGUgfHxcbiAgICAgICAgICBwcm9wZXJ0eU5hbWUgPT09ICRoYWxDb25maWd1cmF0aW9uLmVtYmVkZGVkQXR0cmlidXRlXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGhhc0xpbmsocmVsKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGxpbmtzW3JlbF0gIT09IFwidW5kZWZpbmVkXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGhhc0VtYmVkZGVkKHJlbCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBlbWJlZGRlZFtyZWxdICE9PSBcInVuZGVmaW5lZFwiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByZWxcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRoYXMocmVsKSB7XG4gICAgICByZXR1cm4gJGhhc0xpbmsocmVsKSB8fCAkaGFzRW1iZWRkZWQocmVsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGhyZWYgb2YgYSBMaW5rXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnNcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGhyZWYocmVsLCBwYXJhbWV0ZXJzKSB7XG4gICAgICB2YXIgbGluayA9ICRsaW5rKHJlbCksXG4gICAgICAgIGhyZWYgPSBsaW5rLmhyZWY7XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGxpbmspKSB7XG4gICAgICAgIGhyZWYgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5rLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHN1YkxpbmsgPSBsaW5rW2ldLFxuICAgICAgICAgICAgc3ViSHJlZiA9IHN1YkxpbmsuaHJlZjtcbiAgICAgICAgICBpZiAodHlwZW9mIHN1YkxpbmsudGVtcGxhdGVkICE9PSBcInVuZGVmaW5lZFwiICYmIHN1YkxpbmsudGVtcGxhdGVkKSB7XG4gICAgICAgICAgICBzdWJIcmVmID0gZ2VuZXJhdGVVcmwoc3ViTGluay5ocmVmLCBwYXJhbWV0ZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3ViSHJlZiA9ICRoYWxDb25maWd1cmF0aW9uLnVybFRyYW5zZm9ybWVyKHN1YkhyZWYpO1xuICAgICAgICAgIGhyZWYucHVzaChzdWJIcmVmKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaW5rLnRlbXBsYXRlZCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBsaW5rLnRlbXBsYXRlZCkge1xuICAgICAgICAgIGhyZWYgPSBnZW5lcmF0ZVVybChsaW5rLmhyZWYsIHBhcmFtZXRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaHJlZiA9ICRoYWxDb25maWd1cmF0aW9uLnVybFRyYW5zZm9ybWVyKGhyZWYpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaHJlZjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBsaW5rXG4gICAgICpcbiAgICAgKiAhISBUbyBnZXQgYSBocmVmLCB1c2UgJGhyZWYgaW5zdGVhZCAhIVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkbGluayhyZWwpIHtcbiAgICAgIGlmICghJGhhc0xpbmsocmVsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2xpbmsgXCInICsgcmVsICsgJ1wiIGlzIHVuZGVmaW5lZCcpO1xuICAgICAgfVxuICAgICAgdmFyIGxpbmsgPSBsaW5rc1tyZWxdO1xuXG4gICAgICBpZiAodHlwZW9mIGxpbmsuZGVwcmVjYXRpb24gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgJGxvZy53YXJuKFxuICAgICAgICAgIGBUaGUgbGluayBcIiR7cmVsfVwiIGlzIG1hcmtlZCBhcyBkZXByZWNhdGVkIHdpdGggdGhlIHZhbHVlIFwiJHtsaW5rLmRlcHJlY2F0aW9ufVwiLmBcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGxpbms7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IG1ldGEgcHJvcGVydGllc1xuICAgICAqXG4gICAgICogISEgVG8gZ2V0IGEgaHJlZiwgdXNlICRocmVmIGluc3RlYWQgISFcbiAgICAgKiAhISBUbyBnZXQgYSBsaW5rLCB1c2UgJGxpbmsgaW5zdGVhZCAhIVxuICAgICAqICEhIFRvIGdldCBhbiBlbWJlZGRlZCByZXNvdXJjZSwgdXNlICRyZXF1ZXN0KCkuJGdldChyZWwpIGluc3RlYWQgISFcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByZWxcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJG1ldGEobmFtZSkge1xuICAgICAgZm9yIChcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBpIDwgJGhhbENvbmZpZ3VyYXRpb24uaWdub3JlQXR0cmlidXRlUHJlZml4ZXMubGVuZ3RoO1xuICAgICAgICBpKytcbiAgICAgICkge1xuICAgICAgICB2YXIgZnVsbE5hbWUgPSAkaGFsQ29uZmlndXJhdGlvbi5pZ25vcmVBdHRyaWJ1dGVQcmVmaXhlc1tpXSArIG5hbWU7XG4gICAgICAgIHJldHVybiBkYXRhW2Z1bGxOYW1lXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIE9yaWdpbmFsIFJlc3BvbnNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3QpfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRyZXNwb25zZSgpIHtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGNsaWVudCB0byBwZXJmb3JtIHJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtIYWxSZXNvdXJjZUNsaWVudCl9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJHJlcXVlc3QoKSB7XG4gICAgICByZXR1cm4gY2xpZW50O1xuICAgIH1cbiAgfVxufVxuUmVzb3VyY2VGYWN0b3J5LiRpbmplY3QgPSBbXCJIYWxSZXNvdXJjZUNsaWVudFwiLCBcIiRoYWxDb25maWd1cmF0aW9uXCIsIFwiJGxvZ1wiXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBEZWZpbmUgcmVhZC1vbmx5IHByb3BlcnR5IGluIHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHttaXhlZH0gIHZhbHVlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlZmluZVJlYWRPbmx5KHRhcmdldCwga2V5LCB2YWx1ZSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHtcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgdmFsdWU6IHZhbHVlLFxuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgfSk7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBFeHRlbmQgcHJvcGVydGllcyBmcm9tIGNvcHkgcmVhZC1vbmx5IHRvIHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IGNvcHlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZXh0ZW5kUmVhZE9ubHkodGFyZ2V0LCBjb3B5KSB7XG4gIGZvciAodmFyIGtleSBpbiBjb3B5KSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCB7XG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogY29weVtrZXldXG4gICAgfSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHJmYzY1NzAgZnJvbSAncmZjNjU3MC9zcmMvbWFpbic7XG5cbi8qKlxuICogR2VuZXJhdGUgdXJsIGZyb20gdGVtcGxhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHRlbXBsYXRlXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBhcmFtZXRlcnNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2VuZXJhdGVVcmwodGVtcGxhdGUsIHBhcmFtZXRlcnMpIHtcbiAgcmV0dXJuIG5ldyByZmM2NTcwLlVyaVRlbXBsYXRlKHRlbXBsYXRlKS5zdHJpbmdpZnkocGFyYW1ldGVycyk7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHJlc29sdmVVcmwgZnJvbSBcIi4uL3V0aWxpdHkvcmVzb2x2ZS11cmxcIjtcblxuLyoqXG4gKiBAcGFyYW0ge1N0cmluZ30gYmFzZVVybFxuICogQHBhcmFtIHttaXhlZH0gIGxpbmtcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbm9ybWFsaXplTGluayhiYXNlVXJsLCBsaW5rKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGxpbmspKSB7XG4gICAgcmV0dXJuIGxpbmsubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVMaW5rKGJhc2VVcmwsIGl0ZW0pO1xuICAgIH0pO1xuICB9XG4gIGlmICh0eXBlb2YgbGluayA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiByZXNvbHZlVXJsKGJhc2VVcmwsIGxpbmspXG4gICAgfTtcbiAgfVxuICBpZiAodHlwZW9mIGxpbmsuaHJlZiA9PT0gXCJzdHJpbmdcIikge1xuICAgIGxpbmsuaHJlZiA9IHJlc29sdmVVcmwoYmFzZVVybCwgbGluay5ocmVmKTtcbiAgICByZXR1cm4gbGluaztcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShsaW5rLmhyZWYpKSB7XG4gICAgcmV0dXJuIGxpbmsuaHJlZi5tYXAoZnVuY3Rpb24oaHJlZikge1xuICAgICAgdmFyIG5ld0xpbmsgPSBhbmd1bGFyLmV4dGVuZCh7fSwgbGluaywge1xuICAgICAgICBocmVmOiBocmVmXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBub3JtYWxpemVMaW5rKGJhc2VVcmwsIG5ld0xpbmspO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiB7XG4gICAgaHJlZjogYmFzZVVybFxuICB9O1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogUmVzb2x2ZSB3aG9sZSBVUkxcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYmFzZVVybFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVzb2x2ZVVybChiYXNlVXJsLCBwYXRoKSB7XG4gIHZhciByZXN1bHRIcmVmID0gXCJcIixcbiAgICByZUZ1bGxVcmwgPSAvXigoPzpcXHcrOik/KSgoPzpcXC9cXC8pPykoW14vXSopKCg/OlxcLy4qKT8pJC8sXG4gICAgYmFzZUhyZWZNYXRjaCA9IHJlRnVsbFVybC5leGVjKGJhc2VVcmwpLFxuICAgIGhyZWZNYXRjaCA9IHJlRnVsbFVybC5leGVjKHBhdGgpO1xuXG4gIGZvciAodmFyIHBhcnRJbmRleCA9IDE7IHBhcnRJbmRleCA8IDU7IHBhcnRJbmRleCsrKSB7XG4gICAgaWYgKGhyZWZNYXRjaFtwYXJ0SW5kZXhdKSB7XG4gICAgICByZXN1bHRIcmVmICs9IGhyZWZNYXRjaFtwYXJ0SW5kZXhdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHRIcmVmICs9IGJhc2VIcmVmTWF0Y2hbcGFydEluZGV4XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0SHJlZjtcbn1cbiJdfQ==
