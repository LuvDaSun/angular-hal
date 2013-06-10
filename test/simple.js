describe('simple', function(){
	var halClient, httpBackend;

	beforeEach(module('ebuHal'));
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


});