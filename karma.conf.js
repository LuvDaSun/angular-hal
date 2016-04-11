/* globals module: true */

'use strict';

module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['browserify', 'jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'test/**/*.spec.js',
    ],


    reporters: [
      'dots',
      'coverage',
    ],
    preprocessors: {
      'src/**/*.js': [
        'coverage',
      ],
      'test/**/*.js': [
        'browserify',
      ],
    },

    browserify: {
      debug: true,
      transform: [
        [
          'babelify',
          {presets: ['es2015']}
        ],
      ],

      /*configure: function browserify(bundle) {
        bundle.once('prebundle', function prebundle() {
          bundle.transform('babelify', {presets: ['es2015']});
        });
      },*/
    },

    coverageReporter: {
      reporters: [{
        type: 'lcov',
        dir: 'coverage/'
      }, {
        type: 'text-summary'
      }]
    },

    proxies: {
      '/local/': 'http://localhost:8080/'
    },

    autoWatch: false,
    singleRun: true,
    browsers: ['PhantomJS']
  });

};
