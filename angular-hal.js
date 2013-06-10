angular
.module('angular-hal', [])
.service('halClient', [
	'$http'
	, '$q'
	, function(
		$http
		, $q
	){
		return {
			$get: function(href, options){
				return callService('GET', href, options);
			}//get
			, $post: function(href, options, data){
				return callService('POST', href, options, data);
			}//post
			, $put: function(href, options, data){
				return callService('PUT', href, options, data);
			}//put
			, $patch: function(href, options, data){
				return callService('PATCH', href, options, data);
			}//patch
			, $del: function(href, options){
				return callService('DELETE', href, options);
			}//del
		};

	
		function Resource(href, options, data){
			var links = {};
			var cache = {};

			href = getSelfLink(href, data).href;

			defineHiddenProperty(this, '$href', href);

			defineHiddenProperty(this, '$flush', function(rel, params) {
				var link = links[rel];
				return flushLink(link, params);
			});
			defineHiddenProperty(this, '$get', function(rel, params){
				var link = links[rel];
				return callLink('GET', link, params);
			});
			defineHiddenProperty(this, '$post', function(rel, params, data){
				var link = links[rel];
				return callLink('POST', link, params, data);
			});
			defineHiddenProperty(this, '$put', function(rel, params, data){
				var link = links[rel];
				return callLink('PUT', link, params, data);
			});
			defineHiddenProperty(this, '$patch', function(rel, params, data){
				var link = links[rel];
				return callLink('PATCH', link, params, data);
			});
			defineHiddenProperty(this, '$del', function(rel, params){
				var link = links[rel];
				return callLink('DELETE', link, params);
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

					var resource = createResource(href, options, embedded);
					cacheResource(resource);
				}, this);
			}

			function defineHiddenProperty(target, name, value) {
				Object.defineProperty(target, name, {
					configurable: false
					, enumerable: false
					, value: value
				});
			}//defineHiddenProperty


			function cacheResource(resource) {
				if(Array.isArray(resource)) return resource.map(function(resource){
					return cacheResource(resource);
				});

				cache[resource.$href] = $q.when(resource);
			}//cacheResource

			function callLink(method, link, params, data) {
				if(Array.isArray(link)) return $q.all(link.map(function(link){
					if(method !== 'GET') throw 'method is not supported for arrays';

					return callLink(method, link, params, data);
				}));

				var linkHref = link.templated
				? urltemplate.parse(link.href).expand(params)
				: link.href
				;

				if(method === 'GET') {
					if(linkHref in cache) return cache[linkHref];
					
					return cache[linkHref] = callService(method, linkHref, options, data);
				}
				else {
					return callService(method, linkHref, options, data);	
				}

			}//callLink

			function flushLink(link, params) {
				if(Array.isArray(link)) return link.map(function(link){
					return flushLink(link, params);
				});

				var linkHref = link.templated
				? urltemplate.parse(link.href).expand(params)
				: link.href
				;

				if(linkHref in cache) delete cache[linkHref];
			}//flushLink

		}//Resource




		function createResource(href, options, data){
			if(Array.isArray(data)) return data.map(function(data){
				return createResource(href, options, data);
			});

			var resource = new Resource(href, options, data);

			return resource;

		}//createResource


		function normalizeLink(baseHref, link){
			if(Array.isArray(link)) return link.map(function(link){
				return normalizeLink(baseHref, link);
			});

			if(link) {
				if(typeof link === 'string') link = { href: link };
				link.href = resolveUrl(baseHref, link.href);
			}
			else {
				link = { href: baseHref };			
			}

			return link;
		}//normalizeLink


		function getSelfLink(baseHref, resource){
			if(Array.isArray(resource)) return resource.map(function(resource){
				return getSelfLink(baseHref, resource);
			});

			return normalizeLink(baseHref, resource && resource._links && resource._links.self);
		}//getSelfLink



		function callService(method, href, options, data){
			if(!options) options = {};

			var resource = (
				$http({
					method: method
					, url: href
					, headers: options.headers
					, data: data
				})
				.then(function(res){
					switch(res.status){
						case 200:
						return createResource(href, options, res.data);

						case 201:
						return res.headers('Content-Location');

						case 204:
						return null

						default:
						return $q.reject(res.status);
					}
				})
			);

			return resource;
		}//callService



		function resolveUrl(baseHref, href){
			var resultHref = '';
			var reFullUrl = /^(\w+\:)?(\/\/)?([^\/]*)(\/.*)$/;
			var baseHrefMatch = reFullUrl.exec(baseHref);
			var hrefMatch = reFullUrl.exec(href);

			for(var partIndex = 1; partIndex < 5; partIndex++) {
				if(hrefMatch[partIndex]) resultHref += hrefMatch[partIndex];
				else resultHref += baseHrefMatch[partIndex]
			}

			return resultHref;
		}//resolveUrl

	}
])//service
;
