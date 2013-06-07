angular
.module('ebu.hal')
.service('hal', [
	'$http'
	, '$q'
	, function(
		$http
		, $q
	){
		var service = {};
		service.get = get;
		// service.post = post;
		// service.put = get;
		// service.patch = patch;
		// service.del = del;
		
		function createResource(url, options, data){
			return angular.extend({
				get: function(rel, params){
					var link, embedded;

					if(this._embedded && rel in this._embedded) {
						embedded = this._embedded[rel];
						
						return (
							Array.isArray(embedded)
							? embedded.map(function(embedded){
								return $q.when(createResource(resolveUrl(url, embedded._links.self), options, embedded));
							})
							: $q.when(createResource(resolveUrl(url, embedded._links.self), options, embedded))
						);
					}

					if(this._links && rel in this._links) {
						link = this._links[rel];

						return (
							Array.isArray(link)
							? link.map(function(link){
								return get(resolveUrl(url, link), options, params)
							})
							: get(resolveUrl(url, link), options, params)
						);
					}

					return null;
				}//get

				, post: function(data){
					return post(url, options, data);
				}//post

				, put: function(){
					return put(url, options, this);
				}//put

				, patch: function(){
					return patch(url, options, this);
				}//patch

				, del: function(){
					return del(url, options);
				}//del

			}, data)
			
		}//createResource

		function get(templatedUrl, options, params){
			var url = urltemplate.parse(templatedUrl).expand(params);
			
			return (
				$http(angular.extend({
					method: 'GET'
					, url: url
				}, options))
				.then(function(res){
					switch(res.status){
						case 200:
						return createResource(url, options, res.data);

						default:
						return $q.reject(res.status);
					}
				})
			);

		}//get

		function post(url, options, data){
			
			return (
				$http(angular.extend({
					method: 'POST'
					, url: url
					, data: data
				}, options))
				.then(function(res){
					switch(res.status){
						case 201:
						return res.headers('Content-Location');

						default:
						return $q.reject(res.status);
					}
				})
			);

		}//post

		function put(url, options, data){
			
			return (
				$http(angular.extend({
					method: 'PUT'
					, url: url
					, data: data
				}, options))
				.then(function(res){
					switch(res.status){
						case 204:
						return null

						default:
						return $q.reject(res.status);
					}
				})
			);

		}//put

		function patch(url, options, data){
			
			return (
				$http(angular.extend({
					method: 'PATCH'
					, url: url
					, data: data
				}, options))
				.then(function(res){
					switch(res.status){
						case 204:
						return null

						default:
						return $q.reject(res.status);
					}
				})
			);

		}//patch


		function del(url, options){
			
			return (
				$http(angular.extend({
					method: 'DELETE'
					, url: url
					, data: data
				}, options))
				.then(function(res){
					switch(res.status){
						case 204:
						return null

						default:
						return $q.reject(res.status);
					}
				})
			);

		}//del


		function resolveUrl(base, url){
			if(url.href) {
				return resolveUrl(base, url.href);
				//return url;
			}

			var re = /^(?:\w+\:)?.*?\/\/.*?[^\/]*/;
			var match;

			if(re.test(url)) return url;

			match = re.exec(base);

			if(match && url[0] == '/'){
				return match[0] + url;
			}

			throw 'bad url';
		}//resolveUrl


		return service;
	}
])//service
;
