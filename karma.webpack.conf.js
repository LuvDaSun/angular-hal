/* jshint node: true */
/* eslint-env node */
'use strict';

module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'test/**/*.spec.js',
    ],


    reporters: [
      'dots',
    ],
    preprocessors: {
      'test/**/*.js': [
        'webpack',
      ],
    },

    webpack: {
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
              presets: [
                'es2015',
              ],
            },
          },
        ],
      },
    },

    webpackMiddleware: {
      noInfo: true,
    },

    proxies: {
      '/local/': 'http://localhost:8080/',
    },

    autoWatch: true,
    browsers: ['PhantomJS'],
  });

};
