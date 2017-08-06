"use strict";

const MODULE_NAME = "angular-hal";

import httpInterception from "./http-interception/index";
import client from "./client/index";

// Combine needed Modules
angular.module(MODULE_NAME, [httpInterception, client]);

export default MODULE_NAME;
