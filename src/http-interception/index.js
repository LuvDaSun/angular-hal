'use strict';

const MODULE_NAME = 'angular-hal.http-interception';


import resource from '../resource';
import configuration from '../configuration';

import ResourceHttpInterceptorFactory from './resource-http-interceptor.factory';
import HttpInterceptorConfiguration from './http-interception.config';
import ResponseToResourceTransformerFactory from './response-transformer.service';

// Add module for http interception
angular
  .module(MODULE_NAME, [
    resource,
    configuration,
  ])

  .config(HttpInterceptorConfiguration)

  .factory('ResourceHttpInterceptor', ResourceHttpInterceptorFactory)
  .factory('$transformResponseToResource', ResponseToResourceTransformerFactory)
;

export default MODULE_NAME;
