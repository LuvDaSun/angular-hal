'use strict';

const MODULE_NAME = 'angular-hal.url-generator';



import UrlGeneratorFactory from './url-generator.service';

// Add module for url generator
angular
  .module(MODULE_NAME, [])

  .factory('$generateUrl', UrlGeneratorFactory)
;

export default MODULE_NAME;
