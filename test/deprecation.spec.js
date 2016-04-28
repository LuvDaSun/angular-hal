'use strict';

import angularHal from '../src/index';

describe('deprecation', function () {
  beforeEach(angular.mock.module(angularHal));

  beforeEach(angular.mock.inject(function($httpBackend, $http, $log) {
    this.$httpBackend = $httpBackend;
    this.$http = $http;
    this.$log = $log;
  }));

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
  });

  it('should log a notice if the deprecation value of a link is set', function () {
    this.$httpBackend
      .expect('GET', '/')
      .respond(200, {
        _links: {
          test1: {
            href: '/foo',
            deprecation: 'http://some.url/with/infos',
          },
          test2: {
            href: '/foo',
            deprecation: 'http://some.url/with/infos',
          },
        },
      },
      {
        'Content-Type': 'application/hal+json',
      });

    this.$http({url:  '/'})
      .then((resource) => {
        resource.$link('test1');
        expect(this.$log.warn.logs.length).toEqual(1);
        expect(this.$log.warn.logs[0][0])
          .toEqual('The link "test1" is marked as deprecated with the value "http://some.url/with/infos".');

        this.$log.reset();

        resource.$href('test2');
        expect(this.$log.warn.logs.length).toEqual(1);
        expect(this.$log.warn.logs[0][0])
          .toEqual('The link "test2" is marked as deprecated with the value "http://some.url/with/infos".');
      });

    this.$httpBackend.flush();
  });
});
