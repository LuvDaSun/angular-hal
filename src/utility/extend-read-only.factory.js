'use strict';

/**
 * Factory for Extend Read Only
 */
export default function ExtendReadOnlyFactory() {
  return extendReadOnly;

  /**
   * Extend properties from copy read-only to target
   * @param {Object} target
   * @param {Object} copy
   */
  function extendReadOnly(target, copy) {
    for(var key in copy) {
      Object.defineProperty(target, key, {
        configurable: false,
        enumerable: false,
        value: copy[key],
      });
    }
  }
}

// Inject Dependencies
ExtendReadOnlyFactory.$inject = [];
