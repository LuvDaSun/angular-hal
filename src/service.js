angular
.module('ebuHal', [])
.service('halClient', [
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

			Object.keys(this._embedded)
			.forEach(function(rel){
				var embedded = this._embedded[rel];
				
				this._links[rel] = (
					Array.isArray(embedded)
					? embedded.map(function(embedded){
						embedded._links.self
					})
					: embedded._links.self
				);

			})
			delete this._embedded;



			return angular.extend({
				get: function(rel, params){
					var href = relationHref(this, rel, params);
						
					return get(resolveUrl(url, href), options, data);
				}//get

				, post: function(rel, data){
					var href = relationHref(this, rel, null);
						
					return post(resolveUrl(url, href), options, data);

				}//post

				, put: function(rel, data){
					var href = relationHref(this, rel, null);
						
					return put(resolveUrl(url, href), options, data);
				}//put

				, patch: function(rel, data){
					var href = relationHref(this, rel, null);

					return patch(resolveUrl(url, href), options, data);
				}//patch

				, del: function(rel){
					var href = relationHref(this, rel, null);

					return del(resolveUrl(url, href), options);
				}//del

			}, data)
			
		}//createResource

		function get(url, options){

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
			var re = /^(?:\w+\:)?.*?\/\/.*?[^\/]*/;
			var match;

			if(re.test(url)) return url;

			match = re.exec(base);

			if(match && url[0] == '/'){
				return match[0] + url;
			}

			throw 'bad url';
		}//resolveUrl


		function relationHref(resource, relation, params){
			var link, href;

			if(!(this._links && rel in this._links)) throw 'relation not found';

			link = this._links[rel];

			if(Array.isArray(link)) throw 'this method cannot be performed on an array';

			if(link.href) href = link.href;
			else href = link;

			if(link.template) href = urltemplate.parse(href).expand(params);

			return href;
		}//relationHref

		return service;
	}
])//service
;
