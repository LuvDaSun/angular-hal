'use strict';

/**
 * Link Header
 */
export default class LinkHeader {
  /**
   * @param {String} uriReference The Link Value
   * @param {Object} linkParams   The Link Params
   */
  constructor(uriReference, linkParams) {
    this.uriReference = uriReference;
    this.linkParams = angular.extend(
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
    );
  }
  /**
   * @return {String}
   */
  toString() {
    var result = '<' + this.uriReference + '>'
      , params = [];

    for(let paramName in this.linkParams) {
      let paramValue = this.linkParams[paramName];
      if(paramValue) {
        params.push(paramName + '="' + paramValue + '"');
      }
    }

    if(params.length < 1) {
      return result;
    }

    result = result + ';' + params.join(';');

    return result;
  }
}
