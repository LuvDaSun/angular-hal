(function(
  module
) {
  'use strict';

  // Regirster NormalizeLinkFactory
  module.factory('$resolveUrl', ResolveUrlFactory);

  // Inject Dependencies
  ResolveUrlFactory.$inject = [];

  /**
   * Factory for Url Resolver
   */
  function ResolveUrlFactory() {
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
})(
  angular.module('angular-hal.utility')
);
