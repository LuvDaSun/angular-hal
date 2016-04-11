'use strict';

/**
 * Factory for Url Resolver
 */
export default function ResolveUrlFactory() {
  return resolveUrl;

  /**
   * Resolve whole URL
   *
   * @param {String} baseUrl
   * @param {String} path
   * @return {String}
   */
  function resolveUrl(baseUrl, path) {
    var resultHref = ''
      , reFullUrl = /^((?:\w+\:)?)((?:\/\/)?)([^\/]*)((?:\/.*)?)$/
      , baseHrefMatch = reFullUrl.exec(baseUrl)
      , hrefMatch = reFullUrl.exec(path);

    for (var partIndex = 1; partIndex < 5; partIndex++) {
      if (hrefMatch[partIndex]) {
        resultHref += hrefMatch[partIndex];
      } else {
        resultHref += baseHrefMatch[partIndex];
      }
    }

    return resultHref;
  }
}

// Inject Dependencies
ResolveUrlFactory.$inject = [];
