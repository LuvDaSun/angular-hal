'use strict';

import rfc6570 from 'rfc6570/src/main';

/**
 * Factory for URL Generator
 */
export default function UrlGeneratorFactory() {
  return generate;

  /**
   * Generate url from template
   *
   * @param  {String} template
   * @param  {Object} parameters
   * @return {String}
   */
  function generate(template, parameters) {
    return new rfc6570.UriTemplate(template).stringify(parameters);
  }
}

// Inject Dependencies
UrlGeneratorFactory.$inject = [];
