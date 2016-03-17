# angular-hal

[![Build Status](https://travis-ci.org/LuvDaSun/angular-hal.svg?branch=master)](https://travis-ci.org/LuvDaSun/angular-hal)

## Upgrade to Version 2.0

### Methods

| **old**              | **new**                       |
|----------------------|-------------------------------|
| halClient.$*         | $http()                       |
| halClient.LinkHeader | LinkHeader                    |
| resource.$[method]   | resource.$request().$[method] |

## Get It!

### NPM

```bash
npm install angular-hal --save
```

### Bower

```bash
bower install angular-hal
```

## Installation

Reference the js files in your html page

```html
<script src="bower_components/rfc6570/rfc6570.js"></script>
<script src="bower_components/angular-hal/angular-hal(.min).js"></script>
```


You may use it like this:

```js
angular
  .module('app', ['angular-hal'])
  .run(function($rootScope) {
    $http({url: 'https://api.example.com/'})
      .then(
        function success(apiRoot) {
          $rootScope.apiRoot = apiRoot;
        },
        function failure(error) {
          console.error(error);
        }
      );

    $rootScope.$watch('apiRoot', function(apiRoot){
      $rootScope.authenticatedUser = apiRoot.$request().$get('http://example.com/authenticated-user');
    });

  }]);
```

stay tuned for more!

## Configuration

Use the provider `$halConfigurationProvider` to configure the module.

### Options
 - `setLinksAttribute` - Set links attribute name. (default: `_links`)
 - `setEmbeddedAttribute` - Set embedded attribute name. (default: `_embedded`)
 - `setIgnoreAttributePrefixes` - Set prefix for meta (hidden) properties. (default: `[ '_', '$' ]`)
 - `addIgnoreAttributePrefix` - Add a prefix.
 - `setSelfLink` - Set name of self link. (default: `self`)
 - `setForceJSONResource` - Force transformation of JSON response into HAL resource. (default: `false`, **!this may break other modules!**)
 - `setUrlTransformer` - Set a function to change urls. (deprecated)

## check this out!
 - [A blog post by Yuan Ji about Angular-HAL](https://www.jiwhiz.com/post/2014/4/Consume_RESTful_API_With_Angular_HAL)
 - [Role-based SPAs with AngularJS and Spring HATEOAS](https://paulcwarren.wordpress.com/2015/04/03/role-based-spas-with-angularjs-and-spring-hateoas/)
 - [Hypermedia REST API client for AngularJS applications](https://github.com/jcassee/angular-hypermedia)

## compatibility

If you wish to use this service in old (ie) browsers, you may need to use the following polyfills:
- es5shim & es5sham, https://github.com/kriskowal/es5-shim, some parts of the service use es5 methods.
- xhr-polyfill, https://github.com/LuvDaSun/xhr-polyfill, if you want to make cross domain requests in ie8 / ie9.
