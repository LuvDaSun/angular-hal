angular
  .module('app.debug', [])
  .config(function($httpProvider) {
    $httpProvider.interceptors.unshift('debugHttpInterceptor');
  })
  .service('$requests', function() {
    var requests = [];
    this.getRequests = function getRequests() {
      return requests;
    };
    this.addResponse = function addResponse(response) {
      requests.push({
        request: response.$response().config,
        response: response.$response(),
        resource: response,
      });
    };
  })
  .controller('requests', function($requests) {
    this.requests = $requests.getRequests();
  })
  .factory('debugHttpInterceptor', function($requests) {
    return {
      response: function(response) {
        $requests.addResponse(response);
        return response;
      },
    };
  })
;
