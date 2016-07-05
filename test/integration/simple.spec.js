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

  it('should get self', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        test: true,
        _links: {
          self: '/',
        },
      });

    $httpBackend
      .expect('GET', '/')
      .respond({
        test: false,
        _links: {
          self: '/',
        },
      });

    halClient.$get('/').then(function(resource) {
      expect(toObject(resource)).toEqual({
        test: true,
      });
      resource.$request().$getSelf().then(function(resource) {
        expect(toObject(resource)).toEqual({
          test: false,
        });
      });
    });
    $httpBackend.flush();
  });

  it('should get collection of resources', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        somedata: 'data',
        _links: {
          books: '/books',
        },
      });

    const mockBooks = [{title: 'some book'}, {title: 'another book'}];
    $httpBackend
      .expect('GET', '/books')
      .respond({
        _embedded: {
          books: mockBooks,
        },
      });

    halClient.$get('/').then(function (resource) {
      resource.$request().$getCollection('books')
        .then(books => {
          expect(books.length).toEqual(2);
          expect(toObject(books[0])).toEqual(mockBooks[0]);
          expect(toObject(books[1])).toEqual(mockBooks[1]);
        });
    });
    $httpBackend.flush();
  });

  it('should get empty collection whe no embedded or link is found', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        somedata: 'data',
        _links: {
          books: '/books',
        },
      });

    $httpBackend
      .expect('GET', '/books')
      .respond({});

    halClient.$get('/').then(function (resource) {
      resource.$request().$getCollection('books')
        .then(books => {
          expect(books).toEqual([]);
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
