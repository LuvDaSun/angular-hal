/* jshint node:true */
/* eslint-env node */
'use strict';

module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['jspm', 'jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
    ],

    reporters: [
      'dots',
    ],

    jspm: {
      loadFiles: [
        'test/**/*.spec.js',
      ],
      serveFiles: [
        'test/**/!(*.spec).js',
        'src/**/*.js',
      ],
    },

    proxies: {
      '/local/': 'http://localhost:8080/',
    },

    autoWatch: true,
    browsers: ['PhantomJS'],
  });

};
