(function(
  module
) {
  'use strict';

  // Add Factory for ResourceHttpInterceptorFactory
  module.factory('ResourceHttpInterceptor', ResourceHttpInterceptorFactory);

  // Inject Dependencies
  ResourceHttpInterceptorFactory.$inject = [
    '$transformResponseToResource',
    '$halConfiguration',
	'$contentType'
  ];

  /**
   * @param {Function} $transformResponseToResource
   * @return {Object}
   */
  function ResourceHttpInterceptorFactory($transformResponseToResource, $halConfiguration, $contentType) {
    var CONTENT_TYPE = 'application/hal+json';

    return {
      request: transformRequest,
      response: transformResponse,
    };

    /**
     * Add Hal Json As an accepted format
     * @param {Request} request
     * @return {Request}
     */
    function transformRequest(request) {
      if(typeof request.headers.Accept === 'undefined') {
        request.headers.Accept = CONTENT_TYPE;
      } else {
        request.headers.Accept = [
          CONTENT_TYPE,
          request.headers.Accept
        ].join(', ');
      }

      return request;
    }

    /**
     * Transform Response
     *
     * @param {Response} response
     * @return {Response|Resource}
     */
    function transformResponse(response) {
      if($contentType.match(response.headers('Content-Type'), CONTENT_TYPE)) {
        return $transformResponseToResource(response);
      }
      if(response.config.forceHal) {
        return $transformResponseToResource(response);
      }
      if((
          response.headers('Content-Type') === 'application/json' ||
          response.headers('Content-Type') === null
        ) &&
        $halConfiguration.forceJSONResource) {
        return $transformResponseToResource(response);
      }

      return response;
    }
  }
})(
  angular.module('angular-hal.http-interception')
);
