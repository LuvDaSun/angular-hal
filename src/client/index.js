'use strict';

const MODULE_NAME = 'angular-hal.client';


import utility from '../utility';

import HalClientService from './hal-client.service';
import LinkHeaderFactory from './link-header.factory';

// Add module for client
angular
  .module(MODULE_NAME, [
    utility,
  ])

  .service('halClient', HalClientService)
  .service('$halClient', HalClientService)

  .factory('LinkHeader', LinkHeaderFactory)
;

export default MODULE_NAME;
