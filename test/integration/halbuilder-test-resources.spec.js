'use strict';

import angularHal from '../../src/index';
import { toObject } from '../helpers';

describe('halbuilder test resources', function () {
  var $httpBackend
    , halClient;

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


  it('should read exampleWithoutHref resource', function () {
    $httpBackend
      .expect('GET', '/exampleWithoutHref')
      .respond({
        name: 'Example Resource',
      });

    halClient.$get('/exampleWithoutHref')
      .then(function (resource) {
        expect(toObject(resource)).toEqual({
          name: 'Example Resource',
        });
      });

    $httpBackend.flush();
  });


  it('should read exampleWithArray resource', function () {
    $httpBackend
      .expect('GET', '/exampleWithArray')
      .respond({
        array: ['one', 'two', 'three'],
        name: 'Example Resource',
      });

    halClient.$get('/exampleWithArray').then(function (resource) {
      expect(toObject(resource)).toEqual({
        array: ['one', 'two', 'three'],
        name: 'Example Resource',
      });
    });

    $httpBackend.flush();
  });


  it('should read example resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [{
            href: 'https://example.com/apidocs/accounts',
            name: 'ns',
          }, {
            href: 'https://example.com/apidocs/roles',
            name: 'role',
          }],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        age: 33,
        expired: false,
        id: 123456,
        name: 'Example Resource',
        optional: true,
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({
        age: 33,
        expired: false,
        id: 123456,
        name: 'Example Resource',
        optional: true,
      });
    });

    $httpBackend.flush();
  });


  it('should read exampleWithLiteralNullProperty resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [
            {
              href: 'https://example.com/apidocs/accounts',
              name: 'ns',
            },
            {
              href: 'https://example.com/apidocs/roles',
              name: 'role',
            },
          ],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        age: 33,
        expired: false,
        id: 123456,
        name: 'Example Resource',
        nullval: 'null',
        optional: true,
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({
        age: 33,
        expired: false,
        id: 123456,
        name: 'Example Resource',
        nullval: 'null',
        optional: true,
      });
    });

    $httpBackend.flush();
  });


  it('should read exampleWithTemplate resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer')
      .respond({
        _links: {
          curie: [
            {
              href: 'https://example.com/apidocs/accounts',
              name: 'ns',
            }, {
              href: 'https://example.com/apidocs/roles',
              name: 'role',
            },
          ],
          self: {
            href: 'https://example.com/api/customer',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:query': {
            href: 'https://example.com/api/customer/search{?queryParam}',
            templated: true,
          },
        },
      });

    halClient.$get('https://example.com/api/customer').then(function (resource) {
      expect(toObject(resource)).toEqual({});
    });

    $httpBackend.flush();
  });


  it('should read exampleWithNullProperty resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [
            {
              href: 'https://example.com/apidocs/accounts',
              name: 'ns',
            }, {
              href: 'https://example.com/apidocs/roles',
              name: 'role',
            },
          ],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        age: 33,
        expired: false,
        id: 123456,
        name: 'Example Resource',
        nullprop: null,
        optional: true,
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({
        age: 33,
        expired: false,
        id: 123456,
        name: 'Example Resource',
        nullprop: null,
        optional: true,
      });
    });

    $httpBackend.flush();
  });


  it('should read exampleWithSubresource resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [
            {
              href: 'https://example.com/apidocs/accounts',
              name: 'ns',
            }, {
              href: 'https://example.com/apidocs/roles',
              name: 'role',
            },
          ],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        _embedded: {
          'ns:user': {
            _links: {
              self: {
                href: 'https://example.com/user/11',
              },
            },
            age: 32,
            expired: false,
            id: 11,
            name: 'Example User',
            optional: true,
          },
        },
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({});

      resource.$request().$get('ns:user').then(function (resource) {
        expect(toObject(resource)).toEqual({
          age: 32,
          expired: false,
          id: 11,
          name: 'Example User',
          optional: true,
        });
      });

    });

    $httpBackend.flush();
  });


  it('should read exampleWithSubresourceLinkingToItself resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [
            {
              href: 'https://example.com/apidocs/accounts',
              name: 'ns',
            }, {
              href: 'https://example.com/apidocs/roles',
              name: 'role',
            },
          ],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        _embedded: {
          'ns:user': {
            _links: {
              self: {
                href: 'https://example.com/user/11',
              },
              'role:admin': {
                href: 'https://example.com/user/11',
              },
            },
            age: 32,
            expired: false,
            id: 11,
            name: 'Example User',
            optional: true,
          },
        },
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({});

      resource.$request().$get('ns:user').then(function (resource) {
        expect(toObject(resource)).toEqual({
          age: 32,
          expired: false,
          id: 11,
          name: 'Example User',
          optional: true,
        });
      });

    });

    $httpBackend.flush();
  });


  it('should read exampleWithMultipleSubresources resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [{
            href: 'https://example.com/apidocs/accounts',
            name: 'ns',
          }, {
            href: 'https://example.com/apidocs/roles',
            name: 'role',
          }],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        _embedded: {
          'ns:user': [
            {
              _links: {
                self: {
                  href: 'https://example.com/user/11',
                },
              },
              age: 32,
              expired: false,
              id: 11,
              name: 'Example User',
              optional: true,
            },
            {
              _links: {
                self: {
                  href: 'https://example.com/user/12',
                },
              },
              age: 32,
              expired: false,
              id: 12,
              name: 'Example User',
              optional: true,
            },
          ],
        },
      });

    halClient
      .$get('https://example.com/api/customer/123456')
      .then(function (resource) {
        expect(toObject(resource)).toEqual({});

        resource
          .$request().$get('ns:user')
          .then(function (resource) {
            expect(toObject(resource[0])).toEqual({
              age: 32,
              expired: false,
              id: 11,
              name: 'Example User',
              optional: true,
            });

            expect(toObject(resource[1])).toEqual({
              age: 32,
              expired: false,
              id: 12,
              name: 'Example User',
              optional: true,
            });
          });
      });

    $httpBackend.flush();
  });


  it('should read exampleWithMultipleNestedSubresources resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          curie: [
            {
              href: 'https://example.com/apidocs/accounts',
              name: 'ns',
            },
            {
              href: 'https://example.com/apidocs/phones',
              name: 'phone',
            },
            {
              href: 'https://example.com/apidocs/roles',
              name: 'role',
            },
          ],
          self: {
            href: 'https://example.com/api/customer/123456',
          },
          'ns:parent': {
            href: 'https://example.com/api/customer/1234',
            name: 'bob',
            title: 'The Parent',
            hreflang: 'en',
          },
          'ns:users': {
            href: 'https://example.com/api/customer/123456?users',
          },
        },
        _embedded: {
          'ns:user': [
            {
              _links: {
                self: {
                  href: 'https://example.com/user/11',
                },
              },
              age: 32,
              expired: false,
              id: 11,
              name: 'Example User',
              optional: true,
              _embedded: {
                'phone:cell': {
                  _links: {
                    self: {
                      href: 'https://example.com/phone/1',
                    },
                  },
                  id: 1,
                  number: '555-666-7890',
                },
              },
            },
            {
              _links: {
                self: {
                  href: 'https://example.com/user/12',
                },
              },
              age: 32,
              expired: false,
              id: 12,
              name: 'Example User',
              optional: true,
            },
          ],
        },
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({});

      resource.$request().$get('ns:user').then(function (resource) {
        expect(toObject(resource[0])).toEqual({
          age: 32,
          expired: false,
          id: 11,
          name: 'Example User',
          optional: true,
        });

        expect(toObject(resource[1])).toEqual({
          age: 32,
          expired: false,
          id: 12,
          name: 'Example User',
          optional: true,
        });


        resource[0].$request().$get('phone:cell').then(function (resource) {
          expect(toObject(resource)).toEqual({
            id: 1,
            number: '555-666-7890',
          });

        });

      });

    });

    $httpBackend.flush();
  });

  it('should send valid LINK Request', function () {
    $httpBackend
      .expect('LINK', 'https://example.com/api/customer/123456', undefined, function(headers) {
        expect(headers.Link).toEqual([
          '<foo>;rel="bar";rev="baz"',
          '<lorem>;ipsum="dolor";sit="amet"',
          '<elitr>',
        ]);
        return true;
      })
      .respond(null);

    halClient.$link('https://example.com/api/customer/123456', {}, [
      new halClient.LinkHeader('foo', {rel: 'bar', rev: 'baz'}),
      new halClient.LinkHeader('lorem', {ipsum: 'dolor', sit: 'amet'}),
      new halClient.LinkHeader('elitr'),
    ]).then(function () {});

    $httpBackend.flush();
  });

  it('should send valid UNLINK Request', function () {
    $httpBackend
      .expect('UNLINK', 'https://example.com/api/customer/123456', undefined, function(headers) {
        expect(headers.Link).toEqual([
          '<foo>;rel="bar";rev="baz"',
          '<lorem>;ipsum="dolor";sit="amet"',
          '<elitr>',
        ]);
        return true;
      })
      .respond(null);

    halClient.$unlink('https://example.com/api/customer/123456', {}, [
      new halClient.LinkHeader('foo', {rel: 'bar', rev: 'baz'}),
      new halClient.LinkHeader('lorem', {ipsum: 'dolor', sit: 'amet'}),
      new halClient.LinkHeader('elitr'),
    ]).then(function () {});

    $httpBackend.flush();
  });

  it('should send valid LINK Request on Resource', function () {
    $httpBackend
      .when('GET', 'https://example.com/api/customer/123456')
      .respond({
        foo: 'bar',
        _links: {
          self: {
            href: 'https://example.com/api/customer/123456',
          },
        },
      });
    $httpBackend
      .expect('LINK', 'https://example.com/api/customer/123456', undefined, function(headers) {
        expect(headers.Link).toEqual([
          '<foo>;rel="bar";rev="baz"',
          '<lorem>;ipsum="dolor";sit="amet"',
          '<elitr>',
        ]);
        return true;
      })
      .respond(null);

    halClient.$get('https://example.com/api/customer/123456')
      .then(function (resource) {
        return resource.$request().$link('self', {}, [
          new halClient.LinkHeader('foo', {rel: 'bar', rev: 'baz'}),
          new halClient.LinkHeader('lorem', {ipsum: 'dolor', sit: 'amet'}),
          new halClient.LinkHeader('elitr'),
        ]);
      })
      .then(function () {});

    $httpBackend.flush();
  });

  it('should send valid UNLINK Request on Resource', function () {
    $httpBackend
      .when('GET', 'https://example.com/api/customer/123456')
      .respond({
        foo: 'bar',
        _links: {
          self: {
            href: 'https://example.com/api/customer/123456',
          },
        },
      });
    $httpBackend
      .expect('UNLINK', 'https://example.com/api/customer/123456', undefined, function(headers) {
        expect(headers.Link).toEqual([
          '<foo>;rel="bar";rev="baz"',
          '<lorem>;ipsum="dolor";sit="amet"',
          '<elitr>',
        ]);
        return true;
      })
      .respond(null);

    halClient.$get('https://example.com/api/customer/123456')
      .then(function (resource) {
        return resource.$request().$unlink('self', {}, [
          new halClient.LinkHeader('foo', {rel: 'bar', rev: 'baz'}),
          new halClient.LinkHeader('lorem', {ipsum: 'dolor', sit: 'amet'}),
          new halClient.LinkHeader('elitr'),
        ]);
      })
      .then(function () {});

    $httpBackend.flush();
  });

  it('should resolve promise to error with invalid rel', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({});

    halClient.$get('https://example.com/api/customer/123456')
      .then(function (resource) {
        return resource.$request().$get('invalid-rel');
      })
      .then(
        function() {
          fail('Should not be successfull');
        },
        function(error) {
          expect(error.message).toEqual('link "invalid-rel" is undefined');
        }
      );

    $httpBackend.flush();
  });

  it('should read meta from the resource', function () {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {},
        _embedded: {},
        _someMeta: 'some value',
        property: 'value',
      });

    halClient.$get('https://example.com/api/customer/123456').then(function (resource) {
      expect(toObject(resource)).toEqual({
        property: 'value',
      });
      expect(resource.$meta('someMeta')).toEqual('some value');
    });

    $httpBackend.flush();
  });

  it('should get link Object when available', function() {
    $httpBackend
      .expect('GET', 'https://example.com/api/customer/123456')
      .respond({
        _links: {
          cart: {
            href: 'https://example.com/api/customer/123456/cart',
            title: 'Shopping Cart',
          },
          department: {
            href: 'https://example.com/api/customer/123456/department',
            title: 'Department',
          },
        },
      });

    halClient.$get('https://example.com/api/customer/123456')
      .then(function (resource) {
        expect(resource.$link('cart')).toEqual({
          href: 'https://example.com/api/customer/123456/cart',
          title: 'Shopping Cart',
        });

        expect(resource.$link('department')).toEqual({
          href: 'https://example.com/api/customer/123456/department',
          title: 'Department',
        });

        expect(function() {
          resource.$link('nonExistent');
        }).toThrow(new Error('link "nonExistent" is undefined'));
      });

    $httpBackend.flush();
  });
});
