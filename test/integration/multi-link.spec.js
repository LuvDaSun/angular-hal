'use strict';

import angularHal from '../../src/index';

describe('special attribute names', function () {
  var $http
    , $httpBackend;

  beforeEach(angular.mock.module(angularHal, function($halConfigurationProvider) {
    $halConfigurationProvider.setForceJSONResource(true);
  }));
  beforeEach(angular.mock.inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $http = $injector.get('$http');
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should be able to handle multiple links', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        _links: {
          self: '/',
          multiString: [
            '/link/string1',
            '/link/string2',
          ],
          multiObject: {
            href: [
              '/link/object1{?query}',
              '/link/object2{?query}',
            ],
            templated: true,
          },
          multiArray: [
            {
              href: '/link/array1{?query}',
              templated: true,
            },
            {
              href: '/link/array2{?query}',
              templated: true,
            },
          ],
        },
      });
    $httpBackend
      .expect('GET', '/link/array1')
      .respond({});
    $httpBackend
      .expect('GET', '/link/array2')
      .respond({});

    $http({url: '/'})
      .then(function({ data: resource }) {
        expect(resource.$href('multiString')).toEqual([
          '/link/string1',
          '/link/string2',
        ]);
        expect(resource.$href('multiObject', { query: 'something' })).toEqual([
          '/link/object1?query=something',
          '/link/object2?query=something',
        ]);
        expect(resource.$href('multiArray', { query: 'something' })).toEqual([
          '/link/array1?query=something',
          '/link/array2?query=something',
        ]);

        return resource.$request().$get('multiArray');
      })
      .then(function(listResult) {
        expect(listResult.length).toEqual(2);
      });

    $httpBackend.flush();
  });
});
