/* global describe, it, beforeEach, afterEach, expect */
/* global module, inject */

describe('special attribute names', function () {
    var halClient, $httpBackend;

    beforeEach(module('angular-hal'));
    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        halClient = $injector.get('halClient');
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
    });


    it('should get embedde item resource', function () {
        $httpBackend
            .expect('GET', '/')
            .respond({
                "links": {
                    "self": "/"
                },
                "embedded": {
                    "testing": {
                        "links": {
                            "self": "/testing"
                        },
                        "id": "one!"
                    }
                }
            });

        var resource = halClient.$get('/', {
            linksAttribute: "links",
            embeddedAttribute: "embedded"
        }).then(function (resource) {
            expect(resource).toEqual({});

            return resource.$get('testing').then(function (resource) {
                expect(resource).toEqual({
                    "id": "one!"
                });
            });
        });

        $httpBackend.flush();
    });

    it('should get linked item resource', function () {
        $httpBackend
            .expect('GET', '/')
            .respond({
                "links": {
                    "self": "/",
                    "testing": "/testing"
                }
            });

        $httpBackend
            .expect('GET', '/testing')
            .respond({
                "links": {
                    "self": "/testing"
                },
                "id": "one!"
            });

        var resource = halClient.$get('/', {
            linksAttribute: "links",
            embeddedAttribute: "embedded"
        }).then(function (resource) {
            expect(resource).toEqual({});

            return resource.$get('testing').then(function (resource) {
                expect(resource).toEqual({
                    "id": "one!"
                });
            });
        });

        $httpBackend.flush();
    });


});