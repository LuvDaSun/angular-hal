'use strict';

import angularHal from '../../src/index';
import { toObject } from '../helpers';

describe('simple', function () {
  var halClient
    , $httpBackend;

  beforeEach(angular.mock.module(angularHal, function($halConfigurationProvider) {
    $halConfigurationProvider.setForceJSONResource(true);
  }));
  beforeEach(angular.mock.inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend');
    halClient = $injector.get('halClient');
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  it('should get empty resource', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        _links: {
          self: '/',
        },
      });

    halClient.$get('/').then(function (resource) {
      expect(toObject(resource)).toEqual({});
    });

    $httpBackend.flush();
  });


  it('should get resource', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        test: true,
        _links: {
          self: '/',
        },
      });

    halClient.$get('/').then(function (resource) {
      expect(toObject(resource)).toEqual({
        test: true,
      });
    });

    $httpBackend.flush();
  });

  it('should get link by templated url', function () {
    $httpBackend
      .expect('GET', 'http://example.com/')
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
      .expect('GET', 'http://example.com/item/1')
      .respond({
        id: 1,
        _links: {
          self: '/item/1',
        },
      });

    halClient.$get('http://example.com/').then(function (resource) {
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

  it('should get lists', function () {
    $httpBackend
      .expect('GET', 'http://example.com/')
      .respond({
        root: true,
        _links: {
          self: '/',
          item: {
            templated: true,
            href: '/item{/id}',
          },
        },
        _embedded: {
          item: [
            {
              id: 1,
              _links: {
                self: '/item/1',
              },
            }, {
              id: 2,
              _links: {
                self: '/item/2',
              },
            }, {
              id: 3,
              _links: {
                self: '/item/3',
              },
            },
          ],
        },
      });

    halClient.$get('http://example.com/').then(function (resource) {
      expect(toObject(resource)).toEqual({
        root: true,
      });

      resource.$request().$get('item').then(function (resource) {
        expect(toObject(resource[0])).toEqual({
          id: 1,
        });
        expect(toObject(resource[1])).toEqual({
          id: 2,
        });
        expect(toObject(resource[2])).toEqual({
          id: 3,
        });
      });
    });

    $httpBackend.flush();
  });

  it('should get build href from a templated link', function () {
    $httpBackend
      .expect('GET', 'https://example.com/')
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

    halClient.$get('https://example.com/').then(function (resource) {
      expect(toObject(resource)).toEqual({
        root: true,
      });

      expect(resource.$href('item', {
        id: 1,
      })).toEqual('https://example.com/item/1');
    });

    $httpBackend.flush();
  });


  it('should get response from $res', function () {
    $httpBackend
      .expect('GET', 'https://example.com/')
      .respond({
        id: 1,
        _links: {
          self: '/',
          item: {
            templated: true,
            href: '/item{/id}',
          },
        },
      });

    halClient.$get('https://example.com/').then(function (resource) {
      expect(toObject(resource)).toEqual({
        id: 1,
      });

      expect(resource.$response().status).toEqual(200);
      expect(resource.$response().data.id).toEqual(1);
      expect(resource.$response().config.url).toEqual('https://example.com/');
    });

    $httpBackend.flush();
  });
});
