'use strict';

/**
 * @param {Log}      $log
 * @param {Http}     $http
 * @param {Function} LinkHeader
 * @param {Object}   $halConfiguration
 * @deprecated The halClient service is deprecated. Please use $http directly instead.
 */
export default function HalClientService($log, $http, LinkHeader, $halConfiguration) {
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
        LinkHeader: LinkHeader,
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
    options.headers.Link = linkHeaders.map(function(link) { return link.toString(); });
    return $request('LINK', href, options);
  }

  function $unlink(href, options, linkHeaders) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Link = linkHeaders.map(function(link) { return link.toString(); });
    return $request('UNLINK', href, options);
  }

  function $request(method, href, options, data) {
    options = options || {};
    $log.log('The halClient service is deprecated. Please use $http directly instead.');
    return $http(angular.extend({}, options, {
      method: method,
      url: $halConfiguration.urlTransformer(href),
      data: data,
    }));
  }
}

// Inject Dependencies
HalClientService.$inject = [
  '$log',
  '$http',
  'LinkHeader',
  '$halConfiguration',
];
