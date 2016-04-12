'use strict';

/**
 * @deprecated The halClient service is deprecated. Please use $http directly instead.
 */
export default class HalClient {
  /**
   * @param {Log}      $log
   * @param {Http}     $http
   * @param {Function} LinkHeader
   * @param {Object}   $halConfiguration
   */
  constructor($log, $http, LinkHeader, $halConfiguration) {
    this._$log = $log;
    this._$http = $http;
    this._$halConfiguration = $halConfiguration;
    this.LinkHeader = LinkHeader;
  }
  $get(href, options) {
    return this.$request('GET', href, options);
  }
  $post(href, options, data) {
    return this.$request('POST', href, options, data);
  }
  $put(href, options, data) {
    return this.$request('PUT', href, options, data);
  }
  $patch(href, options, data) {
    return this.$request('PATCH', href, options, data);
  }
  $delete(href, options) {
    return this.$request('DELETE', href, options);
  }
  $link(href, options, linkHeaders) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Link = linkHeaders.map(function(link) { return link.toString(); });
    return this.$request('LINK', href, options);
  }
  $unlink(href, options, linkHeaders) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Link = linkHeaders.map(function(link) { return link.toString(); });
    return this.$request('UNLINK', href, options);
  }
  $request(method, href, options, data) {
    options = options || {};
    this._$log.log('The halClient service is deprecated. Please use $http directly instead.');
    return this._$http(angular.extend({}, options, {
      method: method,
      url: this._$halConfiguration.urlTransformer(href),
      data: data,
    }));
  }
}

// Inject Dependencies
HalClient.$inject = [
  '$log',
  '$http',
  'LinkHeader',
  '$halConfiguration',
];
