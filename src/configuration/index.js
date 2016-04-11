'use strict';

const MODULE_NAME = 'angular-hal.configuration';



import HalConfigurationProvider from './hal-configuration.provider';

// Add module for configuration
angular
  .module(MODULE_NAME, [])

  .provider('$halConfiguration', HalConfigurationProvider)
;

export default MODULE_NAME;
