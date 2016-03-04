describe('simple', function () {
  var $http
    , $httpBackend;

  beforeEach(module('angular-hal', function($halConfigurationProvider) {
    $halConfigurationProvider.setForceJSONResource(true);
    $halConfigurationProvider.setUrlTransformer(transformUrl);

    function transformUrl(url) {
      var from = 'http://example.com/'
        , to = 'http://example.com/api/';

      if (url.substring(0, from.length) === from) {
        return to + url.substring(from.length);
      }

      return url;
    }
  }));
  beforeEach(inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $http = $injector.get('$http');
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should transform url', function () {
    $httpBackend
      .expectGET('http://example.com/api/')
      .respond({
        root: true,
        _links: {
          self: '/',
          item: {
            templated: true,
            href: '/item{/id}'
          }
        }
      });

    $httpBackend
      .expectGET('http://example.com/api/item/1')
      .respond({
        id: 1,
        _links: {
          self: '/item/1'
        }
      });

    $http({ url: 'http://example.com/api/' }).then(function (resource) {
      expect(resource).toEqual({
        root: true
      });

      resource.$request().$get('item', {
        id: 1
      }).then(function (resource) {
        expect(resource).toEqual({
          id: 1
        });
      });
    });

    $httpBackend.flush();
  });

});
