/* jshint node: true */
/* eslint-env node */
"use strict";

module.exports = function(config) {
  config.set({
    basePath: ".",
    frameworks: ["browserify", "jasmine"],
    files: [
      "node_modules/angular/angular.js",
      "node_modules/angular-mocks/angular-mocks.js",
      "test/**/*.spec.js"
    ],

    reporters: ["dots"],
    preprocessors: {
      "test/**/*.js": ["browserify"]
    },

    browserify: {
      debug: true,
      transform: [
        [
          "babelify",
          {
            presets: ["es2015"]
          }
        ]
      ]
    },

    proxies: {
      "/local/": "http://localhost:8080/"
    },

    autoWatch: true,
    browsers: ["PhantomJS"]
  });
};
