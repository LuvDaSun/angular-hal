# angular-hal

* Master: [![Build Status](https://travis-ci.org/elmerbulthuis/angular-hal.png?branch=master)](https://travis-ci.org/elmerbulthuis/angular-hal)
* Develop: [![Build Status](https://travis-ci.org/elmerbulthuis/angular-hal.png?branch=develop)](https://travis-ci.org/elmerbulthuis/angular-hal)


## use it in your project!

Easy installation using bower
	
	bower install angular-hal


then, reference the js file in your html page

	<script src="/components/angular-hal/angular-hal.js"></script>


example of usage:
	
	angular
	.module('app', ['angular-hal'])
	.run([
		'$rootScope'
		, '$window'
		, 'halClient'
		, function(
			$rootScope
			, $window
			, halClient
		) {
			var token = $window.sessionStorage.getItem('token');

			$rootScope.isAuthenticated = !!token;

			$rootScope.apiRoot =
			halClient.$get('https://api.example.com/', {
				authorization: token && 'Bearer ' + token + ''
			})
			;
			
		}
	])//run


stay tuned for more!


## help me out!

First, install PhantomJS from http://phantomjs.org/

then, install everything using

	npm install
	

then, run all tests with:
	
	npm test
	

you may also run the tests by opening SpecRunner.html in your favorite browser!

Then, help me out by providing me with some unit tests and / or some awesome code!




