/* jshint node: true */

module.exports = function(config) {

	config.set({
		basePath: '.',
		frameworks: ['jasmine'],
		files: [
			'node_modules/angular/angular.js',
			'node_modules/angular-mocks/angular-mocks.js',
			'node_modules/rfc6570/rfc6570.js',
			'angular-hal.js',
			'test/**.js'
		],


		reporters: ['dots', 'coverage'],
		preprocessors: {
			'angular-hal.js': 'coverage'
		},
 
		coverageReporter: {
			reporters: [{
				type: 'html',
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