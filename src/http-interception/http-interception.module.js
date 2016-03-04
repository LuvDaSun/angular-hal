(function(
  angular
) {
  'use strict';

  // Add module for http interception
  angular.module('angular-hal.http-interception', [
    'angular-hal.resource',
    'angular-hal.configuration',
  ]);

})(
  angular
);
