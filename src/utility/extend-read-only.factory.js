(function(
  module
) {
  'use strict';

  // Regirster ExtendReadOnlyFactory
  module.factory('$extendReadOnly', ExtendReadOnlyFactory);

  // Inject Dependencies
  ExtendReadOnlyFactory.$inject = [];

  /**
   * Factory for Extend Read Only
   */
  function ExtendReadOnlyFactory() {
    return extendReadOnly;

    /**
     * Extend properties from copy read-only to target
     * @param {Object} target
     * @param {Object} copy
     */
    function extendReadOnly(target, copy) {
      for(var key in copy) {
        Object.defineProperty(target, key, {
          configurable: false,
          enumerable: false,
          value: copy[key],
        });
      }
    }
  }
})(
  angular.module('angular-hal.utility')
);
