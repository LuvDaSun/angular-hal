'use strict';

const MODULE_NAME = 'angular-hal.http-interception';

import resource from '../resource/index';
import configuration from '../configuration/index';

import HttpInterceptorConfiguration from './http-interception.config';

// Add module for http interception
angular
  .module(MODULE_NAME, [
    resource,
    configuration,
  ])

  .config(HttpInterceptorConfiguration)
;

export default MODULE_NAME;
