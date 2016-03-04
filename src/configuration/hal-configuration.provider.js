(function(
  module
) {
  'use strict';

  // Add Factory for ResourceHttpInterceptorFactory
  module.provider('$halConfiguration', HalConfigurationProvider);

  // Inject Dependencies
  HalConfigurationProvider.$inject = [];

  /**
   * @return {Object}
   */
  function HalConfigurationProvider() {
    var linksAttribute = '_links'
      , embeddedAttribute = '_embedded'
      , ignoreAttributePrefixes = [
          '_',
          '$',
        ]
      , selfLink = 'self'
      , forceJSONResource = false
      , urlTransformer = noopUrlTransformer;

    return {
      setLinksAttribute: setLinksAttribute,
      setEmbeddedAttribute: setEmbeddedAttribute,
      setIgnoreAttributePrefixes: setIgnoreAttributePrefixes,
      addIgnoreAttributePrefix: addIgnoreAttributePrefix,
      setSelfLink: setSelfLink,
      setForceJSONResource: setForceJSONResource,
      setUrlTransformer: setUrlTransformer,
      $get: $get,
    };

    /**
     * @param {String} newLinksAttribute
     */
    function setLinksAttribute(newLinksAttribute) {
      linksAttribute = newLinksAttribute;
    }

    /**
     * @param {String} newEmbeddedAttribute
     */
    function setEmbeddedAttribute(newEmbeddedAttribute) {
      embeddedAttribute = newEmbeddedAttribute;
    }

    /**
     * @param {String[]} newIgnoreAttributePrefixes
     */
    function setIgnoreAttributePrefixes(newIgnoreAttributePrefixes) {
      ignoreAttributePrefixes = newIgnoreAttributePrefixes;
    }

    /**
     * @param {String} ignoreAttributePrefix
     */
    function addIgnoreAttributePrefix(ignoreAttributePrefix) {
      ignoreAttributePrefixes.push(ignoreAttributePrefix);
    }

    /**
     * @param {String} newSelfLink
     */
    function setSelfLink(newSelfLink) {
      selfLink = newSelfLink;
    }

    /**
     * @param {Boolean} newForceJSONResource
     */
    function setForceJSONResource(newForceJSONResource) {
      forceJSONResource = newForceJSONResource;
    }

    /**
     * @param {Function}
     * @deprecated $halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.
     * @see https://docs.angularjs.org/api/ng/service/$http#interceptors
     */
    function setUrlTransformer(newUrlTransformer) {
      urlTransformer = newUrlTransformer;
    }

    /**
     * @param {String}
     * @return {String}
     */
    function noopUrlTransformer(url) {
      return url;
    }

    // Inject Dependencies
    $get.$inject = [
      '$log',
    ];

    /**
     * @return {Object}
     */
    function $get($log) {
      if(urlTransformer !== noopUrlTransformer) {
        $log.log('$halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.');
      }

      return Object.freeze({
        linksAttribute: linksAttribute,
        embeddedAttribute: embeddedAttribute,
        ignoreAttributePrefixes: ignoreAttributePrefixes,
        selfLink: selfLink,
        forceJSONResource: forceJSONResource,
        urlTransformer: urlTransformer,
      });
    }
  }
})(
  angular.module('angular-hal.configuration')
);
