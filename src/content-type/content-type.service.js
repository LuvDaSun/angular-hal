(function (module) {
	'use strict';

	// Regirster ContentType
	module.service('$contentType', ContentType);

	// Inject Dependencies
	ContentType.$inject = ['$window'];

	/**
	 * Factory for Content-Type parser
	 */
	function ContentType($window) {
		var self = this
			, contentTypeLibrary;

		/**
		 * Initialize Everything
		 */
		(function init() {
			contentTypeLibrary = searchContentType();
			self.match = match;
		})();

		/**
		 * Search for content-type lib
		 */
		function searchContentType() {
			if (typeof $window.contentType !== 'undefined') {
				return $window.contentType;
			}

			if (typeof require !== 'undefined') {
				return require('content-type');
			}

			throw new Error('Could not find content-type library.');
		}

		/**
		 * Check content-type matching
		 *
		 * @param  {String} contentType
		 * @param  {String} type
		 * @return {Boolean}
		 */
		function match(contentType, type) {
			if(typeof contentType !== 'string') {
				return false;
			}
			return contentTypeLibrary.parse(contentType).type === type;
		}
	}
})(angular.module('angular-hal.content-type'));
