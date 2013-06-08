/*

tests from halbuilder-test-resources-2.02
git://github.com/HalBuilder/halbuilder-test-resources.git

*/


describe('halbuilder test resources', function(){
	var halClient, httpBackend;

	beforeEach(module('ebuHal'));
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		halClient = $injector.get('halClient');
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
	});



	var resources = {
		"/example": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"age" : 33,
			"expired" : false,
			"id" : 123456,
			"name" : "Example Resource",
			"optional" : true
		}//example

		, "/exampleWithArray": {
			"array" : [ "one", "two", "three" ],
			"name" : "Example Resource"
		}//exampleWithArray

		, "/exampleWithLiteralNullProperty": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"age" : 33,
			"expired" : false,
			"id" : 123456,
			"name" : "Example Resource",
			"nullval" : "null",
			"optional" : true
		}//exampleWithLiteralNullProperty

		, "/exampleWithMultipleNestedSubresources": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/phones",
					"name" : "phone"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"_embedded" : {
				"ns:user" : [ {
					"_links" : {
						"self" : {
							"href" : "https://example.com/user/11"
						}
					},
					"age" : 32,
					"expired" : false,
					"id" : 11,
					"name" : "Example User",
					"optional" : true,
					"_embedded" : {
						"phone:cell" : {
							"_links" : {
								"self" : {
									"href" : "https://example.com/phone/1"
								}
							},
							"id" : 1,
							"number" : "555-666-7890"
						}
					}
				}, {
					"_links" : {
						"self" : {
							"href" : "https://example.com/user/12"
						}
					},
					"age" : 32,
					"expired" : false,
					"id" : 12,
					"name" : "Example User",
					"optional" : true
				} ]
			}
		}//exampleWithMultipleNestedSubresources

		, "/exampleWithMultipleSubresources": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"_embedded" : {
				"ns:user" : [ {
					"_links" : {
						"self" : {
							"href" : "https://example.com/user/11"
						}
					},
					"age" : 32,
					"expired" : false,
					"id" : 11,
					"name" : "Example User",
					"optional" : true
				}, {
					"_links" : {
						"self" : {
							"href" : "https://example.com/user/12"
						}
					},
					"age" : 32,
					"expired" : false,
					"id" : 12,
					"name" : "Example User",
					"optional" : true
				} ]
			}
		}//exampleWithMultipleSubresources

		, "/exampleWithNullProperty": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"age" : 33,
			"expired" : false,
			"id" : 123456,
			"name" : "Example Resource",
			"nullprop" : null,
			"optional" : true
		}//exampleWithNullProperty

		, "/exampleWithoutHref": {
			"name" : "Example Resource"
		}//exampleWithoutHref

		, "/exampleWithSubresource": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"_embedded" : {
				"ns:user" : {
					"_links" : {
						"self" : {
							"href" : "https://example.com/user/11"
						}
					},
					"age" : 32,
					"expired" : false,
					"id" : 11,
					"name" : "Example User",
					"optional" : true
				}
			}
		}//exampleWithSubresource

		, "/exampleWithSubresourceLinkingToItself": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer/123456"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:users" : {
					"href" : "https://example.com/api/customer/123456?users"
				}
			},
			"_embedded" : {
				"ns:user" : {
					"_links" : {
						"self" : {
							"href" : "https://example.com/user/11"
						},
						"role:admin" : {
							"href" : "https://example.com/user/11"
						}
					},
					"age" : 32,
					"expired" : false,
					"id" : 11,
					"name" : "Example User",
					"optional" : true
				}
			}
		}//exampleWithSubresourceLinkingToItself

		, "/exampleWithTemplate": {
			"_links" : {
				"curie" : [ {
					"href" : "https://example.com/apidocs/accounts",
					"name" : "ns"
				}, {
					"href" : "https://example.com/apidocs/roles",
					"name" : "role"
				} ],
				"self" : {
					"href" : "https://example.com/api/customer"
				},
				"ns:parent" : {
					"href" : "https://example.com/api/customer/1234",
					"name" : "bob",
					"title" : "The Parent",
					"hreflang" : "en"
				},
				"ns:query" : {
					"href" : "https://example.com/api/customer/search{?queryParam}",
					"templated" : true
				}
			}
		}//exampleWithTemplate

	}//resources

});