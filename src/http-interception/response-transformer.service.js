(function(
  module,
  isArray
) {
  'use strict';

  // Add factory for $transformResponseToResource
  module.factory('$transformResponseToResource', ResponseToResourceTransformerFactory);

  // Inject Dependencies
  ResponseToResourceTransformerFactory.$inject = [
    'Resource',
  ];

  /**
   * @param {Function} Resource
   */
  function ResponseToResourceTransformerFactory(Resource) {
    return transform;

    /**
     * @param {Response}
     * @return {Resource}
     */
    function transform(response) {
      return new Resource(response.data, response);
    }
  }
})(
  angular.module('angular-hal.http-interception'),
  angular.isArray
);
