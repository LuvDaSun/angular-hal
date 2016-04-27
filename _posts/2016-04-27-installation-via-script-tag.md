---
layout: page
title: "Installation via script tag"
category: tut
date: 2016-04-27 15:23:26
---

**I strongly recommend using a Bundler to install and use dependencies.**

### Script Tag

Reference the js file in your html page. (After the `angular.js` file.)

There are 3 files which can be used:

 * angular-hal.min.js - Minified
 * angular-hal.js - Unminified
 * angular-hal.map.js - Unminified, includes SourceMaps

#### Bower

```html
<script src="bower_components/angular-hal/dist/angular-hal(.min/.map).js"></script>
```

#### npm

```html
<script src="node_modules/angular-hal/dist/angular-hal(.min/.map).js"></script>
```

#### no package manager

The precompiled files are available in the `dist/` directory of the repository.

```html
<script src="[somewhere]/dist/angular-hal(.min/.map).js"></script>
```

### Loading the Module

```js
angular
  .module('my-app', [
    '...',
    angularHal.default,
    '...'
  ])
;
```
