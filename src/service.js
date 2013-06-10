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
		
		function createResource(url, options, data, cache){
			if(Array.isArray(data)) return data.map(function(data){
				return createResource(url, options, data, cache);
			});

			Object.defineProperty(data, '$href', {
				configurable: false
				, enumerable: false
				, value: URI.resolve(url, getSelfLink(url, data).href)
			});


			var links = {};

			if(data._links) {
				Object
				.keys(data._links)
				.forEach(function(rel){
					var link = data._links[rel];					
					link = normalizeLink(url, link);
					links[rel] = link;
				})
				;
			}

			if(data._embedded) {
				Object
				.keys(data._embedded)
				.forEach(function(rel){
					var embedded = data._embedded[rel];
					var link = Array.isArray(embedded)
					? embedded.map(function(embedded){
						return getSelfLink(url, embedded);
					})
					: getSelfLink(url, embedded)
					;
					links[rel] = link;
				});
			}

			if(data._embedded) {
				Object
				.keys(data._embedded)
				.forEach(function(rel){
					var embedded = data._embedded[rel];
					var resource = createResource(url, options, embedded, cache);
					cacheResource(resource);
				});
			}


			function cacheResource(resource){
				if(Array.isArray(resource)) return resource.map(cacheResource);

				var href = resource.$href;

				cache[href] = $q.when(resource);
			}


			Object.defineProperty(data, '$get', {
				configurable: false
				, enumerable: false
				, value: function resource_get(rel, params){
					var link = links[rel];

					if(Array.isArray(link)) {
						return $q.all(link.map(function(link){
							var href = link.templated
							? urltemplate.parse(link.href).expand(params)
							: link.href
							;
							return get(href, options, cache);
						}));
					}
					else {
						var href = link.templated
						? urltemplate.parse(link.href).expand(params)
						: link.href
						;

						return get(href, options, cache);
					}

				}//resource_get
			});
			Object.defineProperty(data, '$post', {
				configurable: false
				, enumerable: false
				, value: function resource_post(rel, data){
					return post(links[rel].href, options, data);
				}//resource_post
			});
			Object.defineProperty(data, '$put', {
				configurable: false
				, enumerable: false
				, value: function resource_put(rel, data){
					return put(links[rel].href, options, data);
				}//resource_put
			});
			Object.defineProperty(data, '$patch', {
				configurable: false
				, enumerable: false
				, value: function resource_patch(rel, data){
					return patch(links[rel].href, options, data);
				}//resource_patch
			});
			Object.defineProperty(data, '$del', {
				configurable: false
				, enumerable: false
				, value: function resource_del(rel){
					return del(links[rel].href, options);
				}//resource_del
			});

			delete data._links;
			delete data._embedded;

			return data;

		}//createResource

		function get(url, options, cache){
			if(!cache) cache = {};

			if(cache && url in cache){
				return cache[url];
			}
			
			var resource = (
				$http(angular.extend({
					method: 'GET'
					, url: url
				}, options))
				.then(function(res){
					switch(res.status){
						case 200:
						return createResource(url, options, res.data, cache);

						default:
						return $q.reject(res.status);
					}
				})
			);

			if(cache) cache[url] = resource;

			return resource;
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


		function normalizeLink(baseHref, link){
			if(Array.isArray(link)) return link.map(function(link){
				return normalizeLink(baseHref, link);
			});

			if(link) {
				if(typeof link === 'string') link = { href: link };
				link.href = URI.resolve(baseHref, link.href);
			}
			else {
				link = { href: baseHref };			
			}

			link.href = URI.normalize(link.href);

			return link;
		}//normalizeLink


		function getSelfLink(baseHref, resource){
			return normalizeLink(baseHref, resource && resource._links && resource._links.self);
		}//getSelfLink


		return service;
	}
])//service
;
