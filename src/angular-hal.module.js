(function(
  angular
) {
  'use strict';

  // Combine needed Modules
  angular.module('angular-hal', [
    'angular-hal.url-generator',
    'angular-hal.http-interception',
    'angular-hal.client',
    'ng',
  ]);

})(
  angular
);
