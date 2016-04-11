'use strict';

/**
 * Factory for Define Read Only
 */
export default function DefineReadOnlyFactory() {
  return defineReadOnly;

  /**
   * Define read-only property in target
   * @param {Object} target
   * @param {String} key
   * @param {mixed}  value
   */
  function defineReadOnly(target, key, value) {
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      value: value,
      writable: true,
    });
  }
}

// Inject Dependencies
DefineReadOnlyFactory.$inject = [];
