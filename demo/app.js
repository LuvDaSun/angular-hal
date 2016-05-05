/* globals angular: false, angularHal: false */

(function(angular, angularHal) {
  'use strict';

  angular
    .module('app', [
      angularHal.default,
      'app.debug',
    ])
    .run(function ($rootScope, $http) {
      $rootScope.apiRoot = $http({
        url: '//api/'
      });
    })
    .controller('contacts', function ($window, $scope, $timeout) {
      var searchTimeout;
      $scope.$watch('search', function (value) {
        $timeout.cancel(searchTimeout);
        searchTimeout = $timeout(load, 300);
      }, true);

      $scope.submitNewContactForm = function () {
        if ($scope.newContactForm.$invalid) return;

        return $scope.apiRoot.then(function (apiRoot) {
          return apiRoot.$request().$post('contacts', null, $scope.newContact);
        }).then(load);
      };

      $scope.deleteContact = function (index) {
        var contact = $scope.contactItems[index];

        contact.$request().$del('self').then(load);
      };

      $scope.$watch('contacts', function (contacts) {
        if (!contacts) return;
        contacts.$request().$get('item').then(function (contactItems) {
          $scope.contactItems = contactItems;
        });
      });

      function load() {
        var search = $scope.search;
        var promise;
        if (search) {
          promise = $scope.apiRoot.then(function (apiRoot) {
            return apiRoot.$request().$get('contacts', {
              search: search
            });
          });
        } else {
          promise = $scope.apiRoot.then(function (apiRoot) {
            return apiRoot.$request().$get('contacts');
          });
        }
        return promise.then(function (contacts) {
          $scope.contacts = contacts;
          $scope.newContactForm.$setPristine();
          delete $scope.newContact;
        });
      }
    })
    .directive('mailto', function () {
      return {
        restrict: 'A',
        scope: {
          'mailto': '@'
        },
        link: function (scope, element) {
          element.attr('href', 'mailto:' + encodeURIComponent(scope.mailto));
        }
      };
    })
;
})(angular, angularHal);
