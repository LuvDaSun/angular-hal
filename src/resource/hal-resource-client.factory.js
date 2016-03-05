(function(
  module,
  merge,
  extend
) {
  'use strict';

  // Add factory for HalResourceClient
  module.factory('HalResourceClient', HalResourceClientFactory);

  // Inject Dependencies
  HalResourceClientFactory.$inject = [
    '$q',
    '$extendReadOnly',
    '$injector',
    '$halConfiguration',
  ];

  /**
   * Factory for HalResourceClient
   * @param {Q}        $q
   * @param {Function} $extendReadOnly
   * @param {Injector} $injector Prevent Circular Dependency by injecting $injector instead of $http
   * @param {Object}   $halConfiguration
   */
  function HalResourceClientFactory($q, $extendReadOnly, $injector, $halConfiguration) {
    return HalResourceClient;

    /**
     * @param {Resource} resource
     * @param {Object}   links
     * @param {Object}   embedded
     */
    function HalResourceClient(resource, embedded) {
      var self = this
        , $http = $injector.get('$http');

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
          $unlink: $unlink,
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

        if(method === 'GET' &&
            rel === $halConfiguration.selfLink) {
          return $q.resolve(resource);
        }

        if(resource.$hasEmbedded(rel) &&
          Array.isArray(embedded[rel])) {
          promises = [];
          for(var i = 0; i < embedded[rel].length; i++) {
            promises.push(embedded[rel][i].$request().$request(method, 'self', urlParams, body, options));
          }
          return $q.all(promises);
        }

        if(resource.$hasEmbedded(rel)) {
          return embedded[rel].$request().$request(method, 'self', urlParams, body, options);
        }

        if(resource.$hasLink(rel)) {
          var url = resource.$href(rel, urlParams);

          extend(options, {
            method: method,
            data: body,
          });

          if(Array.isArray(url)) {
            promises = [];
            for(var j = 0; j < url.length; j++) {
              promises.push($http(merge(options, {url: url[j]})));
            }
            return $q.all(promises);
          }

          return $http(merge(options, {
            url: resource.$href(rel, urlParams),
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
})(
  angular.module('angular-hal.resource'),
  angular.merge,
  angular.extend
);
