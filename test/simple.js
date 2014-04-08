/* global describe, it, beforeEach, afterEach, expect */
/* global module, inject */

describe('simple', function () {
    var halClient, $httpBackend;

    beforeEach(module('angular-hal'));
    beforeEach(inject(function ($injector) {
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
                "_links": {
                    "self": "/"
                }
            });

        var resource = halClient.$get('/').then(function (resource) {
            expect(resource).toEqual({});
        });

        $httpBackend.flush();
    });


    it('should get resource', function () {
        $httpBackend
            .expect('GET', '/')
            .respond({
                "test": true,
                "_links": {
                    "self": "/"
                }
            });

        var resource = halClient.$get('/').then(function (resource) {
            expect(resource).toEqual({
                "test": true
            });
        });

        $httpBackend.flush();
    });

    it('should get link by templated url', function () {
        $httpBackend
            .expect('GET', 'http://example.com/')
            .respond({
                "root": true,
                "_links": {
                    "self": "/",
                    "item": {
                        templated: true,
                        href: "/item{/id}"
                    }
                }
            });

        $httpBackend
            .expect('GET', 'http://example.com/item/1')
            .respond({
                "id": 1,
                "_links": {
                    "self": "/item/1"
                }
            });

        var resource = halClient.$get('http://example.com/').then(function (resource) {
            expect(resource).toEqual({
                "root": true
            });

            resource.$get('item', {
                id: 1
            }).then(function (resource) {
                expect(resource).toEqual({
                    "id": 1
                });
            });
        });

        $httpBackend.flush();
    });

    it('should get lists', function () {
        $httpBackend
            .expect('GET', 'http://example.com/')
            .respond({
                "root": true,
                "_links": {
                    "self": "/",
                    "item": {
                        templated: true,
                        href: "/item{/id}"
                    }
                },
                "_embedded": {
                    "item": [{
                        "id": 1,
                        "_links": {
                            "self": "/item/1"
                        }
                    }, {
                        "id": 2,
                        "_links": {
                            "self": "/item/2"
                        }
                    }, {
                        "id": 3,
                        "_links": {
                            "self": "/item/3"
                        }
                    }]
                }
            });

        var resource = halClient.$get('http://example.com/').then(function (resource) {
            expect(resource).toEqual({
                "root": true
            });

            resource.$get('item').then(function (resource) {
                expect(resource[0]).toEqual({
                    "id": 1
                });
                expect(resource[1]).toEqual({
                    "id": 2
                });
                expect(resource[2]).toEqual({
                    "id": 3
                });
            });
        });

        $httpBackend.flush();
    });


    it('should transform url', function () {
        $httpBackend
            .expect('GET', 'http://example.com/api/')
            .respond({
                "root": true,
                "_links": {
                    "self": "/",
                    "item": {
                        templated: true,
                        href: "/item{/id}"
                    }
                }
            });

        $httpBackend
            .expect('GET', 'http://example.com/api/item/1')
            .respond({
                "id": 1,
                "_links": {
                    "self": "/item/1"
                }
            });

        var resource = halClient.$get('https://example.com/', {
            transformUrl: transformUrl
        }).then(function (resource) {
            expect(resource).toEqual({
                "root": true
            });

            resource.$get('item', {
                id: 1
            }).then(function (resource) {
                expect(resource).toEqual({
                    "id": 1
                });
            });
        });

        $httpBackend.flush();

        function transformUrl(url) {
            var from = 'https://example.com/';
            var to = 'http://example.com/api/';

            if (url.substring(0, from.length) === from) {
                return to + url.substring(from.length);
            }


            return url;
        }
    });

    it('should get build href from a templated link', function () {
        $httpBackend
            .expect('GET', 'https://example.com/')
            .respond({
                "root": true,
                "_links": {
                    "self": "/",
                    "item": {
                        templated: true,
                        href: "/item{/id}"
                    }
                }
            });

        var resource = halClient.$get('https://example.com/', {}).then(function (resource) {
            expect(resource).toEqual({
                "root": true
            });

            expect(resource.$href('item', {
                id: 1
            })).toEqual('https://example.com/item/1');
        });

        $httpBackend.flush();
    });

});