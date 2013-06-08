describe('test', function(){
	var halClient, httpBackend;

	beforeEach(module('ebuHal'));
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		halClient = $injector.get('halClient');
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
	});

	it('one', function(){

	});

});