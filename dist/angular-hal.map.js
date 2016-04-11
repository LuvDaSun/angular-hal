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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY29udGVudC10eXBlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JmYzY1NzAvc3JjL1JvdXRlci5qcyIsIm5vZGVfbW9kdWxlcy9yZmM2NTcwL3NyYy9VcmlUZW1wbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9yZmM2NTcwL3NyYy9tYWluLmpzIiwic3JjL2NsaWVudC9oYWwtY2xpZW50LnNlcnZpY2UuanMiLCJzcmMvY2xpZW50L2luZGV4LmpzIiwic3JjL2NsaWVudC9saW5rLWhlYWRlci5mYWN0b3J5LmpzIiwic3JjL2NvbmZpZ3VyYXRpb24vaGFsLWNvbmZpZ3VyYXRpb24ucHJvdmlkZXIuanMiLCJzcmMvY29uZmlndXJhdGlvbi9pbmRleC5qcyIsInNyYy9odHRwLWludGVyY2VwdGlvbi9odHRwLWludGVyY2VwdGlvbi5jb25maWcuanMiLCJzcmMvaHR0cC1pbnRlcmNlcHRpb24vaW5kZXguanMiLCJzcmMvaHR0cC1pbnRlcmNlcHRpb24vcmVzb3VyY2UtaHR0cC1pbnRlcmNlcHRvci5mYWN0b3J5LmpzIiwic3JjL2h0dHAtaW50ZXJjZXB0aW9uL3Jlc3BvbnNlLXRyYW5zZm9ybWVyLnNlcnZpY2UuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvcmVzb3VyY2UvaGFsLXJlc291cmNlLWNsaWVudC5mYWN0b3J5LmpzIiwic3JjL3Jlc291cmNlL2luZGV4LmpzIiwic3JjL3Jlc291cmNlL3Jlc291cmNlLmZhY3RvcnkuanMiLCJzcmMvdXJsLWdlbmVyYXRvci9pbmRleC5qcyIsInNyYy91cmwtZ2VuZXJhdG9yL3VybC1nZW5lcmF0b3Iuc2VydmljZS5qcyIsInNyYy91dGlsaXR5L2RlZmluZS1yZWFkLW9ubHkuZmFjdG9yeS5qcyIsInNyYy91dGlsaXR5L2V4dGVuZC1yZWFkLW9ubHkuZmFjdG9yeS5qcyIsInNyYy91dGlsaXR5L2luZGV4LmpzIiwic3JjL3V0aWxpdHkvbm9ybWFsaXplLWxpbmsuZmFjdG9yeS5qcyIsInNyYy91dGlsaXR5L3Jlc29sdmUtdXJsLmZhY3RvcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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M0NBOzs7Ozs7Ozs7a0JBS3dCO0FBQVQsU0FBUyxpQkFBVCxHQUE2QjtBQUMxQyxTQUFPLFVBQVA7Ozs7Ozs7OztBQUQwQyxXQVVqQyxVQUFULENBQW9CLE9BQXBCLEVBQTZCLElBQTdCLEVBQW1DO0FBQ2pDLFFBQUksYUFBYSxFQUFiO1FBQ0EsWUFBWSw4Q0FBWjtRQUNBLGdCQUFnQixVQUFVLElBQVYsQ0FBZSxPQUFmLENBQWhCO1FBQ0EsWUFBWSxVQUFVLElBQVYsQ0FBZSxJQUFmLENBQVosQ0FKNkI7O0FBTWpDLFNBQUssSUFBSSxZQUFZLENBQVosRUFBZSxZQUFZLENBQVosRUFBZSxXQUF2QyxFQUFvRDtBQUNsRCxVQUFJLFVBQVUsU0FBVixDQUFKLEVBQTBCO0FBQ3hCLHNCQUFjLFVBQVUsU0FBVixDQUFkLENBRHdCO09BQTFCLE1BRU87QUFDTCxzQkFBYyxjQUFjLFNBQWQsQ0FBZCxDQURLO09BRlA7S0FERjs7QUFRQSxXQUFPLFVBQVAsQ0FkaUM7R0FBbkM7Q0FWYTs7O0FBNkJmLGtCQUFrQixPQUFsQixHQUE0QixFQUE1QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIGNvbnRlbnQtdHlwZVxuICogQ29weXJpZ2h0KGMpIDIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb25cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCAqKCBcIjtcIiBwYXJhbWV0ZXIgKSBpbiBSRkMgNzIzMSBzZWMgMy4xLjEuMVxuICpcbiAqIHBhcmFtZXRlciAgICAgPSB0b2tlbiBcIj1cIiAoIHRva2VuIC8gcXVvdGVkLXN0cmluZyApXG4gKiB0b2tlbiAgICAgICAgID0gMSp0Y2hhclxuICogdGNoYXIgICAgICAgICA9IFwiIVwiIC8gXCIjXCIgLyBcIiRcIiAvIFwiJVwiIC8gXCImXCIgLyBcIidcIiAvIFwiKlwiXG4gKiAgICAgICAgICAgICAgIC8gXCIrXCIgLyBcIi1cIiAvIFwiLlwiIC8gXCJeXCIgLyBcIl9cIiAvIFwiYFwiIC8gXCJ8XCIgLyBcIn5cIlxuICogICAgICAgICAgICAgICAvIERJR0lUIC8gQUxQSEFcbiAqICAgICAgICAgICAgICAgOyBhbnkgVkNIQVIsIGV4Y2VwdCBkZWxpbWl0ZXJzXG4gKiBxdW90ZWQtc3RyaW5nID0gRFFVT1RFICooIHFkdGV4dCAvIHF1b3RlZC1wYWlyICkgRFFVT1RFXG4gKiBxZHRleHQgICAgICAgID0gSFRBQiAvIFNQIC8gJXgyMSAvICV4MjMtNUIgLyAleDVELTdFIC8gb2JzLXRleHRcbiAqIG9icy10ZXh0ICAgICAgPSAleDgwLUZGXG4gKiBxdW90ZWQtcGFpciAgID0gXCJcXFwiICggSFRBQiAvIFNQIC8gVkNIQVIgLyBvYnMtdGV4dCApXG4gKi9cbnZhciBwYXJhbVJlZ0V4cCA9IC87ICooWyEjJCUmJ1xcKlxcK1xcLVxcLlxcXl9gXFx8fjAtOUEtWmEtel0rKSAqPSAqKFwiKD86W1xcdTAwMGJcXHUwMDIwXFx1MDAyMVxcdTAwMjMtXFx1MDA1YlxcdTAwNWQtXFx1MDA3ZVxcdTAwODAtXFx1MDBmZl18XFxcXFtcXHUwMDBiXFx1MDAyMC1cXHUwMGZmXSkqXCJ8WyEjJCUmJ1xcKlxcK1xcLVxcLlxcXl9gXFx8fjAtOUEtWmEtel0rKSAqL2dcbnZhciB0ZXh0UmVnRXhwID0gL15bXFx1MDAwYlxcdTAwMjAtXFx1MDA3ZVxcdTAwODAtXFx1MDBmZl0rJC9cbnZhciB0b2tlblJlZ0V4cCA9IC9eWyEjJCUmJ1xcKlxcK1xcLVxcLlxcXl9gXFx8fjAtOUEtWmEtel0rJC9cblxuLyoqXG4gKiBSZWdFeHAgdG8gbWF0Y2ggcXVvdGVkLXBhaXIgaW4gUkZDIDcyMzAgc2VjIDMuMi42XG4gKlxuICogcXVvdGVkLXBhaXIgPSBcIlxcXCIgKCBIVEFCIC8gU1AgLyBWQ0hBUiAvIG9icy10ZXh0IClcbiAqIG9icy10ZXh0ICAgID0gJXg4MC1GRlxuICovXG52YXIgcWVzY1JlZ0V4cCA9IC9cXFxcKFtcXHUwMDBiXFx1MDAyMC1cXHUwMGZmXSkvZ1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBjaGFycyB0aGF0IG11c3QgYmUgcXVvdGVkLXBhaXIgaW4gUkZDIDcyMzAgc2VjIDMuMi42XG4gKi9cbnZhciBxdW90ZVJlZ0V4cCA9IC8oW1xcXFxcIl0pL2dcblxuLyoqXG4gKiBSZWdFeHAgdG8gbWF0Y2ggdHlwZSBpbiBSRkMgNjgzOFxuICpcbiAqIG1lZGlhLXR5cGUgPSB0eXBlIFwiL1wiIHN1YnR5cGVcbiAqIHR5cGUgICAgICAgPSB0b2tlblxuICogc3VidHlwZSAgICA9IHRva2VuXG4gKi9cbnZhciB0eXBlUmVnRXhwID0gL15bISMkJSYnXFwqXFwrXFwtXFwuXFxeX2BcXHx+MC05QS1aYS16XStcXC9bISMkJSYnXFwqXFwrXFwtXFwuXFxeX2BcXHx+MC05QS1aYS16XSskL1xuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICogQHB1YmxpY1xuICovXG5cbmlmKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBleHBvcnRzLmZvcm1hdCA9IGZvcm1hdFxuICBleHBvcnRzLnBhcnNlID0gcGFyc2Vcbn0gZWxzZSB7XG4gIHdpbmRvdy5jb250ZW50VHlwZSA9IHtcbiAgICBmb3JtYXQ6IGZvcm1hdCxcbiAgICBwYXJzZTogcGFyc2UsXG4gIH07XG59XG5cbi8qKlxuICogRm9ybWF0IG9iamVjdCB0byBtZWRpYSB0eXBlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXQob2JqKSB7XG4gIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgb2JqIGlzIHJlcXVpcmVkJylcbiAgfVxuXG4gIHZhciBwYXJhbWV0ZXJzID0gb2JqLnBhcmFtZXRlcnNcbiAgdmFyIHR5cGUgPSBvYmoudHlwZVxuXG4gIGlmICghdHlwZSB8fCAhdHlwZVJlZ0V4cC50ZXN0KHR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCB0eXBlJylcbiAgfVxuXG4gIHZhciBzdHJpbmcgPSB0eXBlXG5cbiAgLy8gYXBwZW5kIHBhcmFtZXRlcnNcbiAgaWYgKHBhcmFtZXRlcnMgJiYgdHlwZW9mIHBhcmFtZXRlcnMgPT09ICdvYmplY3QnKSB7XG4gICAgdmFyIHBhcmFtXG4gICAgdmFyIHBhcmFtcyA9IE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpLnNvcnQoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhcmFtID0gcGFyYW1zW2ldXG5cbiAgICAgIGlmICghdG9rZW5SZWdFeHAudGVzdChwYXJhbSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBwYXJhbWV0ZXIgbmFtZScpXG4gICAgICB9XG5cbiAgICAgIHN0cmluZyArPSAnOyAnICsgcGFyYW0gKyAnPScgKyBxc3RyaW5nKHBhcmFtZXRlcnNbcGFyYW1dKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHJpbmdcbn1cblxuLyoqXG4gKiBQYXJzZSBtZWRpYSB0eXBlIHRvIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IHN0cmluZ1xuICogQHJldHVybiB7T2JqZWN0fVxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cmluZykge1xuICBpZiAoIXN0cmluZykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHN0cmluZyBpcyByZXF1aXJlZCcpXG4gIH1cblxuICBpZiAodHlwZW9mIHN0cmluZyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBzdXBwb3J0IHJlcS9yZXMtbGlrZSBvYmplY3RzIGFzIGFyZ3VtZW50XG4gICAgc3RyaW5nID0gZ2V0Y29udGVudHR5cGUoc3RyaW5nKVxuXG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjb250ZW50LXR5cGUgaGVhZGVyIGlzIG1pc3NpbmcgZnJvbSBvYmplY3QnKTtcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzdHJpbmcgaXMgcmVxdWlyZWQgdG8gYmUgYSBzdHJpbmcnKVxuICB9XG5cbiAgdmFyIGluZGV4ID0gc3RyaW5nLmluZGV4T2YoJzsnKVxuICB2YXIgdHlwZSA9IGluZGV4ICE9PSAtMVxuICAgID8gc3RyaW5nLnN1YnN0cigwLCBpbmRleCkudHJpbSgpXG4gICAgOiBzdHJpbmcudHJpbSgpXG5cbiAgaWYgKCF0eXBlUmVnRXhwLnRlc3QodHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbnZhbGlkIG1lZGlhIHR5cGUnKVxuICB9XG5cbiAgdmFyIGtleVxuICB2YXIgbWF0Y2hcbiAgdmFyIG9iaiA9IG5ldyBDb250ZW50VHlwZSh0eXBlLnRvTG93ZXJDYXNlKCkpXG4gIHZhciB2YWx1ZVxuXG4gIHBhcmFtUmVnRXhwLmxhc3RJbmRleCA9IGluZGV4XG5cbiAgd2hpbGUgKG1hdGNoID0gcGFyYW1SZWdFeHAuZXhlYyhzdHJpbmcpKSB7XG4gICAgaWYgKG1hdGNoLmluZGV4ICE9PSBpbmRleCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBwYXJhbWV0ZXIgZm9ybWF0JylcbiAgICB9XG5cbiAgICBpbmRleCArPSBtYXRjaFswXS5sZW5ndGhcbiAgICBrZXkgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpXG4gICAgdmFsdWUgPSBtYXRjaFsyXVxuXG4gICAgaWYgKHZhbHVlWzBdID09PSAnXCInKSB7XG4gICAgICAvLyByZW1vdmUgcXVvdGVzIGFuZCBlc2NhcGVzXG4gICAgICB2YWx1ZSA9IHZhbHVlXG4gICAgICAgIC5zdWJzdHIoMSwgdmFsdWUubGVuZ3RoIC0gMilcbiAgICAgICAgLnJlcGxhY2UocWVzY1JlZ0V4cCwgJyQxJylcbiAgICB9XG5cbiAgICBvYmoucGFyYW1ldGVyc1trZXldID0gdmFsdWVcbiAgfVxuXG4gIGlmIChpbmRleCAhPT0gLTEgJiYgaW5kZXggIT09IHN0cmluZy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbnZhbGlkIHBhcmFtZXRlciBmb3JtYXQnKVxuICB9XG5cbiAgcmV0dXJuIG9ialxufVxuXG4vKipcbiAqIEdldCBjb250ZW50LXR5cGUgZnJvbSByZXEvcmVzIG9iamVjdHMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9XG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGdldGNvbnRlbnR0eXBlKG9iaikge1xuICBpZiAodHlwZW9mIG9iai5nZXRIZWFkZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyByZXMtbGlrZVxuICAgIHJldHVybiBvYmouZ2V0SGVhZGVyKCdjb250ZW50LXR5cGUnKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmouaGVhZGVycyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyByZXEtbGlrZVxuICAgIHJldHVybiBvYmouaGVhZGVycyAmJiBvYmouaGVhZGVyc1snY29udGVudC10eXBlJ11cbiAgfVxufVxuXG4vKipcbiAqIFF1b3RlIGEgc3RyaW5nIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHFzdHJpbmcodmFsKSB7XG4gIHZhciBzdHIgPSBTdHJpbmcodmFsKVxuXG4gIC8vIG5vIG5lZWQgdG8gcXVvdGUgdG9rZW5zXG4gIGlmICh0b2tlblJlZ0V4cC50ZXN0KHN0cikpIHtcbiAgICByZXR1cm4gc3RyXG4gIH1cblxuICBpZiAoc3RyLmxlbmd0aCA+IDAgJiYgIXRleHRSZWdFeHAudGVzdChzdHIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW52YWxpZCBwYXJhbWV0ZXIgdmFsdWUnKVxuICB9XG5cbiAgcmV0dXJuICdcIicgKyBzdHIucmVwbGFjZShxdW90ZVJlZ0V4cCwgJ1xcXFwkMScpICsgJ1wiJ1xufVxuXG4vKipcbiAqIENsYXNzIHRvIHJlcHJlc2VudCBhIGNvbnRlbnQgdHlwZS5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIENvbnRlbnRUeXBlKHR5cGUpIHtcbiAgdGhpcy5wYXJhbWV0ZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICB0aGlzLnR5cGUgPSB0eXBlXG59XG4iLCIvKiBqc2hpbnQgbm9kZTp0cnVlICovXG5cbnZhciBVcmlUZW1wbGF0ZSA9IHJlcXVpcmUoJy4vVXJpVGVtcGxhdGUnKTtcblxuZnVuY3Rpb24gUm91dGVyKCkge1xuICAgIHZhciByb3V0ZXMgPSBbXTtcblxuICAgIHRoaXMuYWRkID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBoYW5kbGVyKSB7XG5cbiAgICAgICAgcm91dGVzLnB1c2goe1xuICAgICAgICAgICAgdGVtcGxhdGU6IG5ldyBVcmlUZW1wbGF0ZSh0ZW1wbGF0ZSksXG4gICAgICAgICAgICBoYW5kbGVyOiBoYW5kbGVyXG4gICAgICAgIH0pOyAvL1xuXG4gICAgfTsgLy9hZGRcblxuICAgIHRoaXMuaGFuZGxlID0gZnVuY3Rpb24gKHVybCkge1xuXG4gICAgICAgIHJldHVybiByb3V0ZXMuc29tZShmdW5jdGlvbiAocm91dGUpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcm91dGUudGVtcGxhdGUucGFyc2UodXJsKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhICYmIHJvdXRlLmhhbmRsZXIoZGF0YSkgIT09IGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgIH07IC8vZXhlY1xuXG59IC8vUm91dGVyXG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyOyIsIi8qIGpzaGludCBub2RlOnRydWUgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBVcmlUZW1wbGF0ZTtcblxuXG52YXIgb3BlcmF0b3JPcHRpb25zID0ge1xuICAgIFwiXCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCJcIixcbiAgICAgICAgXCJzZXBlcmF0b3JcIjogXCIsXCIsXG4gICAgICAgIFwiYXNzaWdubWVudFwiOiBmYWxzZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiBmYWxzZSxcbiAgICAgICAgXCJlbmNvZGVcIjogcGVyY2VudEVuY29kZVxuICAgIH0sXG4gICAgXCIrXCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCJcIixcbiAgICAgICAgXCJzZXBlcmF0b3JcIjogXCIsXCIsXG4gICAgICAgIFwiYXNzaWdubWVudFwiOiBmYWxzZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiBmYWxzZSxcbiAgICAgICAgXCJlbmNvZGVcIjogZW5jb2RlVVJJXG4gICAgfSxcbiAgICBcIiNcIjoge1xuICAgICAgICBcInByZWZpeFwiOiBcIiNcIixcbiAgICAgICAgXCJzZXBlcmF0b3JcIjogXCIsXCIsXG4gICAgICAgIFwiYXNzaWdubWVudFwiOiBmYWxzZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiBmYWxzZSxcbiAgICAgICAgXCJlbmNvZGVcIjogZW5jb2RlVVJJXG4gICAgfSxcbiAgICBcIi5cIjoge1xuICAgICAgICBcInByZWZpeFwiOiBcIi5cIixcbiAgICAgICAgXCJzZXBlcmF0b3JcIjogXCIuXCIsXG4gICAgICAgIFwiYXNzaWdubWVudFwiOiBmYWxzZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiBmYWxzZSxcbiAgICAgICAgXCJlbmNvZGVcIjogcGVyY2VudEVuY29kZVxuICAgIH0sXG4gICAgXCIvXCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCIvXCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiL1wiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogZmFsc2UsXG4gICAgICAgIFwiZW5jb2RlXCI6IGVuY29kZVVSSUNvbXBvbmVudFxuICAgIH0sXG4gICAgXCI7XCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCI7XCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiO1wiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogdHJ1ZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiBmYWxzZSxcbiAgICAgICAgXCJlbmNvZGVcIjogZW5jb2RlVVJJQ29tcG9uZW50XG4gICAgfSxcbiAgICBcIj9cIjoge1xuICAgICAgICBcInByZWZpeFwiOiBcIj9cIixcbiAgICAgICAgXCJzZXBlcmF0b3JcIjogXCImXCIsXG4gICAgICAgIFwiYXNzaWdubWVudFwiOiB0cnVlLFxuICAgICAgICBcImFzc2lnbkVtcHR5XCI6IHRydWUsXG4gICAgICAgIFwiZW5jb2RlXCI6IGVuY29kZVVSSUNvbXBvbmVudFxuICAgIH0sXG4gICAgXCImXCI6IHtcbiAgICAgICAgXCJwcmVmaXhcIjogXCImXCIsXG4gICAgICAgIFwic2VwZXJhdG9yXCI6IFwiJlwiLFxuICAgICAgICBcImFzc2lnbm1lbnRcIjogdHJ1ZSxcbiAgICAgICAgXCJhc3NpZ25FbXB0eVwiOiB0cnVlLFxuICAgICAgICBcImVuY29kZVwiOiBlbmNvZGVVUklDb21wb25lbnRcbiAgICB9XG59OyAvL29wZXJhdG9yT3B0aW9uc1xuXG5mdW5jdGlvbiBwZXJjZW50RW5jb2RlKHZhbHVlKSB7XG4gICAgLypcblx0aHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzk4NiNzZWN0aW9uLTIuM1xuXHQqL1xuICAgIHZhciB1bnJlc2VydmVkID0gXCItLl9+XCI7XG5cbiAgICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKSByZXR1cm4gJyc7XG5cbiAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHZhbHVlLCBmdW5jdGlvbiAoY2gpIHtcbiAgICAgICAgdmFyIGNoYXJDb2RlID0gY2guY2hhckNvZGVBdCgwKTtcblxuICAgICAgICBpZiAoY2hhckNvZGUgPj0gMHgzMCAmJiBjaGFyQ29kZSA8PSAweDM5KSByZXR1cm4gY2g7XG4gICAgICAgIGlmIChjaGFyQ29kZSA+PSAweDQxICYmIGNoYXJDb2RlIDw9IDB4NWEpIHJldHVybiBjaDtcbiAgICAgICAgaWYgKGNoYXJDb2RlID49IDB4NjEgJiYgY2hhckNvZGUgPD0gMHg3YSkgcmV0dXJuIGNoO1xuXG4gICAgICAgIGlmICh+dW5yZXNlcnZlZC5pbmRleE9mKGNoKSkgcmV0dXJuIGNoO1xuXG4gICAgICAgIHJldHVybiAnJScgKyBjaGFyQ29kZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcbiAgICB9KS5qb2luKCcnKTtcblxufSAvL3BlcmNlbnRFbmNvZGVcblxuZnVuY3Rpb24gaXNEZWZpbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuICFpc1VuZGVmaW5lZCh2YWx1ZSk7XG59IC8vaXNEZWZpbmVkXG5mdW5jdGlvbiBpc1VuZGVmaW5lZCh2YWx1ZSkge1xuICAgIC8qXG5cdGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY1NzAjc2VjdGlvbi0yLjNcblx0Ki9cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufSAvL2lzVW5kZWZpbmVkXG5cblxuZnVuY3Rpb24gVXJpVGVtcGxhdGUodGVtcGxhdGUpIHtcbiAgICAvKlxuXHRodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2NTcwI3NlY3Rpb24tMi4yXG5cblx0ZXhwcmVzc2lvbiAgICA9ICBcIntcIiBbIG9wZXJhdG9yIF0gdmFyaWFibGUtbGlzdCBcIn1cIlxuXHRvcGVyYXRvciAgICAgID0gIG9wLWxldmVsMiAvIG9wLWxldmVsMyAvIG9wLXJlc2VydmVcblx0b3AtbGV2ZWwyICAgICA9ICBcIitcIiAvIFwiI1wiXG5cdG9wLWxldmVsMyAgICAgPSAgXCIuXCIgLyBcIi9cIiAvIFwiO1wiIC8gXCI/XCIgLyBcIiZcIlxuXHRvcC1yZXNlcnZlICAgID0gIFwiPVwiIC8gXCIsXCIgLyBcIiFcIiAvIFwiQFwiIC8gXCJ8XCJcblx0Ki9cbiAgICB2YXIgcmVUZW1wbGF0ZSA9IC9cXHsoW1xcKyNcXC5cXC87XFw/Jj1cXCwhQFxcfF0/KShbQS1aYS16MC05X1xcLFxcLlxcOlxcKl0rPylcXH0vZztcbiAgICB2YXIgcmVWYXJpYWJsZSA9IC9eKFtcXCRfYS16XVtcXCRfYS16MC05XSopKCg/OlxcOlsxLTldWzAtOV0/WzAtOV0/WzAtOV0/KT8pKFxcKj8pJC9pO1xuICAgIHZhciBtYXRjaDtcbiAgICB2YXIgcGllY2VzID0gW107XG4gICAgdmFyIGdsdWVzID0gW107XG4gICAgdmFyIG9mZnNldCA9IDA7XG4gICAgdmFyIHBpZWNlQ291bnQgPSAwO1xuXG4gICAgd2hpbGUgKCAhISAobWF0Y2ggPSByZVRlbXBsYXRlLmV4ZWModGVtcGxhdGUpKSkge1xuICAgICAgICBnbHVlcy5wdXNoKHRlbXBsYXRlLnN1YnN0cmluZyhvZmZzZXQsIG1hdGNoLmluZGV4KSk7XG4gICAgICAgIC8qXG5cdFx0VGhlIG9wZXJhdG9yIGNoYXJhY3RlcnMgZXF1YWxzIChcIj1cIiksIGNvbW1hIChcIixcIiksIGV4Y2xhbWF0aW9uIChcIiFcIiksXG5cdFx0YXQgc2lnbiAoXCJAXCIpLCBhbmQgcGlwZSAoXCJ8XCIpIGFyZSByZXNlcnZlZCBmb3IgZnV0dXJlIGV4dGVuc2lvbnMuXG5cdFx0Ki9cbiAgICAgICAgaWYgKG1hdGNoWzFdICYmIH4nPSwhQHwnLmluZGV4T2YobWF0Y2hbMV0pKSB7XG4gICAgICAgICAgICB0aHJvdyBcIm9wZXJhdG9yICdcIiArIG1hdGNoWzFdICsgXCInIGlzIHJlc2VydmVkIGZvciBmdXR1cmUgZXh0ZW5zaW9uc1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgb2Zmc2V0ID0gbWF0Y2guaW5kZXg7XG4gICAgICAgIHBpZWNlcy5wdXNoKHtcbiAgICAgICAgICAgIG9wZXJhdG9yOiBtYXRjaFsxXSxcbiAgICAgICAgICAgIHZhcmlhYmxlczogbWF0Y2hbMl0uc3BsaXQoJywnKS5tYXAodmFyaWFibGVNYXBwZXIpXG4gICAgICAgIH0pO1xuICAgICAgICBvZmZzZXQgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICBwaWVjZUNvdW50Kys7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFyaWFibGVNYXBwZXIodmFyaWFibGUpIHtcbiAgICAgICAgdmFyIG1hdGNoID0gcmVWYXJpYWJsZS5leGVjKHZhcmlhYmxlKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IG1hdGNoWzFdLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiBtYXRjaFsyXSAmJiBwYXJzZUludChtYXRjaFsyXS5zdWJzdHJpbmcoMSksIDEwKSxcbiAgICAgICAgICAgIGNvbXBvc2l0ZTogISEgbWF0Y2hbM11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnbHVlcy5wdXNoKHRlbXBsYXRlLnN1YnN0cmluZyhvZmZzZXQpKTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIHZhciBvZmZzZXQgPSAwO1xuICAgICAgICB2YXIgb2Zmc2V0cyA9IFtdO1xuXG4gICAgICAgIGlmICghZ2x1ZXMuZXZlcnkoZnVuY3Rpb24gKGdsdWUsIGdsdWVJbmRleCkge1xuICAgICAgICAgICAgdmFyIGluZGV4O1xuICAgICAgICAgICAgaWYgKGdsdWVJbmRleCA+IDAgJiYgZ2x1ZSA9PT0gJycpIGluZGV4ID0gc3RyLmxlbmd0aDtcbiAgICAgICAgICAgIGVsc2UgaW5kZXggPSBzdHIuaW5kZXhPZihnbHVlLCBvZmZzZXQpO1xuXG4gICAgICAgICAgICBvZmZzZXQgPSBpbmRleDtcbiAgICAgICAgICAgIG9mZnNldHMucHVzaChvZmZzZXQpO1xuICAgICAgICAgICAgb2Zmc2V0ICs9IGdsdWUubGVuZ3RoO1xuXG4gICAgICAgICAgICByZXR1cm5+IGluZGV4O1xuICAgICAgICB9KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIGlmICghcGllY2VzLmV2ZXJ5KGZ1bmN0aW9uIChwaWVjZSwgcGllY2VJbmRleCkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBvcGVyYXRvck9wdGlvbnNbcGllY2Uub3BlcmF0b3JdO1xuICAgICAgICAgICAgdmFyIHZhbHVlLCB2YWx1ZXM7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0QmVnaW4gPSBvZmZzZXRzW3BpZWNlSW5kZXhdICsgZ2x1ZXNbcGllY2VJbmRleF0ubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIG9mZnNldEVuZCA9IG9mZnNldHNbcGllY2VJbmRleCArIDFdO1xuXG4gICAgICAgICAgICB2YWx1ZSA9IHN0ci5zdWJzdHJpbmcob2Zmc2V0QmVnaW4sIG9mZnNldEVuZCk7XG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zdWJzdHJpbmcoMCwgb3B0aW9ucy5wcmVmaXgubGVuZ3RoKSAhPT0gb3B0aW9ucy5wcmVmaXgpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKG9wdGlvbnMucHJlZml4Lmxlbmd0aCk7XG4gICAgICAgICAgICB2YWx1ZXMgPSB2YWx1ZS5zcGxpdChvcHRpb25zLnNlcGVyYXRvcik7XG5cbiAgICAgICAgICAgIGlmICghcGllY2UudmFyaWFibGVzLmV2ZXJ5KGZ1bmN0aW9uICh2YXJpYWJsZSwgdmFyaWFibGVJbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1t2YXJpYWJsZUluZGV4XTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZTtcblxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIG5hbWUgPSB2YXJpYWJsZS5uYW1lO1xuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXNzaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuc3Vic3RyaW5nKDAsIG5hbWUubGVuZ3RoKSAhPT0gbmFtZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyhuYW1lLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDAgJiYgb3B0aW9ucy5hc3NpZ25FbXB0eSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlWzBdICE9PSAnPScpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICBkYXRhW25hbWVdID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIH0pKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTsgLy9wYXJzZVxuXG4gICAgdGhpcy5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgIGRhdGEgPSBkYXRhIHx8IHt9O1xuXG4gICAgICAgIHN0ciArPSBnbHVlc1swXTtcbiAgICAgICAgaWYgKCFwaWVjZXMuZXZlcnkoZnVuY3Rpb24gKHBpZWNlLCBwaWVjZUluZGV4KSB7XG5cbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gb3BlcmF0b3JPcHRpb25zW3BpZWNlLm9wZXJhdG9yXTtcbiAgICAgICAgICAgIHZhciBwYXJ0cztcblxuICAgICAgICAgICAgcGFydHMgPSBwaWVjZS52YXJpYWJsZXMubWFwKGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbdmFyaWFibGUubmFtZV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB2YWx1ZSA9IFt2YWx1ZV07XG5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmZpbHRlcihpc0RlZmluZWQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUuY29tcG9zaXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUubWFwKGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBPYmplY3Qua2V5cyh2YWx1ZSkubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVZhbHVlID0gdmFsdWVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLm1heExlbmd0aCkga2V5VmFsdWUgPSBrZXlWYWx1ZS5zdWJzdHJpbmcoMCwgdmFyaWFibGUubWF4TGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlWYWx1ZSA9IG9wdGlvbnMuZW5jb2RlKGtleVZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5VmFsdWUpIGtleVZhbHVlID0ga2V5ICsgJz0nICsga2V5VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5VmFsdWUgPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hc3NpZ25FbXB0eSkga2V5VmFsdWUgKz0gJz0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmpvaW4ob3B0aW9ucy5zZXBlcmF0b3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS5tYXhMZW5ndGgpIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsIHZhcmlhYmxlLm1heExlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdGlvbnMuZW5jb2RlKHZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmFzc2lnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlKSB2YWx1ZSA9IHZhcmlhYmxlLm5hbWUgKyAnPScgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhcmlhYmxlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hc3NpZ25FbXB0eSkgdmFsdWUgKz0gJz0nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuam9pbihvcHRpb25zLnNlcGVyYXRvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleVZhbHVlID0gdmFsdWVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLm1heExlbmd0aCkga2V5VmFsdWUgPSBrZXlWYWx1ZS5zdWJzdHJpbmcoMCwgdmFyaWFibGUubWF4TGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtleSArICcsJyArIG9wdGlvbnMuZW5jb2RlKGtleVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5qb2luKCcsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS5tYXhMZW5ndGgpIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsIHZhcmlhYmxlLm1heExlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5lbmNvZGUodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4oJywnKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hc3NpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUpIHZhbHVlID0gdmFyaWFibGUubmFtZSArICc9JyArIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YXJpYWJsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmFzc2lnbkVtcHR5KSB2YWx1ZSArPSAnPSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwYXJ0cyA9IHBhcnRzLmZpbHRlcihpc0RlZmluZWQpO1xuICAgICAgICAgICAgaWYgKGlzRGVmaW5lZChwYXJ0cykpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gb3B0aW9ucy5wcmVmaXg7XG4gICAgICAgICAgICAgICAgc3RyICs9IHBhcnRzLmpvaW4ob3B0aW9ucy5zZXBlcmF0b3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdHIgKz0gZ2x1ZXNbcGllY2VJbmRleCArIDFdO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9OyAvL3N0cmluZ2lmeVxuXG59IC8vVXJpVGVtcGxhdGUiLCIvKiBqc2hpbnQgbm9kZTp0cnVlICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFJvdXRlcjogcmVxdWlyZSgnLi9Sb3V0ZXInKSxcbiAgICBVcmlUZW1wbGF0ZTogcmVxdWlyZSgnLi9VcmlUZW1wbGF0ZScpXG59OyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAcGFyYW0ge0xvZ30gICAgICAkbG9nXG4gKiBAcGFyYW0ge0h0dHB9ICAgICAkaHR0cFxuICogQHBhcmFtIHtGdW5jdGlvbn0gTGlua0hlYWRlclxuICogQHBhcmFtIHtPYmplY3R9ICAgJGhhbENvbmZpZ3VyYXRpb25cbiAqIEBkZXByZWNhdGVkIFRoZSBoYWxDbGllbnQgc2VydmljZSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlICRodHRwIGRpcmVjdGx5IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEhhbENsaWVudFNlcnZpY2UoJGxvZywgJGh0dHAsIExpbmtIZWFkZXIsICRoYWxDb25maWd1cmF0aW9uKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvKipcbiAgICogQHJldHVybiBJbml0aWFsaXplIGhhbENsaWVudFxuICAgKi9cbiAgIChmdW5jdGlvbiBpbml0KCkge1xuICAgICAgYW5ndWxhci5leHRlbmQoc2VsZiwge1xuICAgICAgICAkZ2V0OiAkZ2V0LFxuICAgICAgICAkcG9zdDogJHBvc3QsXG4gICAgICAgICRwdXQ6ICRwdXQsXG4gICAgICAgICRwYXRjaDogJHBhdGNoLFxuICAgICAgICAkZGVsZXRlOiAkZGVsZXRlLFxuICAgICAgICAkZGVsOiAkZGVsZXRlLFxuICAgICAgICAkbGluazogJGxpbmssXG4gICAgICAgICR1bmxpbms6ICR1bmxpbmssXG4gICAgICAgIExpbmtIZWFkZXI6IExpbmtIZWFkZXIsXG4gICAgICB9KTtcbiAgIH0pKCk7XG5cbiAgLyogQG5nTm9JbmplY3QgKi9cbiAgZnVuY3Rpb24gJGdldChocmVmLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuICRyZXF1ZXN0KCdHRVQnLCBocmVmLCBvcHRpb25zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uICRwb3N0KGhyZWYsIG9wdGlvbnMsIGRhdGEpIHtcbiAgICByZXR1cm4gJHJlcXVlc3QoJ1BPU1QnLCBocmVmLCBvcHRpb25zLCBkYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uICRwdXQoaHJlZiwgb3B0aW9ucywgZGF0YSkge1xuICAgIHJldHVybiAkcmVxdWVzdCgnUFVUJywgaHJlZiwgb3B0aW9ucywgZGF0YSk7XG4gIH1cblxuICBmdW5jdGlvbiAkcGF0Y2goaHJlZiwgb3B0aW9ucywgZGF0YSkge1xuICAgIHJldHVybiAkcmVxdWVzdCgnUEFUQ0gnLCBocmVmLCBvcHRpb25zLCBkYXRhKTtcbiAgfVxuXG4gIGZ1bmN0aW9uICRkZWxldGUoaHJlZiwgb3B0aW9ucykge1xuICAgIHJldHVybiAkcmVxdWVzdCgnREVMRVRFJywgaHJlZiwgb3B0aW9ucyk7XG4gIH1cblxuICBmdW5jdGlvbiAkbGluayhocmVmLCBvcHRpb25zLCBsaW5rSGVhZGVycykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyB8fCB7fTtcbiAgICBvcHRpb25zLmhlYWRlcnMuTGluayA9IGxpbmtIZWFkZXJzLm1hcChmdW5jdGlvbihsaW5rKSB7IHJldHVybiBsaW5rLnRvU3RyaW5nKCk7IH0pO1xuICAgIHJldHVybiAkcmVxdWVzdCgnTElOSycsIGhyZWYsIG9wdGlvbnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gJHVubGluayhocmVmLCBvcHRpb25zLCBsaW5rSGVhZGVycykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyB8fCB7fTtcbiAgICBvcHRpb25zLmhlYWRlcnMuTGluayA9IGxpbmtIZWFkZXJzLm1hcChmdW5jdGlvbihsaW5rKSB7IHJldHVybiBsaW5rLnRvU3RyaW5nKCk7IH0pO1xuICAgIHJldHVybiAkcmVxdWVzdCgnVU5MSU5LJywgaHJlZiwgb3B0aW9ucyk7XG4gIH1cblxuICBmdW5jdGlvbiAkcmVxdWVzdChtZXRob2QsIGhyZWYsIG9wdGlvbnMsIGRhdGEpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAkbG9nLmxvZygnVGhlIGhhbENsaWVudCBzZXJ2aWNlIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgJGh0dHAgZGlyZWN0bHkgaW5zdGVhZC4nKTtcbiAgICByZXR1cm4gJGh0dHAoYW5ndWxhci5leHRlbmQoe30sIG9wdGlvbnMsIHtcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgdXJsOiAkaGFsQ29uZmlndXJhdGlvbi51cmxUcmFuc2Zvcm1lcihocmVmKSxcbiAgICAgIGRhdGE6IGRhdGEsXG4gICAgfSkpO1xuICB9XG59XG5cbi8vIEluamVjdCBEZXBlbmRlbmNpZXNcbkhhbENsaWVudFNlcnZpY2UuJGluamVjdCA9IFtcbiAgJyRsb2cnLFxuICAnJGh0dHAnLFxuICAnTGlua0hlYWRlcicsXG4gICckaGFsQ29uZmlndXJhdGlvbicsXG5dO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBNT0RVTEVfTkFNRSA9ICdhbmd1bGFyLWhhbC5jbGllbnQnO1xuXG5cbmltcG9ydCB1dGlsaXR5IGZyb20gJy4uL3V0aWxpdHknO1xuXG5pbXBvcnQgSGFsQ2xpZW50U2VydmljZSBmcm9tICcuL2hhbC1jbGllbnQuc2VydmljZSc7XG5pbXBvcnQgTGlua0hlYWRlckZhY3RvcnkgZnJvbSAnLi9saW5rLWhlYWRlci5mYWN0b3J5JztcblxuLy8gQWRkIG1vZHVsZSBmb3IgY2xpZW50XG5hbmd1bGFyXG4gIC5tb2R1bGUoTU9EVUxFX05BTUUsIFtcbiAgICB1dGlsaXR5LFxuICBdKVxuXG4gIC5zZXJ2aWNlKCdoYWxDbGllbnQnLCBIYWxDbGllbnRTZXJ2aWNlKVxuICAuc2VydmljZSgnJGhhbENsaWVudCcsIEhhbENsaWVudFNlcnZpY2UpXG5cbiAgLmZhY3RvcnkoJ0xpbmtIZWFkZXInLCBMaW5rSGVhZGVyRmFjdG9yeSlcbjtcblxuZXhwb3J0IGRlZmF1bHQgTU9EVUxFX05BTUU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRmFjdG9yeSBmb3IgTGlua0hlYWRlclxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBMaW5rSGVhZGVyRmFjdG9yeSgpIHtcbiAgcmV0dXJuIExpbmtIZWFkZXI7XG5cbiAgLyoqXG4gICAqIExpbmsgSGVhZGVyXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1cmlSZWZlcmVuY2UgVGhlIExpbmsgVmFsdWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGxpbmtQYXJhbXMgICBUaGUgTGluayBQYXJhbXNcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBMaW5rSGVhZGVyKHVyaVJlZmVyZW5jZSwgbGlua1BhcmFtcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgdGhlIExpbmtIZWFkZXJcbiAgICAgKlxuICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAqL1xuICAgIChmdW5jdGlvbiBpbml0KCkge1xuICAgICAgYW5ndWxhci5leHRlbmQoc2VsZiwge1xuICAgICAgICB1cmlSZWZlcmVuY2U6IHVyaVJlZmVyZW5jZSxcbiAgICAgICAgbGlua1BhcmFtczogYW5ndWxhci5leHRlbmQoXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVsOiBudWxsLFxuICAgICAgICAgICAgYW5jaG9yOiBudWxsLFxuICAgICAgICAgICAgcmV2OiBudWxsLFxuICAgICAgICAgICAgaHJlZmxhbmc6IG51bGwsXG4gICAgICAgICAgICBtZWRpYTogbnVsbCxcbiAgICAgICAgICAgIHRpdGxlOiBudWxsLFxuICAgICAgICAgICAgdHlwZTogbnVsbCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGxpbmtQYXJhbXNcbiAgICAgICAgKSxcbiAgICAgIH0pO1xuICAgIH0pKCk7XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IExpbmtIZWFkZXIgdG8gU3RyaW5nXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICovXG4gICAgc2VsZi50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgdmFyIHJlc3VsdCA9ICc8JyArIHNlbGYudXJpUmVmZXJlbmNlICsgJz4nXG4gICAgICAgICwgcGFyYW1zID0gW107XG5cbiAgICAgIGZvcihsZXQgcGFyYW1OYW1lIGluIHNlbGYubGlua1BhcmFtcykge1xuICAgICAgICBsZXQgcGFyYW1WYWx1ZSA9IHNlbGYubGlua1BhcmFtc1twYXJhbU5hbWVdO1xuICAgICAgICBpZihwYXJhbVZhbHVlKSB7XG4gICAgICAgICAgcGFyYW1zLnB1c2gocGFyYW1OYW1lICsgJz1cIicgKyBwYXJhbVZhbHVlICsgJ1wiJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYocGFyYW1zLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgJzsnICsgcGFyYW1zLmpvaW4oJzsnKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuTGlua0hlYWRlckZhY3RvcnkuJGluamVjdCA9IFtdO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSGFsQ29uZmlndXJhdGlvblByb3ZpZGVyKCkge1xuICB2YXIgbGlua3NBdHRyaWJ1dGUgPSAnX2xpbmtzJ1xuICAgICwgZW1iZWRkZWRBdHRyaWJ1dGUgPSAnX2VtYmVkZGVkJ1xuICAgICwgaWdub3JlQXR0cmlidXRlUHJlZml4ZXMgPSBbXG4gICAgICAgICdfJyxcbiAgICAgICAgJyQnLFxuICAgICAgXVxuICAgICwgc2VsZkxpbmsgPSAnc2VsZidcbiAgICAsIGZvcmNlSlNPTlJlc291cmNlID0gZmFsc2VcbiAgICAsIHVybFRyYW5zZm9ybWVyID0gbm9vcFVybFRyYW5zZm9ybWVyO1xuXG4gIC8vIEluamVjdCBEZXBlbmRlbmNpZXNcbiAgJGdldC4kaW5qZWN0ID0gW1xuICAgICckbG9nJyxcbiAgXTtcblxuICByZXR1cm4ge1xuICAgIHNldExpbmtzQXR0cmlidXRlOiBzZXRMaW5rc0F0dHJpYnV0ZSxcbiAgICBzZXRFbWJlZGRlZEF0dHJpYnV0ZTogc2V0RW1iZWRkZWRBdHRyaWJ1dGUsXG4gICAgc2V0SWdub3JlQXR0cmlidXRlUHJlZml4ZXM6IHNldElnbm9yZUF0dHJpYnV0ZVByZWZpeGVzLFxuICAgIGFkZElnbm9yZUF0dHJpYnV0ZVByZWZpeDogYWRkSWdub3JlQXR0cmlidXRlUHJlZml4LFxuICAgIHNldFNlbGZMaW5rOiBzZXRTZWxmTGluayxcbiAgICBzZXRGb3JjZUpTT05SZXNvdXJjZTogc2V0Rm9yY2VKU09OUmVzb3VyY2UsXG4gICAgc2V0VXJsVHJhbnNmb3JtZXI6IHNldFVybFRyYW5zZm9ybWVyLFxuICAgICRnZXQ6ICRnZXQsXG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdMaW5rc0F0dHJpYnV0ZVxuICAgKi9cbiAgZnVuY3Rpb24gc2V0TGlua3NBdHRyaWJ1dGUobmV3TGlua3NBdHRyaWJ1dGUpIHtcbiAgICBsaW5rc0F0dHJpYnV0ZSA9IG5ld0xpbmtzQXR0cmlidXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdFbWJlZGRlZEF0dHJpYnV0ZVxuICAgKi9cbiAgZnVuY3Rpb24gc2V0RW1iZWRkZWRBdHRyaWJ1dGUobmV3RW1iZWRkZWRBdHRyaWJ1dGUpIHtcbiAgICBlbWJlZGRlZEF0dHJpYnV0ZSA9IG5ld0VtYmVkZGVkQXR0cmlidXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nW119IG5ld0lnbm9yZUF0dHJpYnV0ZVByZWZpeGVzXG4gICAqL1xuICBmdW5jdGlvbiBzZXRJZ25vcmVBdHRyaWJ1dGVQcmVmaXhlcyhuZXdJZ25vcmVBdHRyaWJ1dGVQcmVmaXhlcykge1xuICAgIGlnbm9yZUF0dHJpYnV0ZVByZWZpeGVzID0gbmV3SWdub3JlQXR0cmlidXRlUHJlZml4ZXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlnbm9yZUF0dHJpYnV0ZVByZWZpeFxuICAgKi9cbiAgZnVuY3Rpb24gYWRkSWdub3JlQXR0cmlidXRlUHJlZml4KGlnbm9yZUF0dHJpYnV0ZVByZWZpeCkge1xuICAgIGlnbm9yZUF0dHJpYnV0ZVByZWZpeGVzLnB1c2goaWdub3JlQXR0cmlidXRlUHJlZml4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmV3U2VsZkxpbmtcbiAgICovXG4gIGZ1bmN0aW9uIHNldFNlbGZMaW5rKG5ld1NlbGZMaW5rKSB7XG4gICAgc2VsZkxpbmsgPSBuZXdTZWxmTGluaztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG5ld0ZvcmNlSlNPTlJlc291cmNlXG4gICAqL1xuICBmdW5jdGlvbiBzZXRGb3JjZUpTT05SZXNvdXJjZShuZXdGb3JjZUpTT05SZXNvdXJjZSkge1xuICAgIGZvcmNlSlNPTlJlc291cmNlID0gbmV3Rm9yY2VKU09OUmVzb3VyY2U7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtGdW5jdGlvbn1cbiAgICogQGRlcHJlY2F0ZWQgJGhhbENvbmZpZ3VyYXRpb25Qcm92aWRlci5zZXRVcmxUcmFuc2Zvcm1lciBpcyBkZXByZWNhdGVkLiBQbGVhc2Ugd3JpdGUgYSBodHRwIGludGVyY2VwdG9yIGluc3RlYWQuXG4gICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmFuZ3VsYXJqcy5vcmcvYXBpL25nL3NlcnZpY2UvJGh0dHAjaW50ZXJjZXB0b3JzXG4gICAqL1xuICBmdW5jdGlvbiBzZXRVcmxUcmFuc2Zvcm1lcihuZXdVcmxUcmFuc2Zvcm1lcikge1xuICAgIHVybFRyYW5zZm9ybWVyID0gbmV3VXJsVHJhbnNmb3JtZXI7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9XG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGZ1bmN0aW9uIG5vb3BVcmxUcmFuc2Zvcm1lcih1cmwpIHtcbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIGZ1bmN0aW9uICRnZXQoJGxvZykge1xuICAgIGlmKHVybFRyYW5zZm9ybWVyICE9PSBub29wVXJsVHJhbnNmb3JtZXIpIHtcbiAgICAgICRsb2cubG9nKCckaGFsQ29uZmlndXJhdGlvblByb3ZpZGVyLnNldFVybFRyYW5zZm9ybWVyIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB3cml0ZSBhIGh0dHAgaW50ZXJjZXB0b3IgaW5zdGVhZC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7XG4gICAgICBsaW5rc0F0dHJpYnV0ZTogbGlua3NBdHRyaWJ1dGUsXG4gICAgICBlbWJlZGRlZEF0dHJpYnV0ZTogZW1iZWRkZWRBdHRyaWJ1dGUsXG4gICAgICBpZ25vcmVBdHRyaWJ1dGVQcmVmaXhlczogaWdub3JlQXR0cmlidXRlUHJlZml4ZXMsXG4gICAgICBzZWxmTGluazogc2VsZkxpbmssXG4gICAgICBmb3JjZUpTT05SZXNvdXJjZTogZm9yY2VKU09OUmVzb3VyY2UsXG4gICAgICB1cmxUcmFuc2Zvcm1lcjogdXJsVHJhbnNmb3JtZXIsXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuSGFsQ29uZmlndXJhdGlvblByb3ZpZGVyLiRpbmplY3QgPSBbXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgTU9EVUxFX05BTUUgPSAnYW5ndWxhci1oYWwuY29uZmlndXJhdGlvbic7XG5cblxuXG5pbXBvcnQgSGFsQ29uZmlndXJhdGlvblByb3ZpZGVyIGZyb20gJy4vaGFsLWNvbmZpZ3VyYXRpb24ucHJvdmlkZXInO1xuXG4vLyBBZGQgbW9kdWxlIGZvciBjb25maWd1cmF0aW9uXG5hbmd1bGFyXG4gIC5tb2R1bGUoTU9EVUxFX05BTUUsIFtdKVxuXG4gIC5wcm92aWRlcignJGhhbENvbmZpZ3VyYXRpb24nLCBIYWxDb25maWd1cmF0aW9uUHJvdmlkZXIpXG47XG5cbmV4cG9ydCBkZWZhdWx0IE1PRFVMRV9OQU1FO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwYXJhbSB7SHR0cFByb3ZpZGVyfSAkaHR0cFByb3ZpZGVyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEh0dHBJbnRlcmNlcHRvckNvbmZpZ3VyYXRpb24oJGh0dHBQcm92aWRlcikge1xuICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdSZXNvdXJjZUh0dHBJbnRlcmNlcHRvcicpO1xufVxuXG4vLyBJbmplY3QgRGVwZW5kZW5jaWVzXG5IdHRwSW50ZXJjZXB0b3JDb25maWd1cmF0aW9uLiRpbmplY3QgPSBbXG4gICckaHR0cFByb3ZpZGVyJyxcbl07XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IE1PRFVMRV9OQU1FID0gJ2FuZ3VsYXItaGFsLmh0dHAtaW50ZXJjZXB0aW9uJztcblxuXG5pbXBvcnQgcmVzb3VyY2UgZnJvbSAnLi4vcmVzb3VyY2UnO1xuaW1wb3J0IGNvbmZpZ3VyYXRpb24gZnJvbSAnLi4vY29uZmlndXJhdGlvbic7XG5cbmltcG9ydCBSZXNvdXJjZUh0dHBJbnRlcmNlcHRvckZhY3RvcnkgZnJvbSAnLi9yZXNvdXJjZS1odHRwLWludGVyY2VwdG9yLmZhY3RvcnknO1xuaW1wb3J0IEh0dHBJbnRlcmNlcHRvckNvbmZpZ3VyYXRpb24gZnJvbSAnLi9odHRwLWludGVyY2VwdGlvbi5jb25maWcnO1xuaW1wb3J0IFJlc3BvbnNlVG9SZXNvdXJjZVRyYW5zZm9ybWVyRmFjdG9yeSBmcm9tICcuL3Jlc3BvbnNlLXRyYW5zZm9ybWVyLnNlcnZpY2UnO1xuXG4vLyBBZGQgbW9kdWxlIGZvciBodHRwIGludGVyY2VwdGlvblxuYW5ndWxhclxuICAubW9kdWxlKE1PRFVMRV9OQU1FLCBbXG4gICAgcmVzb3VyY2UsXG4gICAgY29uZmlndXJhdGlvbixcbiAgXSlcblxuICAuY29uZmlnKEh0dHBJbnRlcmNlcHRvckNvbmZpZ3VyYXRpb24pXG5cbiAgLmZhY3RvcnkoJ1Jlc291cmNlSHR0cEludGVyY2VwdG9yJywgUmVzb3VyY2VIdHRwSW50ZXJjZXB0b3JGYWN0b3J5KVxuICAuZmFjdG9yeSgnJHRyYW5zZm9ybVJlc3BvbnNlVG9SZXNvdXJjZScsIFJlc3BvbnNlVG9SZXNvdXJjZVRyYW5zZm9ybWVyRmFjdG9yeSlcbjtcblxuZXhwb3J0IGRlZmF1bHQgTU9EVUxFX05BTUU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IHBhcnNlIH0gZnJvbSAnY29udGVudC10eXBlJztcblxuLyoqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAkdHJhbnNmb3JtUmVzcG9uc2VUb1Jlc291cmNlXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJlc291cmNlSHR0cEludGVyY2VwdG9yRmFjdG9yeSgkdHJhbnNmb3JtUmVzcG9uc2VUb1Jlc291cmNlLCAkaGFsQ29uZmlndXJhdGlvbikge1xuICB2YXIgQ09OVEVOVF9UWVBFID0gJ2FwcGxpY2F0aW9uL2hhbCtqc29uJztcblxuICByZXR1cm4ge1xuICAgIHJlcXVlc3Q6IHRyYW5zZm9ybVJlcXVlc3QsXG4gICAgcmVzcG9uc2U6IHRyYW5zZm9ybVJlc3BvbnNlLFxuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgSGFsIEpzb24gQXMgYW4gYWNjZXB0ZWQgZm9ybWF0XG4gICAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICAgKi9cbiAgZnVuY3Rpb24gdHJhbnNmb3JtUmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgaWYodHlwZW9mIHJlcXVlc3QuaGVhZGVycy5BY2NlcHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXF1ZXN0LmhlYWRlcnMuQWNjZXB0ID0gQ09OVEVOVF9UWVBFO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0LmhlYWRlcnMuQWNjZXB0ID0gW1xuICAgICAgICBDT05URU5UX1RZUEUsXG4gICAgICAgIHJlcXVlc3QuaGVhZGVycy5BY2NlcHRcbiAgICAgIF0uam9pbignLCAnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVxdWVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm0gUmVzcG9uc2VcbiAgICpcbiAgICogQHBhcmFtIHtSZXNwb25zZX0gcmVzcG9uc2VcbiAgICogQHJldHVybiB7UmVzcG9uc2V8UmVzb3VyY2V9XG4gICAqL1xuICBmdW5jdGlvbiB0cmFuc2Zvcm1SZXNwb25zZShyZXNwb25zZSkge1xuICAgIHRyeSB7XG4gICAgICBpZihwYXJzZShyZXNwb25zZS5oZWFkZXJzKCdDb250ZW50LVR5cGUnKSkudHlwZSA9PT0gQ09OVEVOVF9UWVBFKSB7XG4gICAgICAgIHJldHVybiAkdHJhbnNmb3JtUmVzcG9uc2VUb1Jlc291cmNlKHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIC8vIFRoZSBwYXJzZSBmdW5jdGlvbiBjb3VsZCB0aHJvdyBhbiBlcnJvciwgd2UgZG8gbm90IHdhbnQgdGhhdC5cbiAgICB9XG4gICAgaWYocmVzcG9uc2UuY29uZmlnLmZvcmNlSGFsKSB7XG4gICAgICByZXR1cm4gJHRyYW5zZm9ybVJlc3BvbnNlVG9SZXNvdXJjZShyZXNwb25zZSk7XG4gICAgfVxuICAgIGlmKChcbiAgICAgICAgcmVzcG9uc2UuaGVhZGVycygnQ29udGVudC1UeXBlJykgPT09ICdhcHBsaWNhdGlvbi9qc29uJyB8fFxuICAgICAgICByZXNwb25zZS5oZWFkZXJzKCdDb250ZW50LVR5cGUnKSA9PT0gbnVsbFxuICAgICAgKSAmJlxuICAgICAgJGhhbENvbmZpZ3VyYXRpb24uZm9yY2VKU09OUmVzb3VyY2UpIHtcbiAgICAgIHJldHVybiAkdHJhbnNmb3JtUmVzcG9uc2VUb1Jlc291cmNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuUmVzb3VyY2VIdHRwSW50ZXJjZXB0b3JGYWN0b3J5LiRpbmplY3QgPSBbXG4gICckdHJhbnNmb3JtUmVzcG9uc2VUb1Jlc291cmNlJyxcbiAgJyRoYWxDb25maWd1cmF0aW9uJyxcbl07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gUmVzb3VyY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUmVzcG9uc2VUb1Jlc291cmNlVHJhbnNmb3JtZXJGYWN0b3J5KFJlc291cmNlKSB7XG4gIHJldHVybiB0cmFuc2Zvcm07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UmVzcG9uc2V9XG4gICAqIEByZXR1cm4ge1Jlc291cmNlfVxuICAgKi9cbiAgZnVuY3Rpb24gdHJhbnNmb3JtKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNvdXJjZShyZXNwb25zZS5kYXRhLCByZXNwb25zZSk7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuUmVzcG9uc2VUb1Jlc291cmNlVHJhbnNmb3JtZXJGYWN0b3J5LiRpbmplY3QgPSBbXG4gICdSZXNvdXJjZScsXG5dO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBNT0RVTEVfTkFNRSA9ICdhbmd1bGFyLWhhbCc7XG5cbmltcG9ydCB1cmxHZW5lcmF0b3IgZnJvbSAnLi91cmwtZ2VuZXJhdG9yJztcbmltcG9ydCBodHRwSW50ZXJjZXB0aW9uIGZyb20gJy4vaHR0cC1pbnRlcmNlcHRpb24nO1xuaW1wb3J0IGNsaWVudCBmcm9tICcuL2NsaWVudCc7XG5cbi8vIENvbWJpbmUgbmVlZGVkIE1vZHVsZXNcbmFuZ3VsYXJcbiAgLm1vZHVsZShNT0RVTEVfTkFNRSwgW1xuICAgIHVybEdlbmVyYXRvcixcbiAgICBodHRwSW50ZXJjZXB0aW9uLFxuICAgIGNsaWVudCxcbiAgICAnbmcnLFxuICBdKVxuO1xuXG5leHBvcnQgZGVmYXVsdCBNT0RVTEVfTkFNRTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBGYWN0b3J5IGZvciBIYWxSZXNvdXJjZUNsaWVudFxuICogQHBhcmFtIHtRfSAgICAgICAgJHFcbiAqIEBwYXJhbSB7RnVuY3Rpb259ICRleHRlbmRSZWFkT25seVxuICogQHBhcmFtIHtJbmplY3Rvcn0gJGluamVjdG9yIFByZXZlbnQgQ2lyY3VsYXIgRGVwZW5kZW5jeSBieSBpbmplY3RpbmcgJGluamVjdG9yIGluc3RlYWQgb2YgJGh0dHBcbiAqIEBwYXJhbSB7T2JqZWN0fSAgICRoYWxDb25maWd1cmF0aW9uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEhhbFJlc291cmNlQ2xpZW50RmFjdG9yeSgkcSwgJGV4dGVuZFJlYWRPbmx5LCAkaW5qZWN0b3IsICRoYWxDb25maWd1cmF0aW9uKSB7XG4gIHJldHVybiBIYWxSZXNvdXJjZUNsaWVudDtcblxuICAvKipcbiAgICogQHBhcmFtIHtSZXNvdXJjZX0gcmVzb3VyY2VcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgbGlua3NcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgZW1iZWRkZWRcbiAgICovXG4gIGZ1bmN0aW9uIEhhbFJlc291cmNlQ2xpZW50KHJlc291cmNlLCBlbWJlZGRlZCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgLCAkaHR0cCA9ICRpbmplY3Rvci5nZXQoJyRodHRwJyk7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIHRoZSBjbGllbnRcbiAgICAgKi9cbiAgICAoZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICRleHRlbmRSZWFkT25seShzZWxmLCB7XG4gICAgICAgICRyZXF1ZXN0OiAkcmVxdWVzdCxcbiAgICAgICAgJGdldDogJGdldCxcbiAgICAgICAgJHBvc3Q6ICRwb3N0LFxuICAgICAgICAkcHV0OiAkcHV0LFxuICAgICAgICAkcGF0Y2g6ICRwYXRjaCxcbiAgICAgICAgJGRlbGV0ZTogJGRlbGV0ZSxcbiAgICAgICAgJGRlbDogJGRlbGV0ZSxcbiAgICAgICAgJGxpbms6ICRsaW5rLFxuICAgICAgICAkdW5saW5rOiAkdW5saW5rLFxuICAgICAgfSk7XG4gICAgfSkoKTtcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBIVFRQIHJlcXVlc3QgYWdhaW5zdCBhIGxpbmtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgICAgIG1ldGhvZFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgICAgIHJlbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fG51bGx9IHVybFBhcmFtc1xuICAgICAqIEBwYXJhbSB7bWl4ZWR8bnVsbH0gIGJvZHlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkcmVxdWVzdChtZXRob2QsIHJlbCwgdXJsUGFyYW1zLCBib2R5LCBvcHRpb25zKSB7XG4gICAgICB2YXIgcHJvbWlzZXM7XG5cbiAgICAgIG1ldGhvZCA9IG1ldGhvZCB8fCAnR0VUJztcbiAgICAgIHJlbCA9IHJlbCB8fCAkaGFsQ29uZmlndXJhdGlvbi5zZWxmTGluaztcbiAgICAgIHVybFBhcmFtcyA9IHVybFBhcmFtcyB8fCB7fTtcbiAgICAgIGJvZHkgPSBib2R5IHx8IG51bGw7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgaWYobWV0aG9kID09PSAnR0VUJyAmJlxuICAgICAgICAgIHJlbCA9PT0gJGhhbENvbmZpZ3VyYXRpb24uc2VsZkxpbmspIHtcbiAgICAgICAgcmV0dXJuICRxLnJlc29sdmUocmVzb3VyY2UpO1xuICAgICAgfVxuXG4gICAgICBpZihyZXNvdXJjZS4kaGFzRW1iZWRkZWQocmVsKSAmJlxuICAgICAgICBBcnJheS5pc0FycmF5KGVtYmVkZGVkW3JlbF0pKSB7XG4gICAgICAgIHByb21pc2VzID0gW107XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBlbWJlZGRlZFtyZWxdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgcHJvbWlzZXMucHVzaChlbWJlZGRlZFtyZWxdW2ldLiRyZXF1ZXN0KCkuJHJlcXVlc3QobWV0aG9kLCAnc2VsZicsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkcS5hbGwocHJvbWlzZXMpO1xuICAgICAgfVxuXG4gICAgICBpZihyZXNvdXJjZS4kaGFzRW1iZWRkZWQocmVsKSkge1xuICAgICAgICByZXR1cm4gZW1iZWRkZWRbcmVsXS4kcmVxdWVzdCgpLiRyZXF1ZXN0KG1ldGhvZCwgJ3NlbGYnLCB1cmxQYXJhbXMsIGJvZHksIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZihyZXNvdXJjZS4kaGFzTGluayhyZWwpKSB7XG4gICAgICAgIHZhciB1cmwgPSByZXNvdXJjZS4kaHJlZihyZWwsIHVybFBhcmFtcyk7XG5cbiAgICAgICAgYW5ndWxhci5leHRlbmQob3B0aW9ucywge1xuICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgIGRhdGE6IGJvZHksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkodXJsKSkge1xuICAgICAgICAgIHByb21pc2VzID0gW107XG4gICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHVybC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgcHJvbWlzZXMucHVzaCgkaHR0cChhbmd1bGFyLmV4dGVuZCh7fSwgb3B0aW9ucywge3VybDogdXJsW2pdfSkpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICRxLmFsbChwcm9taXNlcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJGh0dHAoYW5ndWxhci5leHRlbmQoe30sIG9wdGlvbnMsIHtcbiAgICAgICAgICB1cmw6IHJlc291cmNlLiRocmVmKHJlbCwgdXJsUGFyYW1zKSxcbiAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJHEucmVqZWN0KG5ldyBFcnJvcignbGluayBcIicgKyByZWwgKyAnXCIgaXMgdW5kZWZpbmVkJykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBIVFRQIEdFVCByZXF1ZXN0IGFnYWluc3QgYSBsaW5rIG9yXG4gICAgICogbG9hZCBhbiBlbWJlZGRlZCByZXNvdXJjZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGdldChyZWwsIHVybFBhcmFtcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KCdHRVQnLCByZWwsIHVybFBhcmFtcywgdW5kZWZpbmVkLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgSFRUUCBQT1NUIHJlcXVlc3QgYWdhaW5zdCBhIGxpbmtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgICAgIHJlbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fG51bGx9IHVybFBhcmFtc1xuICAgICAqIEBwYXJhbSB7bWl4ZWR8bnVsbH0gIGJvZHlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkcG9zdChyZWwsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KCdQT1NUJywgcmVsLCB1cmxQYXJhbXMsIGJvZHksIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYSBIVFRQIFBVVCByZXF1ZXN0IGFnYWluc3QgYSBsaW5rXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gICAgICByZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxudWxsfSB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0ge21peGVkfG51bGx9ICBib2R5XG4gICAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJHB1dChyZWwsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KCdQVVQnLCByZWwsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXhlY3V0ZSBhIEhUVFAgUEFUQ0ggcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHttaXhlZHxudWxsfSAgYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRwYXRjaChyZWwsIHVybFBhcmFtcywgYm9keSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KCdQQVRDSCcsIHJlbCwgdXJsUGFyYW1zLCBib2R5LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgSFRUUCBERUxFRVQgcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgcmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R8bnVsbH0gdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGRlbGV0ZShyZWwsIHVybFBhcmFtcywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KCdERUxFVEUnLCByZWwsIHVybFBhcmFtcywgdW5kZWZpbmVkLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgSFRUUCBMSU5LIHJlcXVlc3QgYWdhaW5zdCBhIGxpbmtcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgICAgICByZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxudWxsfSAgdXJsUGFyYW1zXG4gICAgICogQHBhcmFtIHtMaW5rSGVhZGVyW119IGJvZHlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGxpbmsocmVsLCB1cmxQYXJhbXMsIGxpbmtzLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgIG9wdGlvbnMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyB8fCB7fTtcbiAgICAgIG9wdGlvbnMuaGVhZGVycy5MaW5rID0gbGlua3MubWFwKHRvU3RyaW5nSXRlbSk7XG4gICAgICByZXR1cm4gJHJlcXVlc3QoJ0xJTksnLCByZWwsIHVybFBhcmFtcywgdW5kZWZpbmVkLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIGEgSFRUUCBVTkxJTksgcmVxdWVzdCBhZ2FpbnN0IGEgbGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgIHJlbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fG51bGx9ICB1cmxQYXJhbXNcbiAgICAgKiBAcGFyYW0ge0xpbmtIZWFkZXJbXX0gYm9keVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICBvcHRpb25zXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkdW5saW5rKHJlbCwgdXJsUGFyYW1zLCBsaW5rcywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICBvcHRpb25zLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge307XG4gICAgICBvcHRpb25zLmhlYWRlcnMuTGluayA9IGxpbmtzLm1hcCh0b1N0cmluZ0l0ZW0pO1xuICAgICAgcmV0dXJuICRyZXF1ZXN0KCdVTkxJTksnLCByZWwsIHVybFBhcmFtcywgdW5kZWZpbmVkLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge21peGVkfSBpdGVtXG4gICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvU3RyaW5nSXRlbShpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS50b1N0cmluZygpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBJbmplY3QgRGVwZW5kZW5jaWVzXG5IYWxSZXNvdXJjZUNsaWVudEZhY3RvcnkuJGluamVjdCA9IFtcbiAgJyRxJyxcbiAgJyRleHRlbmRSZWFkT25seScsXG4gICckaW5qZWN0b3InLFxuICAnJGhhbENvbmZpZ3VyYXRpb24nLFxuXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgTU9EVUxFX05BTUUgPSAnYW5ndWxhci1oYWwucmVzb3VyY2UnO1xuXG5cbmltcG9ydCB1dGlsaXR5IGZyb20gJy4uL3V0aWxpdHknO1xuaW1wb3J0IGNvbmZpZ3VyYXRpb24gZnJvbSAnLi4vY29uZmlndXJhdGlvbic7XG5cbmltcG9ydCBSZXNvdXJjZUZhY3RvcnkgZnJvbSAnLi9yZXNvdXJjZS5mYWN0b3J5JztcbmltcG9ydCBIYWxSZXNvdXJjZUNsaWVudEZhY3RvcnkgZnJvbSAnLi9oYWwtcmVzb3VyY2UtY2xpZW50LmZhY3RvcnknO1xuXG4vLyBBZGQgbW9kdWxlIGZvciByZXNvdXJjZVxuYW5ndWxhclxuICAubW9kdWxlKE1PRFVMRV9OQU1FLCBbXG4gICAgdXRpbGl0eSxcbiAgICBjb25maWd1cmF0aW9uLFxuICBdKVxuXG4gIC5mYWN0b3J5KCdSZXNvdXJjZScsIFJlc291cmNlRmFjdG9yeSlcblxuICAuZmFjdG9yeSgnSGFsUmVzb3VyY2VDbGllbnQnLCBIYWxSZXNvdXJjZUNsaWVudEZhY3RvcnkpXG47XG5cbmV4cG9ydCBkZWZhdWx0IE1PRFVMRV9OQU1FO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBJbmplY3QgRGVwZW5kZW5jaWVzXG5SZXNvdXJjZUZhY3RvcnkuJGluamVjdCA9IFtcbiAgJ0hhbFJlc291cmNlQ2xpZW50JyxcbiAgJyRnZW5lcmF0ZVVybCcsXG4gICckZXh0ZW5kUmVhZE9ubHknLFxuICAnJGRlZmluZVJlYWRPbmx5JyxcbiAgJyRub3JtYWxpemVMaW5rJyxcbiAgJyRoYWxDb25maWd1cmF0aW9uJyxcbl07XG5cbi8qKlxuICogRmFjdG9yeSBmb3IgUmVzb3VyY2VcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBIYWxSZXNvdXJjZUNsaWVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gJGdlbmVyYXRlVXJsXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSAkZXh0ZW5kUmVhZE9ubHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259ICRkZWZpbmVSZWFkT25seVxuICogQHBhcmFtIHtGdW5jdGlvbn0gJG5vcm1hbGl6ZUxpbmtcbiAqIEBwYXJhbSB7T2JqZWN0fSAgICRoYWxDb25maWd1cmF0aW9uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJlc291cmNlRmFjdG9yeShcbiAgSGFsUmVzb3VyY2VDbGllbnQsXG4gICRnZW5lcmF0ZVVybCxcbiAgJGV4dGVuZFJlYWRPbmx5LFxuICAkZGVmaW5lUmVhZE9ubHksXG4gICRub3JtYWxpemVMaW5rLFxuICAkaGFsQ29uZmlndXJhdGlvblxuKSB7XG4gIHJldHVybiBSZXNvdXJjZTtcblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlXG4gICAqL1xuICBmdW5jdGlvbiBSZXNvdXJjZShkYXRhLCByZXNwb25zZSkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgLCBsaW5rcyA9IHt9XG4gICAgICAsIGVtYmVkZGVkID0ge31cbiAgICAgICwgY2xpZW50O1xuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSB0aGUgUmVzb3VyY2VcbiAgICAgKi9cbiAgICAoZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIGlmKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JyB8fFxuICAgICAgICBkYXRhID09PSBudWxsKSB7XG4gICAgICAgIGRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIGluaXRpYWxpemVEYXRhKCk7XG4gICAgICBpbml0aWFsaXplRW1iZWRkZWQoKTtcbiAgICAgIGluaXRpYWxpemVMaW5rcygpO1xuICAgICAgaW5pdGl0YWxpemVDbGllbnQoKTtcblxuICAgICAgJGV4dGVuZFJlYWRPbmx5KHNlbGYsIHtcbiAgICAgICAgJGhhc0xpbms6ICRoYXNMaW5rLFxuICAgICAgICAkaGFzRW1iZWRkZWQ6ICRoYXNFbWJlZGRlZCxcbiAgICAgICAgJGhhczogJGhhcyxcbiAgICAgICAgJGhyZWY6ICRocmVmLFxuICAgICAgICAkbWV0YTogJG1ldGEsXG4gICAgICAgICRsaW5rOiAkbGluayxcbiAgICAgICAgJHJlcXVlc3Q6ICRyZXF1ZXN0LFxuICAgICAgICAkcmVzcG9uc2U6ICRyZXNwb25zZSxcbiAgICAgIH0pO1xuICAgIH0pKCk7XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYWxsIGRhdGEgZnJvbSBkYXRhIHRvIGl0c2VsZlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluaXRpYWxpemVEYXRhKCkge1xuICAgICAgZm9yKHZhciBwcm9wZXJ0eU5hbWUgaW4gZGF0YSkge1xuICAgICAgICBpZighZGF0YS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaXNNZXRhUHJvcGVydHkocHJvcGVydHlOYW1lKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgICRkZWZpbmVSZWFkT25seShzZWxmLCBwcm9wZXJ0eU5hbWUsIGRhdGFbcHJvcGVydHlOYW1lXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXplIGFsbCBMaW5rc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluaXRpYWxpemVMaW5rcygpIHtcbiAgICAgIGlmKHR5cGVvZiBkYXRhWyRoYWxDb25maWd1cmF0aW9uLmxpbmtzQXR0cmlidXRlXSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBPYmplY3RcbiAgICAgICAgLmtleXMoZGF0YVskaGFsQ29uZmlndXJhdGlvbi5saW5rc0F0dHJpYnV0ZV0pXG4gICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHJlbCkge1xuICAgICAgICAgIHZhciBsaW5rID0gZGF0YVskaGFsQ29uZmlndXJhdGlvbi5saW5rc0F0dHJpYnV0ZV1bcmVsXTtcbiAgICAgICAgICBsaW5rc1tyZWxdID0gJG5vcm1hbGl6ZUxpbmsocmVzcG9uc2UuY29uZmlnLnVybCwgbGluayk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZSBFbWJlZGRlZCBDb250ZW50c1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGluaXRpYWxpemVFbWJlZGRlZCgpIHtcbiAgICAgIGlmKHR5cGVvZiBkYXRhWyRoYWxDb25maWd1cmF0aW9uLmVtYmVkZGVkQXR0cmlidXRlXSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBPYmplY3RcbiAgICAgICAgLmtleXMoZGF0YVskaGFsQ29uZmlndXJhdGlvbi5lbWJlZGRlZEF0dHJpYnV0ZV0pXG4gICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHJlbCkge1xuICAgICAgICAgIGVtYmVkUmVzb3VyY2UocmVsLCBkYXRhWyRoYWxDb25maWd1cmF0aW9uLmVtYmVkZGVkQXR0cmlidXRlXVtyZWxdKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSB0aGUgSFRUUCBDTElFTlRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpbml0aXRhbGl6ZUNsaWVudCgpIHtcbiAgICAgIGNsaWVudCA9IG5ldyBIYWxSZXNvdXJjZUNsaWVudChzZWxmLCBlbWJlZGRlZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW1iZWQgYSByZXNvdXJjZShzKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgICAgICAgIHJlbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fE9iamVjdFtdfSByZXNvdXJjZXNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbWJlZFJlc291cmNlKHJlbCwgcmVzb3VyY2VzKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXNvdXJjZXMpKSB7XG4gICAgICAgIGVtYmVkZGVkW3JlbF0gPSBbXTtcbiAgICAgICAgcmVzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKHJlc291cmNlKSB7XG4gICAgICAgICAgZW1iZWRkZWRbcmVsXS5wdXNoKG5ldyBSZXNvdXJjZShyZXNvdXJjZSwgcmVzcG9uc2UpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGVtYmVkZGVkW3JlbF0gPSBuZXcgUmVzb3VyY2UocmVzb3VyY2VzLCByZXNwb25zZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIGlmIGEgcHJvcGVydHkgbmFtZSBpcyBhIG1ldGEgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlOYW1lXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc01ldGFQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCAkaGFsQ29uZmlndXJhdGlvbi5pZ25vcmVBdHRyaWJ1dGVQcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZihwcm9wZXJ0eU5hbWUuc3Vic3RyKDAsIDEpID09PSAkaGFsQ29uZmlndXJhdGlvbi5pZ25vcmVBdHRyaWJ1dGVQcmVmaXhlc1tpXSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHByb3BlcnR5TmFtZSA9PT0gJGhhbENvbmZpZ3VyYXRpb24ubGlua3NBdHRyaWJ1dGUgfHxcbiAgICAgICAgICBwcm9wZXJ0eU5hbWUgPT09ICRoYWxDb25maWd1cmF0aW9uLmVtYmVkZGVkQXR0cmlidXRlKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVsXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkaGFzTGluayhyZWwpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgbGlua3NbcmVsXSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gJGhhc0VtYmVkZGVkKHJlbCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiBlbWJlZGRlZFtyZWxdICE9PSAndW5kZWZpbmVkJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVsXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkaGFzKHJlbCkge1xuICAgICAgcmV0dXJuICRoYXNMaW5rKHJlbCkgfHwgJGhhc0VtYmVkZGVkKHJlbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBocmVmIG9mIGEgTGlua1xuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzXG4gICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRocmVmKHJlbCwgcGFyYW1ldGVycykge1xuICAgICAgaWYoISRoYXNMaW5rKHJlbCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdsaW5rIFwiJyArIHJlbCArICdcIiBpcyB1bmRlZmluZWQnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGxpbmsgPSBsaW5rc1tyZWxdXG4gICAgICAgICwgaHJlZiA9IGxpbmsuaHJlZjtcblxuICAgICAgaWYoQXJyYXkuaXNBcnJheShsaW5rKSkge1xuICAgICAgICBocmVmID0gW107XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsaW5rLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHN1YkxpbmsgPSBsaW5rW2ldXG4gICAgICAgICAgICAsIHN1YkhyZWYgPSBzdWJMaW5rLmhyZWY7XG4gICAgICAgICAgaWYodHlwZW9mIHN1YkxpbmsudGVtcGxhdGVkICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgc3ViTGluay50ZW1wbGF0ZWQpIHtcbiAgICAgICAgICAgIHN1YkhyZWYgPSAkZ2VuZXJhdGVVcmwoc3ViTGluay5ocmVmLCBwYXJhbWV0ZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3ViSHJlZiA9ICRoYWxDb25maWd1cmF0aW9uLnVybFRyYW5zZm9ybWVyKHN1YkhyZWYpO1xuICAgICAgICAgIGhyZWYucHVzaChzdWJIcmVmKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYodHlwZW9mIGxpbmsudGVtcGxhdGVkICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgIGxpbmsudGVtcGxhdGVkKSB7XG4gICAgICAgICAgaHJlZiA9ICRnZW5lcmF0ZVVybChsaW5rLmhyZWYsIHBhcmFtZXRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaHJlZiA9ICRoYWxDb25maWd1cmF0aW9uLnVybFRyYW5zZm9ybWVyKGhyZWYpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaHJlZjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBsaW5rXG4gICAgICpcbiAgICAgKiAhISBUbyBnZXQgYSBocmVmLCB1c2UgJGhyZWYgaW5zdGVhZCAhIVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkbGluayhyZWwpIHtcbiAgICAgIGlmKCEkaGFzTGluayhyZWwpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbGluayBcIicgKyByZWwgKyAnXCIgaXMgdW5kZWZpbmVkJyk7XG4gICAgICB9XG4gICAgICB2YXIgbGluayA9IGxpbmtzW3JlbF07XG4gICAgICByZXR1cm4gbGluaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgbWV0YSBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiAhISBUbyBnZXQgYSBocmVmLCB1c2UgJGhyZWYgaW5zdGVhZCAhIVxuICAgICAqICEhIFRvIGdldCBhIGxpbmssIHVzZSAkbGluayBpbnN0ZWFkICEhXG4gICAgICogISEgVG8gZ2V0IGFuIGVtYmVkZGVkIHJlc291cmNlLCB1c2UgJHJlcXVlc3QoKS4kZ2V0KHJlbCkgaW5zdGVhZCAhIVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJlbFxuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkbWV0YShuYW1lKSB7XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgJGhhbENvbmZpZ3VyYXRpb24uaWdub3JlQXR0cmlidXRlUHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGZ1bGxOYW1lID0gJGhhbENvbmZpZ3VyYXRpb24uaWdub3JlQXR0cmlidXRlUHJlZml4ZXNbaV0gKyBuYW1lO1xuICAgICAgICByZXR1cm4gZGF0YVtmdWxsTmFtZV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBPcmlnaW5hbCBSZXNwb25zZVxuICAgICAqXG4gICAgICogQHJldHVybiB7T2JqZWN0KX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiAkcmVzcG9uc2UoKSB7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjbGllbnQgdG8gcGVyZm9ybSByZXF1ZXN0c1xuICAgICAqXG4gICAgICogQHJldHVybiB7SGFsUmVzb3VyY2VDbGllbnQpfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uICRyZXF1ZXN0KCkge1xuICAgICAgcmV0dXJuIGNsaWVudDtcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgTU9EVUxFX05BTUUgPSAnYW5ndWxhci1oYWwudXJsLWdlbmVyYXRvcic7XG5cblxuXG5pbXBvcnQgVXJsR2VuZXJhdG9yRmFjdG9yeSBmcm9tICcuL3VybC1nZW5lcmF0b3Iuc2VydmljZSc7XG5cbi8vIEFkZCBtb2R1bGUgZm9yIHVybCBnZW5lcmF0b3JcbmFuZ3VsYXJcbiAgLm1vZHVsZShNT0RVTEVfTkFNRSwgW10pXG5cbiAgLmZhY3RvcnkoJyRnZW5lcmF0ZVVybCcsIFVybEdlbmVyYXRvckZhY3RvcnkpXG47XG5cbmV4cG9ydCBkZWZhdWx0IE1PRFVMRV9OQU1FO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgcmZjNjU3MCBmcm9tICdyZmM2NTcwL3NyYy9tYWluJztcblxuLyoqXG4gKiBGYWN0b3J5IGZvciBVUkwgR2VuZXJhdG9yXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFVybEdlbmVyYXRvckZhY3RvcnkoKSB7XG4gIHJldHVybiBnZW5lcmF0ZTtcblxuICAvKipcbiAgICogR2VuZXJhdGUgdXJsIGZyb20gdGVtcGxhdGVcbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSB0ZW1wbGF0ZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHBhcmFtZXRlcnNcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZnVuY3Rpb24gZ2VuZXJhdGUodGVtcGxhdGUsIHBhcmFtZXRlcnMpIHtcbiAgICByZXR1cm4gbmV3IHJmYzY1NzAuVXJpVGVtcGxhdGUodGVtcGxhdGUpLnN0cmluZ2lmeShwYXJhbWV0ZXJzKTtcbiAgfVxufVxuXG4vLyBJbmplY3QgRGVwZW5kZW5jaWVzXG5VcmxHZW5lcmF0b3JGYWN0b3J5LiRpbmplY3QgPSBbXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBGYWN0b3J5IGZvciBEZWZpbmUgUmVhZCBPbmx5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERlZmluZVJlYWRPbmx5RmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmluZVJlYWRPbmx5O1xuXG4gIC8qKlxuICAgKiBEZWZpbmUgcmVhZC1vbmx5IHByb3BlcnR5IGluIHRhcmdldFxuICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAgICogQHBhcmFtIHttaXhlZH0gIHZhbHVlXG4gICAqL1xuICBmdW5jdGlvbiBkZWZpbmVSZWFkT25seSh0YXJnZXQsIGtleSwgdmFsdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuRGVmaW5lUmVhZE9ubHlGYWN0b3J5LiRpbmplY3QgPSBbXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBGYWN0b3J5IGZvciBFeHRlbmQgUmVhZCBPbmx5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEV4dGVuZFJlYWRPbmx5RmFjdG9yeSgpIHtcbiAgcmV0dXJuIGV4dGVuZFJlYWRPbmx5O1xuXG4gIC8qKlxuICAgKiBFeHRlbmQgcHJvcGVydGllcyBmcm9tIGNvcHkgcmVhZC1vbmx5IHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb3B5XG4gICAqL1xuICBmdW5jdGlvbiBleHRlbmRSZWFkT25seSh0YXJnZXQsIGNvcHkpIHtcbiAgICBmb3IodmFyIGtleSBpbiBjb3B5KSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBjb3B5W2tleV0sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuRXh0ZW5kUmVhZE9ubHlGYWN0b3J5LiRpbmplY3QgPSBbXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgTU9EVUxFX05BTUUgPSAnYW5ndWxhci1oYWwudXRpbGl0eSc7XG5cbmltcG9ydCBEZWZpbmVSZWFkT25seUZhY3RvcnkgZnJvbSAnLi9kZWZpbmUtcmVhZC1vbmx5LmZhY3RvcnknO1xuaW1wb3J0IEV4dGVuZFJlYWRPbmx5RmFjdG9yeSBmcm9tICcuL2V4dGVuZC1yZWFkLW9ubHkuZmFjdG9yeSc7XG5pbXBvcnQgTm9ybWFsaXplTGlua0ZhY3RvcnkgZnJvbSAnLi9ub3JtYWxpemUtbGluay5mYWN0b3J5JztcbmltcG9ydCBSZXNvbHZlVXJsRmFjdG9yeSBmcm9tICcuL3Jlc29sdmUtdXJsLmZhY3RvcnknO1xuXG4vLyBBZGQgbmV3IG1vZHVsZSBmb3IgdXRpbGl0aWVzXG5hbmd1bGFyXG4gIC5tb2R1bGUoTU9EVUxFX05BTUUsIFtdKVxuXG4gIC5mYWN0b3J5KCckZGVmaW5lUmVhZE9ubHknLCBEZWZpbmVSZWFkT25seUZhY3RvcnkpXG4gIC5mYWN0b3J5KCckZXh0ZW5kUmVhZE9ubHknLCBFeHRlbmRSZWFkT25seUZhY3RvcnkpXG4gIC5mYWN0b3J5KCckbm9ybWFsaXplTGluaycsIE5vcm1hbGl6ZUxpbmtGYWN0b3J5KVxuICAuZmFjdG9yeSgnJHJlc29sdmVVcmwnLCBSZXNvbHZlVXJsRmFjdG9yeSlcbjtcblxuZXhwb3J0IGRlZmF1bHQgTU9EVUxFX05BTUU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRmFjdG9yeSBmb3IgTGluayBOb3JtYWxpemVyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIE5vcm1hbGl6ZUxpbmtGYWN0b3J5KCRyZXNvbHZlVXJsKSB7XG4gIHJldHVybiBub3JtYWxpemVMaW5rO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYmFzZVVybFxuICAgKiBAcGFyYW0ge21peGVkfSAgbGlua1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBmdW5jdGlvbiBub3JtYWxpemVMaW5rKGJhc2VVcmwsIGxpbmspIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShsaW5rKSkge1xuICAgICAgcmV0dXJuIGxpbmsubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVMaW5rKGJhc2VVcmwsIGl0ZW0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmKHR5cGVvZiBsaW5rID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaHJlZjogJHJlc29sdmVVcmwoYmFzZVVybCwgbGluayksXG4gICAgICB9O1xuICAgIH1cbiAgICBpZih0eXBlb2YgbGluay5ocmVmID09PSAnc3RyaW5nJykge1xuICAgICAgbGluay5ocmVmID0gJHJlc29sdmVVcmwoYmFzZVVybCwgbGluay5ocmVmKTtcbiAgICAgIHJldHVybiBsaW5rO1xuICAgIH1cbiAgICBpZihBcnJheS5pc0FycmF5KGxpbmsuaHJlZikpIHtcbiAgICAgIHJldHVybiBsaW5rLmhyZWYubWFwKGZ1bmN0aW9uIChocmVmKSB7XG4gICAgICAgIHZhciBuZXdMaW5rID0gYW5ndWxhci5leHRlbmQoe30sIGxpbmssIHtcbiAgICAgICAgICBocmVmOiBocmVmLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZUxpbmsoYmFzZVVybCwgbmV3TGluayk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGhyZWY6IGJhc2VVcmwsXG4gICAgfTtcbiAgfVxufVxuXG4vLyBJbmplY3QgRGVwZW5kZW5jaWVzXG5Ob3JtYWxpemVMaW5rRmFjdG9yeS4kaW5qZWN0ID0gW1xuICAnJHJlc29sdmVVcmwnLFxuXTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBGYWN0b3J5IGZvciBVcmwgUmVzb2x2ZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUmVzb2x2ZVVybEZhY3RvcnkoKSB7XG4gIHJldHVybiByZXNvbHZlVXJsO1xuXG4gIC8qKlxuICAgKiBSZXNvbHZlIHdob2xlIFVSTFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYmFzZVVybFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBmdW5jdGlvbiByZXNvbHZlVXJsKGJhc2VVcmwsIHBhdGgpIHtcbiAgICB2YXIgcmVzdWx0SHJlZiA9ICcnXG4gICAgICAsIHJlRnVsbFVybCA9IC9eKCg/OlxcdytcXDopPykoKD86XFwvXFwvKT8pKFteXFwvXSopKCg/OlxcLy4qKT8pJC9cbiAgICAgICwgYmFzZUhyZWZNYXRjaCA9IHJlRnVsbFVybC5leGVjKGJhc2VVcmwpXG4gICAgICAsIGhyZWZNYXRjaCA9IHJlRnVsbFVybC5leGVjKHBhdGgpO1xuXG4gICAgZm9yICh2YXIgcGFydEluZGV4ID0gMTsgcGFydEluZGV4IDwgNTsgcGFydEluZGV4KyspIHtcbiAgICAgIGlmIChocmVmTWF0Y2hbcGFydEluZGV4XSkge1xuICAgICAgICByZXN1bHRIcmVmICs9IGhyZWZNYXRjaFtwYXJ0SW5kZXhdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0SHJlZiArPSBiYXNlSHJlZk1hdGNoW3BhcnRJbmRleF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdEhyZWY7XG4gIH1cbn1cblxuLy8gSW5qZWN0IERlcGVuZGVuY2llc1xuUmVzb2x2ZVVybEZhY3RvcnkuJGluamVjdCA9IFtdO1xuIl19
