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
		
		function Resource(href, options, data, cache){
			href = getSelfLink(href, data).href;

			Object.defineProperty(this, '$href', {
				configurable: false
				, enumerable: false
				, value: href
			});

			Object.defineProperty(this, '$get', {
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
			Object.defineProperty(this, '$post', {
				configurable: false
				, enumerable: false
				, value: function resource_post(rel, data){
					return post(links[rel].href, options, data);
				}//resource_post
			});
			Object.defineProperty(this, '$put', {
				configurable: false
				, enumerable: false
				, value: function resource_put(rel, data){
					return put(links[rel].href, options, data);
				}//resource_put
			});
			Object.defineProperty(this, '$patch', {
				configurable: false
				, enumerable: false
				, value: function resource_patch(rel, data){
					return patch(links[rel].href, options, data);
				}//resource_patch
			});
			Object.defineProperty(this, '$del', {
				configurable: false
				, enumerable: false
				, value: function resource_del(rel){
					return del(links[rel].href, options);
				}//resource_del
			});


			Object.keys(data)
			.filter(function(key){
				return !~['_', '$'].indexOf(key[0]);
			})
			.forEach(function(key){
				Object.defineProperty(this, key, {
					configurable: false
					, enumerable: true
					, value: data[key]
				});
			}, this)
			;

			


			var links = {};

			if(data._links) {
				Object
				.keys(data._links)
				.forEach(function(rel){
					var link = data._links[rel];					
					link = normalizeLink(href, link);
					links[rel] = link;
				}, this)
				;
			}

			if(data._embedded) {
				Object
				.keys(data._embedded)
				.forEach(function(rel){
					var embedded = data._embedded[rel];
					var link = getSelfLink(href, embedded);
					links[rel] = link;
				}, this);
			}

			if(data._embedded) {
				Object
				.keys(data._embedded)
				.forEach(function(rel){
					var embedded = data._embedded[rel];
					var resource = createResource(href, options, embedded, cache);
				}, this);
			}

		}//Resource


		function createResource(href, options, data, cache){
			if(Array.isArray(data)) return data.map(function(data){
				return createResource(href, options, data, cache);
			});

			var resource = new Resource(href, options, data, cache);

			cache[resource.$href] = $q.when(resource);

			return resource;

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
			if(Array.isArray(resource)) return resource.map(function(resource){
				return getSelfLink(baseHref, resource);
			});

			return normalizeLink(baseHref, resource && resource._links && resource._links.self);
		}//getSelfLink


		return service;
	}
])//service
;
