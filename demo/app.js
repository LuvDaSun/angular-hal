/* jshint esversion: 6 */

angular
  .module('app', [
    angularHal.default,
    'app.debug',
  ])
  .factory('$api', function ApiFactory($http) {
    return $http({
      url: '//api/'
    });
  })
  .controller('ContactsController', function ContactsController($api, $scope) {
    this.contacts = [];

    $scope.$watch('search', () => load());

    this.submitNewContactForm = () => {
      return $api
        .then((apiRoot) => {
          return apiRoot.$request()
            .$post('contacts', null, $scope.newContact);
        })
        .then(() => load());
    };
    this.deleteContact = (contact) => {
      contact
        .$request().$del('self')
        .then(() => load());
    };

    var load = () => {
      var params = {};
      if($scope.search) {
        params.search = $scope.search;
      }
      return $api
        .then((apiRoot) => {
          return apiRoot.$request().$get('contacts', params);
        })
        .then((contactsList) => {
          return contactsList.$request().$get('item');
        })
        .then((contacts) => {
          this.contacts = contacts;
          $scope.newContactForm.$setPristine();
          delete $scope.newContact;
        });
    };

    return this;
  })
  .directive('mailto', function () {
    return {
      restrict: 'A',
      scope: {
        'mailto': '@'
      },
      link: (scope, element) => {
        element.attr('href', 'mailto:' + encodeURIComponent(scope.mailto));
      }
    };
  })
;
