# angular-hal

[![Build Status](https://travis-ci.org/LuvDaSun/angular-hal.svg?branch=master)](https://travis-ci.org/LuvDaSun/angular-hal)
[![Bower version](https://badge.fury.io/bo/angular-hal.svg)](https://badge.fury.io/bo/angular-hal)
[![npm version](https://badge.fury.io/js/angular-hal.svg)](https://badge.fury.io/js/angular-hal)
[![Dependency Status](https://david-dm.org/LuvDaSun/angular-hal.svg)](https://david-dm.org/LuvDaSun/angular-hal)

```bash
npm install angular-hal --save
```

[Check our Documentation](https://luvdasun.github.io/angular-hal/)

## Versions

### 3.0.0

Version 3.0.0 includes a breaking change: the response interceptor no longer returns a Resource, instead it returns an Angular `$http` response object.
This only affects consuming code when using the `$http` service directly.

To migrate from 2.x to 3.x, make the following change to your code:

```js
const halConfig = {
    headers: {
        'Accept': 'application/hal+json'
    }
};

// 2.x
$http.get('/api/users', halConfig).then(function (resource) {
  console.log(resource.$hasEmbedded('users')); // true    
});

// 3.x
$http.get('/api/users', halConfig).then(function (response) {
  const resource = response.data;  
  console.log(resource.$hasEmbedded('users')); // true    
});

// 3.x with ES6
$http.get('/api/users', halConfig).then(({ data: resource }) => {
  console.log(resource.$hasEmbedded('users')); // true    
});
```

Other integrations points are **unchanged**. For example, using `halResourceClient`:

```js
let $apiRoot;

$http.get('/api', halConfig)
  .then(function (response) {
    $apiRoot = response.data;   
  });

// later
$apiRoot.$request().$get('users')
  .then(function (resource) {
    console.log(resource.$hasEmbedded('users')); // true    
  });
```
