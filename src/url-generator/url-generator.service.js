(function(
  module
) {
  'use strict';

  // Regirster UrlGeneratorFactory
  module.factory('$generateUrl', UrlGeneratorFactory);

  // Inject Dependencies
  UrlGeneratorFactory.$inject = [
    '$window',
  ];

  /**
   * Factory for URL Generator
   */
  function UrlGeneratorFactory($window) {
    var rfc6570;

    /**
     * Initialize Everything
     */
    (function init() {
      rfc6570 = searchRfc6570();
    })();

    return generate;

    /**
     * Search for RFC6570
     */
    function searchRfc6570() {
      if(typeof $window.rfc6570 != 'undefined') {
        return $window.rfc6570;
      }
      
      if(!rfc6570 &&
        typeof require !== 'undefined') {
        return require('rfc5670');
      }

      throw new Error('Could not find rfc6570 library.');
    }

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
})(
  angular.module('angular-hal.url-generator')
);
