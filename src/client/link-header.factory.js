(function(
  module,
  merge,
  forEach
) {
  'use strict';

  // Add factory for LinkHeader
  module.factory('LinkHeader', LinkHeaderFactory);

  // Inject Dependencies
  LinkHeaderFactory.$inject = [
    '$q',
    '$extendReadOnly',
    '$injector',
    '$halConfiguration',
  ];

  /**
   * Factory for LinkHeader
   * @param {Q}        $q
   * @param {Function} $extendReadOnly
   * @param {Injector} $injector Prevent Circular Dependency by injecting $injector instead of $http
   * @param {Object}   $halConfiguration
   */
  function LinkHeaderFactory($q, $extendReadOnly, $injector, $halConfiguration) {
    return LinkHeader;

    /**
     * Link Header
     *
     * @param {String} uriReference The Link Value
     * @param {Object} linkParams   The Link Params
     * @constructor
     */
    function LinkHeader(uriReference, linkParams) {
      var self = this;

      /**
       * Initialize the LinkHeader
       *
       * @return void
       */
      (function init() {
        merge(self, {
          uriReference: uriReference,
          linkParams: angular.merge(
            {
              rel: null,
              anchor: null,
              rev: null,
              hreflang: null,
              media: null,
              title: null,
              type: null,
            },
            linkParams
          ),
        });
      })();

      /**
       * Convert LinkHeader to String
       *
       * @return {String}
       */
      self.toString = function toString() {
        var result = '<' + self.uriReference + '>'
          , params = [];

        forEach(
          self.linkParams,
          function(paramValue, paramName) {
            if(paramValue) {
              params.push(paramName + '="' + paramValue + '"');
            }
          }
        );

        if(params.length < 1) {
          return result;
        }

        result = result + ';' + params.join(';');

        return result;
      };

      return this;
    }
  }
})(
  angular.module('angular-hal.client'),
  angular.merge,
  angular.forEach
);
