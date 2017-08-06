'use strict';

import angularHal from '../src/index';

describe('resource', function () {
  beforeEach(angular.mock.module(angularHal, function($halConfigurationProvider) {
    $halConfigurationProvider.setLinksAttribute('_links');
    $halConfigurationProvider.setEmbeddedAttribute('_embedded');
    $halConfigurationProvider.setForceJSONResource(true);
  }));

  beforeEach(angular.mock.inject(function ($httpBackend, $http) {
    this.$http = $http;
    this.$httpBackend = $httpBackend;

    $httpBackend
      .whenGET('/test')
      .respond({some:'thing'});
  }));

  it('should be read-only', function() {
    this.$http
      .get('/test')
      .then(({data: resource }) => {
        expect(() => resource.some = 'change').toThrow();
      });
    this.$httpBackend.flush();
  });
});
