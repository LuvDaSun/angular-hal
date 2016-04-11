'use strict';

const MODULE_NAME = 'angular-hal';

import urlGenerator from './url-generator';
import httpInterception from './http-interception';
import client from './client';

// Combine needed Modules
angular
  .module(MODULE_NAME, [
    urlGenerator,
    httpInterception,
    client,
    'ng',
  ])
;

export default MODULE_NAME;
