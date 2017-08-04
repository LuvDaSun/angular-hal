'use strict';

import angularHal from '../../src/index';
import { toObject } from '../helpers';

describe('simple', function () {
  var $http
    , $httpBackend;

  beforeEach(angular.mock.module(angularHal, function($halConfigurationProvider) {
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
  beforeEach(angular.mock.inject(function ($injector) {
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
            href: '/item{/id}',
          },
        },
      });

    $httpBackend
      .expectGET('http://example.com/api/item/1')
      .respond({
        id: 1,
        _links: {
          self: '/item/1',
        },
      });

    $http({ url: 'http://example.com/api/' }).then(function ({ data: resource }) {
      expect(toObject(resource)).toEqual({
        root: true,
      });

      resource.$request().$get('item', {
        id: 1,
      }).then(function (resource) {
        expect(toObject(resource)).toEqual({
          id: 1,
        });
      });
    });

    $httpBackend.flush();
  });

});
