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

	it('should get link by template', function(){
		$httpBackend
		.expect('GET', '/')
		.respond({
			"root": true
			, "_links": {
				"self": "/"
				, "item": "/item{/id}"
			}
		})
		;

		$httpBackend
		.expect('GET', '/item/1')
		.respond({
			"id": 1
			, "_links": {
				"self": "/item/1"
			}
		})
		;

		var resource = halClient.$get('/').then(function(resource){
			expect(resource).toEqual({"root": true});

			resource.$get('item', {id: 1}).then(function(resource){
				expect(resource).toEqual({"id": 1});
			});
		});

		$httpBackend.flush();
	});


});