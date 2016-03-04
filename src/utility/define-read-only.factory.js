(function(
  module
) {
  'use strict';

  // Regirster DefineReadOnlyFactory
  module.factory('$defineReadOnly', DefineReadOnlyFactory);

  // Inject Dependencies
  DefineReadOnlyFactory.$inject = [];

  /**
   * Factory for Define Read Only
   */
  function DefineReadOnlyFactory() {
    return defineReadOnly;

    /**
     * Define read-only property in target
     * @param {Object} target
     * @param {String} key
     * @param {mixed}  value
     */
    function defineReadOnly(target, key, value) {
      Object.defineProperty(target, key, {
        configurable: false,
        enumerable: true,
        value: value,
        writable: true,
      });
    }
  }
})(
  angular.module('angular-hal.utility')
);
