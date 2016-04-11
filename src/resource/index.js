'use strict';

const MODULE_NAME = 'angular-hal.resource';


import configuration from '../configuration';

import ResourceFactory from './resource.factory';
import HalResourceClientFactory from './hal-resource-client.factory';

// Add module for resource
angular
  .module(MODULE_NAME, [
    configuration,
  ])

  .factory('Resource', ResourceFactory)

  .factory('HalResourceClient', HalResourceClientFactory)
;

export default MODULE_NAME;
