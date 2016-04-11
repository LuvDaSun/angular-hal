'use strict';

const MODULE_NAME = 'angular-hal.resource';


import utility from '../utility';
import configuration from '../configuration';

import ResourceFactory from './resource.factory';
import HalResourceClientFactory from './hal-resource-client.factory';

// Add module for resource
angular
  .module(MODULE_NAME, [
    utility,
    configuration,
  ])

  .factory('Resource', ResourceFactory)

  .factory('HalResourceClient', HalResourceClientFactory)
;

export default MODULE_NAME;
