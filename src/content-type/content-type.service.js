(function (module) {
	'use strict';

	// Regirster ContentType
	module.factory('$contentType', ContentType);

	// Inject Dependencies
	ContentType.$inject = ['$window'];

	/**
	 * Factory for Content-Type parser
	 */
	function ContentType($window) {
		var contentType;

		/**
		 * Initialize Everything
		 */
		(function init() {
			contentType = searchContentType();
		})();

		return match;

		/**
		 * Search for content-type lib
		 */
		function searchContentType() {
			if (typeof $window.contentType != 'undefined') {
				return $window.contentType;
			}

			if (!contentType &&
				typeof require !== 'undefined') {
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
			return contentType.parse(contentType).type === type;
		}

		// @TODO: Add parse and format methods (?)
	}
})(angular.module('angular-hal.content-type'));
