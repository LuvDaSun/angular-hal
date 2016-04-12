'use strict';

import rfc6570 from 'rfc6570/src/main';

/**
 * Generate url from template
 *
 * @param  {String} template
 * @param  {Object} parameters
 * @return {String}
 */
export default function generateUrl(template, parameters) {
  return new rfc6570.UriTemplate(template).stringify(parameters);
}
