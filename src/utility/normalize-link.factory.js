(function(
  module,
  extend
) {
  'use strict';

  // Regirster NormalizeLinkFactory
  module.factory('$normalizeLink', NormalizeLinkFactory);

  // Inject Dependencies
  NormalizeLinkFactory.$inject = [
    '$resolveUrl',
  ];

  /**
   * Factory for Link Normalizer
   */
  function NormalizeLinkFactory($resolveUrl) {
    return normalizeLink;

    /**
     * @param {String} baseUrl
     * @param {mixed}  link
     * @return {Object}
     */
    function normalizeLink(baseUrl, link) {
      if (Array.isArray(link)) {
        return link.map(function (item) {
          return normalizeLink(baseUrl, item);
        });
      }
      if(typeof link === 'string') {
        return {
          href: $resolveUrl(baseUrl, link),
        };
      }
      if(typeof link.href === 'string') {
        link.href = $resolveUrl(baseUrl, link.href);
        return link;
      }
      if(Array.isArray(link.href)) {
        return link.href.map(function (href) {
          var newLink = extend({}, link, {
            href: href,
          });
          return normalizeLink(baseUrl, newLink);
        });
      }
      return {
        href: baseUrl,
      };
    }
  }
})(
  angular.module('angular-hal.utility'),
  angular.extend
);
