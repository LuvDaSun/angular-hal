describe('simple', function(){
	var halClient, httpBackend;

	beforeEach(module('angular-hal'));
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		halClient = $injector.get('halClient');
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
	});


	it('should get empty resource', function(){
		$httpBackend
		.expect('GET', '/')
		.respond({
			"_links": {
				"self": "/"
			}
		})
		;

		var resource = halClient.$get('/').then(function(resource){
			expect(resource).toEqual({});
		});

		$httpBackend.flush();
	});


	it('should get resource', function(){
		$httpBackend
		.expect('GET', '/')
		.respond({
			"test": true
			, "_links": {
				"self": "/"
			}
		})
		;

		var resource = halClient.$get('/').then(function(resource){
			expect(resource).toEqual({"test": true});
		});

		$httpBackend.flush();
	});

	it('should get link by templated url', function(){
		$httpBackend
		.expect('GET', 'http://example.com/')
		.respond({
			"root": true
			, "_links": {
				"self": "/"
				, "item": {
					templated: true
					, href: "/item{/id}"
				}
			}
		})
		;

		$httpBackend
		.expect('GET', 'http://example.com/item/1')
		.respond({
			"id": 1
			, "_links": {
				"self": "/item/1"
			}
		})
		;

		var resource = halClient.$get('http://example.com/').then(function(resource){
			expect(resource).toEqual({"root": true});

			resource.$get('item', {id: 1}).then(function(resource){
				expect(resource).toEqual({"id": 1});
			});
		});

		$httpBackend.flush();
	});


});