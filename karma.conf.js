module.exports = function(config) {

  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/rfc6570/rfc6570.js',
      'node_modules/content-type/index.js',
      'src/**/*.module.js',
      'src/**/*.js',
      'test/helpers.js',
      'test/**/*.spec.js',
    ],


    reporters: ['dots', 'coverage'],
    preprocessors: {
      'src/**/*.js': 'coverage'
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
