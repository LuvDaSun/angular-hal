'use strict';

import { parse } from 'content-type';

/**
 * @param {Function} $transformResponseToResource
 * @return {Object}
 */
export default function ResourceHttpInterceptorFactory($transformResponseToResource, $halConfiguration) {
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
    try {
      if(parse(response.headers('Content-Type')).type === CONTENT_TYPE) {
        return $transformResponseToResource(response);
      }
    } catch(e) {
      // The parse function could throw an error, we do not want that.
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

// Inject Dependencies
ResourceHttpInterceptorFactory.$inject = [
  '$transformResponseToResource',
  '$halConfiguration',
];
