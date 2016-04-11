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

if(typeof exports !== 'undefined') {
  exports.format = format
  exports.parse = parse
} else {
  window.contentType = {
    format: format,
    parse: parse,
  };
}

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
'use strict';

/**
 * @param {Log}      $log
 * @param {Http}     $http
 * @param {Function} LinkHeader
 * @param {Object}   $halConfiguration
 * @deprecated The halClient service is deprecated. Please use $http directly instead.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HalClientService;
function HalClientService($log, $http, LinkHeader, $halConfiguration) {
  var self = this;

  /**
   * @return Initialize halClient
   */
  (function init() {
    angular.extend(self, {
      $get: $get,
      $post: $post,
      $put: $put,
      $patch: $patch,
      $delete: $delete,
      $del: $delete,
      $link: $link,
      $unlink: $unlink,
      LinkHeader: LinkHeader
    });
  })();

  /* @ngNoInject */
  function $get(href, options) {
    return $request('GET', href, options);
  }

  function $post(href, options, data) {
    return $request('POST', href, options, data);
  }

  function $put(href, options, data) {
    return $request('PUT', href, options, data);
  }

  function $patch(href, options, data) {
    return $request('PATCH', href, options, data);
  }

  function $delete(href, options) {
    return $request('DELETE', href, options);
  }

  function $link(href, options, linkHeaders) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Link = linkHeaders.map(function (link) {
      return link.toString();
    });
    return $request('LINK', href, options);
  }

  function $unlink(href, options, linkHeaders) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Link = linkHeaders.map(function (link) {
      return link.toString();
    });
    return $request('UNLINK', href, options);
  }

  function $request(method, href, options, data) {
    options = options || {};
    $log.log('The halClient service is deprecated. Please use $http directly instead.');
    return $http(angular.extend({}, options, {
      method: method,
      url: $halConfiguration.urlTransformer(href),
      data: data
    }));
  }
}

// Inject Dependencies
HalClientService.$inject = ['$log', '$http', 'LinkHeader', '$halConfiguration'];

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utility = require('../utility');

var _utility2 = _interopRequireDefault(_utility);

var _halClient = require('./hal-client.service');

var _halClient2 = _interopRequireDefault(_halClient);

var _linkHeader = require('./link-header.factory');

var _linkHeader2 = _interopRequireDefault(_linkHeader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal.client';

// Add module for client
angular.module(MODULE_NAME, [_utility2.default]).service('halClient', _halClient2.default).service('$halClient', _halClient2.default).factory('LinkHeader', _linkHeader2.default);

exports.default = MODULE_NAME;

},{"../utility":22,"./hal-client.service":5,"./link-header.factory":7}],7:[function(require,module,exports){
'use strict';

/**
 * Factory for LinkHeader
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = LinkHeaderFactory;
function LinkHeaderFactory() {
  return LinkHeader;

  /**
   * Link Header
   *
   * @param {String} uriReference The Link Value
   * @param {Object} linkParams   The Link Params
   * @constructor
   */
  function LinkHeader(uriReference, linkParams) {
    var self = this;

    /**
     * Initialize the LinkHeader
     *
     * @return void
     */
    (function init() {
      angular.extend(self, {
        uriReference: uriReference,
        linkParams: angular.extend({
          rel: null,
          anchor: null,
          rev: null,
          hreflang: null,
          media: null,
          title: null,
          type: null
        }, linkParams)
      });
    })();

    /**
     * Convert LinkHeader to String
     *
     * @return {String}
     */
    self.toString = function toString() {
      var result = '<' + self.uriReference + '>',
          params = [];

      for (var paramName in self.linkParams) {
        var paramValue = self.linkParams[paramName];
        if (paramValue) {
          params.push(paramName + '="' + paramValue + '"');
        }
      }

      if (params.length < 1) {
        return result;
      }

      result = result + ';' + params.join(';');

      return result;
    };

    return this;
  }
}

// Inject Dependencies
LinkHeaderFactory.$inject = [];

},{}],8:[function(require,module,exports){
'use strict';

/**
 * @return {Object}
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HalConfigurationProvider;
function HalConfigurationProvider() {
  var linksAttribute = '_links',
      embeddedAttribute = '_embedded',
      ignoreAttributePrefixes = ['_', '$'],
      selfLink = 'self',
      forceJSONResource = false,
      urlTransformer = noopUrlTransformer;

  // Inject Dependencies
  $get.$inject = ['$log'];

  return {
    setLinksAttribute: setLinksAttribute,
    setEmbeddedAttribute: setEmbeddedAttribute,
    setIgnoreAttributePrefixes: setIgnoreAttributePrefixes,
    addIgnoreAttributePrefix: addIgnoreAttributePrefix,
    setSelfLink: setSelfLink,
    setForceJSONResource: setForceJSONResource,
    setUrlTransformer: setUrlTransformer,
    $get: $get
  };

  /**
   * @param {String} newLinksAttribute
   */
  function setLinksAttribute(newLinksAttribute) {
    linksAttribute = newLinksAttribute;
  }

  /**
   * @param {String} newEmbeddedAttribute
   */
  function setEmbeddedAttribute(newEmbeddedAttribute) {
    embeddedAttribute = newEmbeddedAttribute;
  }

  /**
   * @param {String[]} newIgnoreAttributePrefixes
   */
  function setIgnoreAttributePrefixes(newIgnoreAttributePrefixes) {
    ignoreAttributePrefixes = newIgnoreAttributePrefixes;
  }

  /**
   * @param {String} ignoreAttributePrefix
   */
  function addIgnoreAttributePrefix(ignoreAttributePrefix) {
    ignoreAttributePrefixes.push(ignoreAttributePrefix);
  }

  /**
   * @param {String} newSelfLink
   */
  function setSelfLink(newSelfLink) {
    selfLink = newSelfLink;
  }

  /**
   * @param {Boolean} newForceJSONResource
   */
  function setForceJSONResource(newForceJSONResource) {
    forceJSONResource = newForceJSONResource;
  }

  /**
   * @param {Function}
   * @deprecated $halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.
   * @see https://docs.angularjs.org/api/ng/service/$http#interceptors
   */
  function setUrlTransformer(newUrlTransformer) {
    urlTransformer = newUrlTransformer;
  }

  /**
   * @param {String}
   * @return {String}
   */
  function noopUrlTransformer(url) {
    return url;
  }

  /**
   * @return {Object}
   */
  function $get($log) {
    if (urlTransformer !== noopUrlTransformer) {
      $log.log('$halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.');
    }

    return Object.freeze({
      linksAttribute: linksAttribute,
      embeddedAttribute: embeddedAttribute,
      ignoreAttributePrefixes: ignoreAttributePrefixes,
      selfLink: selfLink,
      forceJSONResource: forceJSONResource,
      urlTransformer: urlTransformer
    });
  }
}

// Inject Dependencies
HalConfigurationProvider.$inject = [];

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _halConfiguration = require('./hal-configuration.provider');

var _halConfiguration2 = _interopRequireDefault(_halConfiguration);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal.configuration';

// Add module for configuration
angular.module(MODULE_NAME, []).provider('$halConfiguration', _halConfiguration2.default);

exports.default = MODULE_NAME;

},{"./hal-configuration.provider":8}],10:[function(require,module,exports){
'use strict';

/**
 * @param {HttpProvider} $httpProvider
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HttpInterceptorConfiguration;
function HttpInterceptorConfiguration($httpProvider) {
  $httpProvider.interceptors.push('ResourceHttpInterceptor');
}

// Inject Dependencies
HttpInterceptorConfiguration.$inject = ['$httpProvider'];

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _resource = require('../resource');

var _resource2 = _interopRequireDefault(_resource);

var _configuration = require('../configuration');

var _configuration2 = _interopRequireDefault(_configuration);

var _resourceHttpInterceptor = require('./resource-http-interceptor.factory');

var _resourceHttpInterceptor2 = _interopRequireDefault(_resourceHttpInterceptor);

var _httpInterception = require('./http-interception.config');

var _httpInterception2 = _interopRequireDefault(_httpInterception);

var _responseTransformer = require('./response-transformer.service');

var _responseTransformer2 = _interopRequireDefault(_responseTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal.http-interception';

// Add module for http interception
angular.module(MODULE_NAME, [_resource2.default, _configuration2.default]).config(_httpInterception2.default).factory('ResourceHttpInterceptor', _resourceHttpInterceptor2.default).factory('$transformResponseToResource', _responseTransformer2.default);

exports.default = MODULE_NAME;

},{"../configuration":9,"../resource":16,"./http-interception.config":10,"./resource-http-interceptor.factory":12,"./response-transformer.service":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ResourceHttpInterceptorFactory;

var _contentType = require('content-type');

/**
 * @param {Function} $transformResponseToResource
 * @return {Object}
 */
function ResourceHttpInterceptorFactory($transformResponseToResource, $halConfiguration) {
  var CONTENT_TYPE = 'application/hal+json';

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
    if (typeof request.headers.Accept === 'undefined') {
      request.headers.Accept = CONTENT_TYPE;
    } else {
      request.headers.Accept = [CONTENT_TYPE, request.headers.Accept].join(', ');
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
      if ((0, _contentType.parse)(response.headers('Content-Type')).type === CONTENT_TYPE) {
        return $transformResponseToResource(response);
      }
    } catch (e) {
      // The parse function could throw an error, we do not want that.
    }
    if (response.config.forceHal) {
      return $transformResponseToResource(response);
    }
    if ((response.headers('Content-Type') === 'application/json' || response.headers('Content-Type') === null) && $halConfiguration.forceJSONResource) {
      return $transformResponseToResource(response);
    }

    return response;
  }
}

// Inject Dependencies
ResourceHttpInterceptorFactory.$inject = ['$transformResponseToResource', '$halConfiguration'];

},{"content-type":1}],13:[function(require,module,exports){
'use strict';

/**
 * @param {Function} Resource
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ResponseToResourceTransformerFactory;
function ResponseToResourceTransformerFactory(Resource) {
  return transform;

  /**
   * @param {Response}
   * @return {Resource}
   */
  function transform(response) {
    return new Resource(response.data, response);
  }
}

// Inject Dependencies
ResponseToResourceTransformerFactory.$inject = ['Resource'];

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _urlGenerator = require('./url-generator');

var _urlGenerator2 = _interopRequireDefault(_urlGenerator);

var _httpInterception = require('./http-interception');

var _httpInterception2 = _interopRequireDefault(_httpInterception);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal';

// Combine needed Modules
angular.module(MODULE_NAME, [_urlGenerator2.default, _httpInterception2.default, _client2.default, 'ng']);

exports.default = MODULE_NAME;

},{"./client":6,"./http-interception":11,"./url-generator":18}],15:[function(require,module,exports){
'use strict';

/**
 * Factory for HalResourceClient
 * @param {Q}        $q
 * @param {Function} $extendReadOnly
 * @param {Injector} $injector Prevent Circular Dependency by injecting $injector instead of $http
 * @param {Object}   $halConfiguration
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HalResourceClientFactory;
function HalResourceClientFactory($q, $extendReadOnly, $injector, $halConfiguration) {
  return HalResourceClient;

  /**
   * @param {Resource} resource
   * @param {Object}   links
   * @param {Object}   embedded
   */
  function HalResourceClient(resource, embedded) {
    var self = this,
        $http = $injector.get('$http');

    /**
     * Initialize the client
     */
    (function init() {
      $extendReadOnly(self, {
        $request: $request,
        $get: $get,
        $post: $post,
        $put: $put,
        $patch: $patch,
        $delete: $delete,
        $del: $delete,
        $link: $link,
        $unlink: $unlink
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

      method = method || 'GET';
      rel = rel || $halConfiguration.selfLink;
      urlParams = urlParams || {};
      body = body || null;
      options = options || {};

      if (method === 'GET' && rel === $halConfiguration.selfLink) {
        return $q.resolve(resource);
      }

      if (resource.$hasEmbedded(rel) && Array.isArray(embedded[rel])) {
        promises = [];
        for (var i = 0; i < embedded[rel].length; i++) {
          promises.push(embedded[rel][i].$request().$request(method, 'self', urlParams, body, options));
        }
        return $q.all(promises);
      }

      if (resource.$hasEmbedded(rel)) {
        return embedded[rel].$request().$request(method, 'self', urlParams, body, options);
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
          return $q.all(promises);
        }

        return $http(angular.extend({}, options, {
          url: resource.$href(rel, urlParams)
        }));
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
      return $request('GET', rel, urlParams, undefined, options);
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
      return $request('POST', rel, urlParams, body, options);
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
      return $request('PUT', rel, urlParams, body, options);
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
      return $request('PATCH', rel, urlParams, body, options);
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
      return $request('DELETE', rel, urlParams, undefined, options);
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
      return $request('LINK', rel, urlParams, undefined, options);
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
      return $request('UNLINK', rel, urlParams, undefined, options);
    }

    /**
     * @param {mixed} item
     * @return {String}
     */
    function toStringItem(item) {
      return item.toString();
    }
  }
}

// Inject Dependencies
HalResourceClientFactory.$inject = ['$q', '$extendReadOnly', '$injector', '$halConfiguration'];

},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utility = require('../utility');

var _utility2 = _interopRequireDefault(_utility);

var _configuration = require('../configuration');

var _configuration2 = _interopRequireDefault(_configuration);

var _resource = require('./resource.factory');

var _resource2 = _interopRequireDefault(_resource);

var _halResourceClient = require('./hal-resource-client.factory');

var _halResourceClient2 = _interopRequireDefault(_halResourceClient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal.resource';

// Add module for resource
angular.module(MODULE_NAME, [_utility2.default, _configuration2.default]).factory('Resource', _resource2.default).factory('HalResourceClient', _halResourceClient2.default);

exports.default = MODULE_NAME;

},{"../configuration":9,"../utility":22,"./hal-resource-client.factory":15,"./resource.factory":17}],17:[function(require,module,exports){
'use strict';

// Inject Dependencies

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = ResourceFactory;
ResourceFactory.$inject = ['HalResourceClient', '$generateUrl', '$extendReadOnly', '$defineReadOnly', '$normalizeLink', '$halConfiguration'];

/**
 * Factory for Resource
 *
 * @param {Function} HalResourceClient
 * @param {Function} $generateUrl
 * @param {Function} $extendReadOnly
 * @param {Function} $defineReadOnly
 * @param {Function} $normalizeLink
 * @param {Object}   $halConfiguration
 */
function ResourceFactory(HalResourceClient, $generateUrl, $extendReadOnly, $defineReadOnly, $normalizeLink, $halConfiguration) {
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
      if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object' || data === null) {
        data = {};
      }
      initializeData();
      initializeEmbedded();
      initializeLinks();
      inititalizeClient();

      $extendReadOnly(self, {
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
        $defineReadOnly(self, propertyName, data[propertyName]);
      }
    }

    /**
     * Normalize all Links
     */
    function initializeLinks() {
      if (_typeof(data[$halConfiguration.linksAttribute]) !== 'object') {
        return;
      }

      Object.keys(data[$halConfiguration.linksAttribute]).forEach(function (rel) {
        var link = data[$halConfiguration.linksAttribute][rel];
        links[rel] = $normalizeLink(response.config.url, link);
      });
    }

    /**
     * Normalize Embedded Contents
     */
    function initializeEmbedded() {
      if (_typeof(data[$halConfiguration.embeddedAttribute]) !== 'object') {
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
      return typeof links[rel] !== 'undefined';
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $hasEmbedded(rel) {
      return typeof embedded[rel] !== 'undefined';
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
      if (!$hasLink(rel)) {
        throw new Error('link "' + rel + '" is undefined');
      }

      var link = links[rel],
          href = link.href;

      if (Array.isArray(link)) {
        href = [];
        for (var i = 0; i < link.length; i++) {
          var subLink = link[i],
              subHref = subLink.href;
          if (typeof subLink.templated !== 'undefined' && subLink.templated) {
            subHref = $generateUrl(subLink.href, parameters);
          }
          subHref = $halConfiguration.urlTransformer(subHref);
          href.push(subHref);
        }
      } else {
        if (typeof link.templated !== 'undefined' && link.templated) {
          href = $generateUrl(link.href, parameters);
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

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _urlGenerator = require('./url-generator.service');

var _urlGenerator2 = _interopRequireDefault(_urlGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal.url-generator';

// Add module for url generator
angular.module(MODULE_NAME, []).factory('$generateUrl', _urlGenerator2.default);

exports.default = MODULE_NAME;

},{"./url-generator.service":19}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UrlGeneratorFactory;

var _main = require('rfc6570/src/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Factory for URL Generator
 */
function UrlGeneratorFactory() {
  return generate;

  /**
   * Generate url from template
   *
   * @param  {String} template
   * @param  {Object} parameters
   * @return {String}
   */
  function generate(template, parameters) {
    return new _main2.default.UriTemplate(template).stringify(parameters);
  }
}

// Inject Dependencies
UrlGeneratorFactory.$inject = [];

},{"rfc6570/src/main":4}],20:[function(require,module,exports){
'use strict';

/**
 * Factory for Define Read Only
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DefineReadOnlyFactory;
function DefineReadOnlyFactory() {
  return defineReadOnly;

  /**
   * Define read-only property in target
   * @param {Object} target
   * @param {String} key
   * @param {mixed}  value
   */
  function defineReadOnly(target, key, value) {
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      value: value,
      writable: true
    });
  }
}

// Inject Dependencies
DefineReadOnlyFactory.$inject = [];

},{}],21:[function(require,module,exports){
'use strict';

/**
 * Factory for Extend Read Only
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ExtendReadOnlyFactory;
function ExtendReadOnlyFactory() {
  return extendReadOnly;

  /**
   * Extend properties from copy read-only to target
   * @param {Object} target
   * @param {Object} copy
   */
  function extendReadOnly(target, copy) {
    for (var key in copy) {
      Object.defineProperty(target, key, {
        configurable: false,
        enumerable: false,
        value: copy[key]
      });
    }
  }
}

// Inject Dependencies
ExtendReadOnlyFactory.$inject = [];

},{}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineReadOnly = require('./define-read-only.factory');

var _defineReadOnly2 = _interopRequireDefault(_defineReadOnly);

var _extendReadOnly = require('./extend-read-only.factory');

var _extendReadOnly2 = _interopRequireDefault(_extendReadOnly);

var _normalizeLink = require('./normalize-link.factory');

var _normalizeLink2 = _interopRequireDefault(_normalizeLink);

var _resolveUrl = require('./resolve-url.factory');

var _resolveUrl2 = _interopRequireDefault(_resolveUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'angular-hal.utility';

// Add new module for utilities
angular.module(MODULE_NAME, []).factory('$defineReadOnly', _defineReadOnly2.default).factory('$extendReadOnly', _extendReadOnly2.default).factory('$normalizeLink', _normalizeLink2.default).factory('$resolveUrl', _resolveUrl2.default);

exports.default = MODULE_NAME;

},{"./define-read-only.factory":20,"./extend-read-only.factory":21,"./normalize-link.factory":23,"./resolve-url.factory":24}],23:[function(require,module,exports){
'use strict';

/**
 * Factory for Link Normalizer
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = NormalizeLinkFactory;
function NormalizeLinkFactory($resolveUrl) {
  return normalizeLink;

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
    if (typeof link === 'string') {
      return {
        href: $resolveUrl(baseUrl, link)
      };
    }
    if (typeof link.href === 'string') {
      link.href = $resolveUrl(baseUrl, link.href);
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
}

// Inject Dependencies
NormalizeLinkFactory.$inject = ['$resolveUrl'];

},{}],24:[function(require,module,exports){
'use strict';

/**
 * Factory for Url Resolver
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ResolveUrlFactory;
function ResolveUrlFactory() {
  return resolveUrl;

  /**
   * Resolve whole URL
   *
   * @param {String} baseUrl
   * @param {String} path
   * @return {String}
   */
  function resolveUrl(baseUrl, path) {
    var resultHref = '',
        reFullUrl = /^((?:\w+\:)?)((?:\/\/)?)([^\/]*)((?:\/.*)?)$/,
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
}

// Inject Dependencies
ResolveUrlFactory.$inject = [];

},{}]},{},[14])(14)
});