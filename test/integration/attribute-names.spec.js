'use strict';

import angularHal from '../../src/index';
import { toObject } from '../helpers';

describe('special attribute names', function () {
  var halClient
    , $httpBackend;

  beforeEach(angular.mock.module(angularHal, function($halConfigurationProvider) {
    $halConfigurationProvider.setLinksAttribute('links');
    $halConfigurationProvider.setEmbeddedAttribute('embedded');
    $halConfigurationProvider.setForceJSONResource(true);
  }));
  beforeEach(angular.mock.inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend');
    halClient = $injector.get('halClient');
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
  });


  it('should get embedded item resource', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        links: {
          self: '/',
        },
        embedded: {
          testing: {
            links: {
              self: '/testing',
            },
            id: 'one!',
          },
        },
      });

    halClient.$get('/')
      .then(function (resource) {
        expect(toObject(resource)).toEqual({});

        return resource.$request()
          .$get('testing')
          .then(function (resource) {
            expect(toObject(resource)).toEqual({
              id: 'one!',
            });
          });
      });

    $httpBackend.flush();
  });

  it('should get linked item resource', function () {
    $httpBackend
      .expect('GET', '/')
      .respond({
        links: {
          self: '/',
          testing: '/testing',
        },
      });

    $httpBackend
      .expect('GET', '/testing')
      .respond({
        links: {
          self: '/testing',
        },
        id: 'one!',
      });

    halClient.$get('/')
      .then(function (resource) {
        expect(toObject(resource)).toEqual({});

        return resource.$request()
          .$get('testing').then(function (resource) {
            expect(toObject(resource)).toEqual({
              id: 'one!',
            });
          });
      });

    $httpBackend.flush();
  });


});
