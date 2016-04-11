# angular-hal

[![Build Status](https://travis-ci.org/LuvDaSun/angular-hal.svg?branch=master)](https://travis-ci.org/LuvDaSun/angular-hal)
[![Bower version](https://badge.fury.io/bo/angular-hal.svg)](https://badge.fury.io/bo/angular-hal)
[![npm version](https://badge.fury.io/js/angular-hal.svg)](https://badge.fury.io/js/angular-hal)
[![Dependency Status](https://david-dm.org/LuvDaSun/angular-hal.svg)](https://david-dm.org/LuvDaSun/angular-hal)

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
bower install angular-hal --save
```

## Installation

### Bower

Reference the js files in your html page

```html
<script src="bower_components/angular-hal/dist/angular-hal(.min).js"></script>
```

### NPM

Reference the js files in your html page

```html
<script src="node_modules/angular-hal/dist/angular-hal(.min).js"></script>
```

## Usage

### Webpack / Browserify

#### Non-ES6
This package is written in ES6. Please either use the built file or import the source in an ES6 enabled builder.

#### ES6 (Babel)
```js
import angular from 'angular';
import angularHal from 'angular-hal';

angular
  .module('my-app', [
    '...',
    angularHal,
    '...'
  ])
  .run(function() {
    $http({url: 'https://api.example.com/'})
      .then(function successApiRoot(apiRoot) {
        return apiRoot.$request().$get('users');
      })
      .then(function successUsers(users) {
        console.log('Those are my users:');
        console.log(users);
      })
      .catch(function(error) {
        console.error(error);
      });
  }])
;
```

## Usage Old School

You may use it like this:

```js
angular
  .module('app', [angularHal.default])
  .run(function() {
    $http({url: 'https://api.example.com/'})
      .then(function successApiRoot(apiRoot) {
        return apiRoot.$request().$get('users');
      })
      .then(function successUsers(users) {
        console.log('Those are my users:');
        console.log(users);
      })
      .catch(function(error) {
        console.error(error);
      });
  }])
;
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
