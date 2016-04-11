'use strict';

const MODULE_NAME = 'angular-hal.client';

import HalClient from './hal-client';
import LinkHeader from './link-header';

// Add module for client
angular
  .module(MODULE_NAME, [])

  .service('halClient', HalClient)
  .service('$halClient', HalClient)

  .value('LinkHeader', LinkHeader)
;

export default MODULE_NAME;
