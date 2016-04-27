---
layout: page
title: "Installation via a Bundler"
category: tut
date: 2016-04-27 15:14:37
---

### Supported Bundlers

Currently these bundlers are supported:

 * [Browserify](http://browserify.org/)
 * [Webpack](https://webpack.github.io/)
 * [jspm](http://jspm.io/)

### ES2015 / ES6

The library is written using ES2015 loaders. A transpiler like [Babel](https://babeljs.io/) has to be used to build the module.

Here you find information on how to set it up in your Bundler:

 * Browserify: https://github.com/babel/babelify
 * Webpack: https://github.com/babel/babel-loader/blob/master/README.md
 * jspm: ES2015 Loaders are automatically installed with jspm.

### Loading the Module

```js
import angular from 'angular';
import angularHal from 'angular-hal';

angular
  .module('my-app', [
    '...',
    angularHal,
    '...'
  ])
;
```
