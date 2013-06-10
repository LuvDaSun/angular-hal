angular
.module('ebuHal', [])
.service('halClient', [
	'$http'
	, '$q'
	, function(
		$http
		, $q
	){
		return {
			$get: service_get
			, $post: service_post
			, $put: service_put
			, $patch: service_patch
			, $del: service_del
		};

		
		function service_get(href, options){
			if(!options) options = {};

			var resource = (
				$http({
					method: 'GET'
					, url: href
					, headers: options.headers
				})
				.then(function(res){
					switch(res.status){
						case 200:
						return createResource(href, options, res.data);

						default:
						return $q.reject(res.status);
					}
				})
			);

			return resource;
		}//get

		function service_post(href, options, data){
			if(!options) options = {};

			return (
				$http({
					method: 'POST'
					, url: href
					, headers: options.headers
					, data: data
				})
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

		function service_put(href, options, data){
			if(!options) options = {};
			
			return (
				$http({
					method: 'PUT'
					, url: href
					, headers: options.headers
					, data: data
				})
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

		function service_patch(href, options, data){
			if(!options) options = {};
			
			return (
				$http({
					method: 'PATCH'
					, url: href
					, headers: options.headers
					, data: data
				})
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


		function service_del(href, options){
			if(!options) options = {};
			
			return (
				$http({
					method: 'DELETE'
					, url: href
					, headers: options.headers
				})
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



		function Resource(href, options, data){
			var links = {};
			var cache = {};

			href = getSelfLink(href, data).href;

			Object.defineProperty(this, '$href', {
				configurable: false
				, enumerable: false
				, value: href
			});

			Object.defineProperty(this, '$flush', {
				configurable: false
				, enumerable: false
				, value: function() {
					cache = {};
				}
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
							return service_get(href, options);
						}));
					}
					else {
						var href = link.templated
						? urltemplate.parse(link.href).expand(params)
						: link.href
						;

						return service_get(href, options);
					}

				}//resource_get
			});
			Object.defineProperty(this, '$post', {
				configurable: false
				, enumerable: false
				, value: function resource_post(rel, data){
					return service_post(links[rel].href, options, data);
				}//resource_post
			});
			Object.defineProperty(this, '$put', {
				configurable: false
				, enumerable: false
				, value: function resource_put(rel, data){
					return service_put(links[rel].href, options, data);
				}//resource_put
			});
			Object.defineProperty(this, '$patch', {
				configurable: false
				, enumerable: false
				, value: function resource_patch(rel, data){
					return service_patch(links[rel].href, options, data);
				}//resource_patch
			});
			Object.defineProperty(this, '$del', {
				configurable: false
				, enumerable: false
				, value: function resource_del(rel){
					return service_del(links[rel].href, options);
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
					var resource = createResource(href, options, embedded);
				}, this);
			}

		}//Resource


		function createResource(href, options, data){
			if(Array.isArray(data)) return data.map(function(data){
				return createResource(href, options, data);
			});

			var resource = new Resource(href, options, data);

			if('cache' in options) options.cache[resource.$href] = $q.when(resource);

			return resource;

		}//createResource


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





	}
])//service
;
