'use strict';

const MODULE_NAME = 'angular-hal.utility';

import DefineReadOnlyFactory from './define-read-only.factory';
import ExtendReadOnlyFactory from './extend-read-only.factory';
import NormalizeLinkFactory from './normalize-link.factory';
import ResolveUrlFactory from './resolve-url.factory';

// Add new module for utilities
angular
  .module(MODULE_NAME, [])

  .factory('$defineReadOnly', DefineReadOnlyFactory)
  .factory('$extendReadOnly', ExtendReadOnlyFactory)
  .factory('$normalizeLink', NormalizeLinkFactory)
  .factory('$resolveUrl', ResolveUrlFactory)
;

export default MODULE_NAME;
