'use strict';

const MODULE_NAME = 'angular-hal.http-interception';


import resource from '../resource';
import configuration from '../configuration';

import ResourceHttpInterceptor from './resource-http-interceptor.factory';
import HttpInterceptorConfiguration from './http-interception.config';

// Add module for http interception
angular
  .module(MODULE_NAME, [
    resource,
    configuration,
  ])

  .config(HttpInterceptorConfiguration)

  .factory('ResourceHttpInterceptor', ResourceHttpInterceptor)
;

export default MODULE_NAME;
