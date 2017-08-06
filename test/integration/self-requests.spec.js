"use strict";

import angularHal from "../../src/index";

/**
 * Test suite for $[*]Self methods of hal-resource-client.
 */
describe("requests on self", function() {
  var $http, $httpBackend;

  beforeEach(
    angular.mock.module(angularHal, function($halConfigurationProvider) {
      $halConfigurationProvider.setForceJSONResource(true);
    })
  );
  beforeEach(
    angular.mock.inject(function($injector) {
      $httpBackend = $injector.get("$httpBackend");
      $http = $injector.get("$http");
    })
  );

  beforeEach(function() {
    $httpBackend.expect("GET", "/someresource").respond({
      test: true,
      _links: {
        self: "/someresource"
      }
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it("should get self", function() {
    $httpBackend.expect("GET", "/someresource").respond({
      test: true,
      _links: {
        self: "/someresource"
      }
    });

    $http.get("/someresource").then(({ data: resource }) => {
      resource.$request().$getSelf();
    });
    $httpBackend.flush();
  });

  it("should post self", function() {
    $httpBackend.expect("POST", "/someresource", { data: "hello" }).respond({});

    $http.get("/someresource").then(({ data: resource }) => {
      resource.$request().$postSelf({ data: "hello" });
    });
    $httpBackend.flush();
  });

  it("should put self", function() {
    $httpBackend
      .expect("PUT", "/someresource", { test: true, data: "hello" })
      .respond({});

    $http.get("/someresource").then(({ data: resource }) => {
      resource.$request().$putSelf({ test: true, data: "hello" });
    });
    $httpBackend.flush();
  });

  it("should patch self", function() {
    $httpBackend
      .expect("PATCH", "/someresource", { data: "hello" })
      .respond({});

    $http.get("/someresource").then(({ data: resource }) => {
      resource.$request().$patchSelf({ data: "hello" });
    });
    $httpBackend.flush();
  });

  it("should link self", function() {
    $httpBackend
      .expect(
        "LINK",
        "/someresource",
        null,
        headers => headers["Link"][0] === "aaa"
      )
      .respond({});

    $http.get("/someresource").then(({ data: resource }) => {
      resource.$request().$linkSelf(["aaa"]);
    });
    $httpBackend.flush();
  });

  it("should unlink self", function() {
    $httpBackend
      .expect(
        "UNLINK",
        "/someresource",
        null,
        headers => headers["Link"][0] === "aaa"
      )
      .respond({});

    $http.get("/someresource").then(({ data: resource }) => {
      resource.$request().$unlinkSelf(["aaa"]);
    });
    $httpBackend.flush();
  });
});
