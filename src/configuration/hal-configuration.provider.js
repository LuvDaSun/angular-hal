'use strict';

/**
 * @param {String}
 * @return {String}
 */
export function noopUrlTransformer(url) {
  return url;
}

export default class HalConfigurationProvider {
  constructor() {
    this._linksAttribute = '_links';
    this._embeddedAttribute = '_embedded';
    this._ignoreAttributePrefixes = [
      '_',
      '$',
    ];
    this._selfLink = 'self';
    this._forceJSONResource = false;
    this._urlTransformer = noopUrlTransformer;
  }

  /**
   * @param {String} linksAttribute
   */
  setLinksAttribute(linksAttribute) {
    this._linksAttribute = linksAttribute;
  }

  /**
   * @param {String} embeddedAttribute
   */
  setEmbeddedAttribute(embeddedAttribute) {
    this._embeddedAttribute = embeddedAttribute;
  }

  /**
   * @param {String[]} ignoreAttributePrefixes
   */
  setIgnoreAttributePrefixes(ignoreAttributePrefixes) {
    this._ignoreAttributePrefixes = ignoreAttributePrefixes;
  }

  /**
   * @param {String} ignoreAttributePrefix
   */
  addIgnoreAttributePrefix(ignoreAttributePrefix) {
    this._ignoreAttributePrefixes.push(ignoreAttributePrefix);
  }

  /**
   * @param {String} selfLink
   */
  setSelfLink(selfLink) {
    this._selfLink = selfLink;
  }

  /**
   * @param {Boolean} forceJSONResource
   */
  setForceJSONResource(forceJSONResource) {
    this._forceJSONResource = forceJSONResource;
  }

  /**
   * @param {Function} urlTransformer
   * @deprecated $halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.
   * @see https://docs.angularjs.org/api/ng/service/$http#interceptors
   */
  setUrlTransformer(urlTransformer) {
    this._urlTransformer = urlTransformer;
  }

  /**
   * Get Configuration
   * @param  {Log} $log logger
   * @return {Object}
   */
  $get($log) {
    if(this._urlTransformer !== noopUrlTransformer) {
      $log.log('$halConfigurationProvider.setUrlTransformer is deprecated. Please write a http interceptor instead.');
    }

    return Object.freeze({
      linksAttribute: this._linksAttribute,
      embeddedAttribute: this._embeddedAttribute,
      ignoreAttributePrefixes: this._ignoreAttributePrefixes,
      selfLink: this._selfLink,
      forceJSONResource: this._forceJSONResource,
      urlTransformer: this._urlTransformer,
    });
  }
}
