(function(
  module
) {
  'use strict';

  // Configure Http Interception
  module.config(HttpInterceptorConfiguration);

  // Inject Dependencies
  HttpInterceptorConfiguration.$inject = [
    '$httpProvider',
  ];

  /**
   * @param {HttpProvider} $httpProvider
   */
  function HttpInterceptorConfiguration($httpProvider) {
    $httpProvider.interceptors.push('ResourceHttpInterceptor');
  }

})(
  angular.module('angular-hal.http-interception')
);
