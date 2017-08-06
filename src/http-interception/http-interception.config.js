"use strict";

import ResourceHttpInterceptorFactory from "./resource-http-interceptor.factory";

/**
 * @param {HttpProvider} $httpProvider
 */
export default function HttpInterceptorConfiguration($httpProvider) {
  $httpProvider.interceptors.push(ResourceHttpInterceptorFactory);
}

HttpInterceptorConfiguration.$inject = ["$httpProvider"];
