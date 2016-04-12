'use strict';

/**
 * @param {HttpProvider} $httpProvider
 */
export default function HttpInterceptorConfiguration($httpProvider) {
  $httpProvider.interceptors.push('ResourceHttpInterceptor');
}

HttpInterceptorConfiguration.$inject = [
  '$httpProvider',
];
