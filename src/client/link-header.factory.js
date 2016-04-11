'use strict';

/**
 * Factory for LinkHeader
 */
export default function LinkHeaderFactory() {
  return LinkHeader;

  /**
   * Link Header
   *
   * @param {String} uriReference The Link Value
   * @param {Object} linkParams   The Link Params
   * @constructor
   */
  function LinkHeader(uriReference, linkParams) {
    var self = this;

    /**
     * Initialize the LinkHeader
     *
     * @return void
     */
    (function init() {
      angular.extend(self, {
        uriReference: uriReference,
        linkParams: angular.extend(
          {
            rel: null,
            anchor: null,
            rev: null,
            hreflang: null,
            media: null,
            title: null,
            type: null,
          },
          linkParams
        ),
      });
    })();

    /**
     * Convert LinkHeader to String
     *
     * @return {String}
     */
    self.toString = function toString() {
      var result = '<' + self.uriReference + '>'
        , params = [];

      for(let paramName in self.linkParams) {
        let paramValue = self.linkParams[paramName];
        if(paramValue) {
          params.push(paramName + '="' + paramValue + '"');
        }
      }

      if(params.length < 1) {
        return result;
      }

      result = result + ';' + params.join(';');

      return result;
    };

    return this;
  }
}

// Inject Dependencies
LinkHeaderFactory.$inject = [];
