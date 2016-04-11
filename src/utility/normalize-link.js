'use strict';

import resolveUrl from '../utility/resolve-url';

/**
 * @param {String} baseUrl
 * @param {mixed}  link
 * @return {Object}
 */
export default function normalizeLink(baseUrl, link) {
  if (Array.isArray(link)) {
    return link.map(function (item) {
      return normalizeLink(baseUrl, item);
    });
  }
  if(typeof link === 'string') {
    return {
      href: resolveUrl(baseUrl, link),
    };
  }
  if(typeof link.href === 'string') {
    link.href = resolveUrl(baseUrl, link.href);
    return link;
  }
  if(Array.isArray(link.href)) {
    return link.href.map(function (href) {
      var newLink = angular.extend({}, link, {
        href: href,
      });
      return normalizeLink(baseUrl, newLink);
    });
  }
  return {
    href: baseUrl,
  };
}
