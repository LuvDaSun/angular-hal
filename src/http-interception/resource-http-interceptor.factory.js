'use strict';

const CONTENT_TYPE = 'application/hal+json';

import { parse } from 'content-type';

export default function ResourceHttpInterceptorFactory($halConfiguration, Resource) {
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
        request.headers.Accept,
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
        return transformResponseToResource(response);
      }
    } catch(e) {
      // The parse function could throw an error, we do not want that.
    }
    if(response.config.forceHal) {
      return transformResponseToResource(response);
    }
    if((
        response.headers('Content-Type') === 'application/json' ||
        response.headers('Content-Type') === null
      ) &&
      $halConfiguration.forceJSONResource) {
      return transformResponseToResource(response);
    }

    return response;
  }
  function transformResponseToResource(response) {
    response.data = new Resource(response.data, response);
    return response;
  }
}

ResourceHttpInterceptorFactory.$inject = [
  '$halConfiguration',
  'Resource',
];
