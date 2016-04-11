'use strict';

/**
 * @param {Function} Resource
 */
export default function ResponseToResourceTransformerFactory(Resource) {
  return transform;

  /**
   * @param {Response}
   * @return {Resource}
   */
  function transform(response) {
    return new Resource(response.data, response);
  }
}

// Inject Dependencies
ResponseToResourceTransformerFactory.$inject = [
  'Resource',
];
