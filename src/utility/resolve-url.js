"use strict";

/**
 * Resolve whole URL
 *
 * @param {String} baseUrl
 * @param {String} path
 * @return {String}
 */
export default function resolveUrl(baseUrl, path) {
  var resultHref = "",
    reFullUrl = /^((?:\w+:)?)((?:\/\/)?)([^/]*)((?:\/.*)?)$/,
    baseHrefMatch = reFullUrl.exec(baseUrl),
    hrefMatch = reFullUrl.exec(path);

  for (var partIndex = 1; partIndex < 5; partIndex++) {
    if (hrefMatch[partIndex]) {
      resultHref += hrefMatch[partIndex];
    } else {
      resultHref += baseHrefMatch[partIndex];
    }
  }

  return resultHref;
}
