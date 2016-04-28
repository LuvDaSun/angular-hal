'use strict';

import extendReadOnly from '../utility/extend-read-only';
import defineReadOnly from '../utility/define-read-only';
import generateUrl from '../utility/generate-url';
import normalizeLink from '../utility/normalize-link';

/**
 * Factory for Resource
 *
 * @param {Function} HalResourceClient
 * @param {Object}   $halConfiguration
 * @param {Log}      $log
 */
export default function ResourceFactory(HalResourceClient, $halConfiguration, $log) {
  return Resource;

  /**
   * @param {Object} data
   * @param {Object} response
   */
  function Resource(data, response) {
    var self = this
      , links = {}
      , embedded = {}
      , client;

    /**
     * Initialize the Resource
     */
    (function init() {
      if(typeof data !== 'object' ||
        data === null) {
        data = {};
      }
      initializeData();
      initializeEmbedded();
      initializeLinks();
      inititalizeClient();

      extendReadOnly(self, {
        $hasLink: $hasLink,
        $hasEmbedded: $hasEmbedded,
        $has: $has,
        $href: $href,
        $meta: $meta,
        $link: $link,
        $request: $request,
        $response: $response,
      });
    })();

    /**
     * Add all data from data to itself
     */
    function initializeData() {
      for(var propertyName in data) {
        if(!data.hasOwnProperty(propertyName)) {
          continue;
        }
        if(isMetaProperty(propertyName)) {
          continue;
        }
        defineReadOnly(self, propertyName, data[propertyName]);
      }
    }

    /**
     * Normalize all Links
     */
    function initializeLinks() {
      if(typeof data[$halConfiguration.linksAttribute] !== 'object') {
        return;
      }

      Object
        .keys(data[$halConfiguration.linksAttribute])
        .forEach(function(rel) {
          var link = data[$halConfiguration.linksAttribute][rel];
          links[rel] = normalizeLink(response.config.url, link);
        });
    }

    /**
     * Normalize Embedded Contents
     */
    function initializeEmbedded() {
      if(typeof data[$halConfiguration.embeddedAttribute] !== 'object') {
        return;
      }

      Object
        .keys(data[$halConfiguration.embeddedAttribute])
        .forEach(function(rel) {
          embedResource(rel, data[$halConfiguration.embeddedAttribute][rel]);
        });
    }

    /**
     * Initialize the HTTP CLIENT
     */
    function inititalizeClient() {
      client = new HalResourceClient(self, embedded);
    }

    /**
     * Embed a resource(s)
     *
     * @param {String}          rel
     * @param {Object|Object[]} resources
     */
    function embedResource(rel, resources) {
      if (Array.isArray(resources)) {
        embedded[rel] = [];
        resources.forEach(function (resource) {
          embedded[rel].push(new Resource(resource, response));
        });
        return;
      }
      embedded[rel] = new Resource(resources, response);
    }

    /**
     * Determine if a property name is a meta property
     * @param {String} propertyName
     * @return {Boolean}
     */
    function isMetaProperty(propertyName) {
      for(var i = 0; i < $halConfiguration.ignoreAttributePrefixes.length; i++) {
        if(propertyName.substr(0, 1) === $halConfiguration.ignoreAttributePrefixes[i]) {
          return true;
        }
        if(propertyName === $halConfiguration.linksAttribute ||
          propertyName === $halConfiguration.embeddedAttribute) {
          return true;
        }
      }
      return false;
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $hasLink(rel) {
      return typeof links[rel] !== 'undefined';
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $hasEmbedded(rel) {
      return typeof embedded[rel] !== 'undefined';
    }

    /**
     * @param {String} rel
     * @return {Boolean}
     */
    function $has(rel) {
      return $hasLink(rel) || $hasEmbedded(rel);
    }

    /**
     * Get the href of a Link
     *
     * @param {String} rel
     * @param {Object} parameters
     * @return {String}
     */
    function $href(rel, parameters) {
      var link = $link(rel)
        , href = link.href;

      if(Array.isArray(link)) {
        href = [];
        for(var i = 0; i < link.length; i++) {
          var subLink = link[i]
            , subHref = subLink.href;
          if(typeof subLink.templated !== 'undefined' &&
            subLink.templated) {
            subHref = generateUrl(subLink.href, parameters);
          }
          subHref = $halConfiguration.urlTransformer(subHref);
          href.push(subHref);
        }
      } else {
        if(typeof link.templated !== 'undefined' &&
          link.templated) {
          href = generateUrl(link.href, parameters);
        }

        href = $halConfiguration.urlTransformer(href);
      }

      return href;
    }

    /**
     * Get a link
     *
     * !! To get a href, use $href instead !!
     *
     * @param {String} rel
     * @return {Object}
     */
    function $link(rel) {
      if(!$hasLink(rel)) {
        throw new Error('link "' + rel + '" is undefined');
      }
      var link = links[rel];

      if(typeof link.deprecation !== 'undefined') {
        $log.warn(`The link "${rel}" is marked as deprecated with the value "${link.deprecation}".`);
      }

      return link;
    }

    /**
     * Get meta properties
     *
     * !! To get a href, use $href instead !!
     * !! To get a link, use $link instead !!
     * !! To get an embedded resource, use $request().$get(rel) instead !!
     *
     * @param {String} rel
     * @return {Object}
     */
    function $meta(name) {
      for(var i = 0; i < $halConfiguration.ignoreAttributePrefixes.length; i++) {
        var fullName = $halConfiguration.ignoreAttributePrefixes[i] + name;
        return data[fullName];
      }
    }

    /**
     * Get the Original Response
     *
     * @return {Object)}
     */
    function $response() {
      return response;
    }

    /**
     * Get the client to perform requests
     *
     * @return {HalResourceClient)}
     */
    function $request() {
      return client;
    }
  }
}
ResourceFactory.$inject = [
  'HalResourceClient',
  '$halConfiguration',
  '$log',
];
