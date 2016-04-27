'use strict';

import angularHal from '../src/index';

describe('simple', function () {
  var $http
    , $httpBackend;

  beforeEach(angular.mock.module(angularHal));

  beforeEach(angular.mock.inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $http = $injector.get('$http');
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should transform exact content type', function () {
    $httpBackend
      .expect('GET', '/')
      .respond(
        200,
        {},
        {
          'Content-Type': 'application/hal+json',
        }
      );

    $http({url:  '/'})
      .then(function (resource) {
        expect(resource.constructor.name).toEqual('Resource');
      });

    $httpBackend.flush();
  });

  it('should transform extended content type', function () {
    $httpBackend
      .expect('GET', '/')
      .respond(
        200,
        {},
        {
          'Content-Type': 'application/hal+json;charset=utf8',
        }
      );

    $http({url:  '/'})
      .then(function (resource) {
        expect(resource.constructor.name).toEqual('Resource');
      });

    $httpBackend.flush();
  });

  it('should not transform foreign content type', function () {
    $httpBackend
      .expect('GET', '/')
      .respond(
        200,
        {},
        {
          'Content-Type': 'text/plain',
        }
      );

    $http({url:  '/'})
      .then(function (resource) {
        expect(resource.constructor.name).toEqual('Object');
      });

    $httpBackend.flush();
  });

  it('should not transform without content type', function () {
    $httpBackend
      .expect('GET', '/')
      .respond(
        200,
        {},
        {}
      );

    $http({url:  '/'})
      .then(function (resource) {
        expect(resource.constructor.name).toEqual('Object');
      });

    $httpBackend.flush();
  });
});
