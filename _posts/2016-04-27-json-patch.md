---
layout: page
title: "JSON Patch"
category: exa
date: 2016-04-27 16:07:17
---

```
npm install rfc6902 --save
```

```js
'use strict';

import { createPatch } from 'rfc6902';

export default class PatchService {
  /**
   * Create Patch
   * @param  {Resource} originalResource
   * @param  {Object}   modified
   * @return {Patch[]}
   */
  diff(originalResource, modified) {
    return createPatch(originalResource, modified);
  }
  /**
   * Create Patch
   * @param  {Resource} originalResource
   * @param  {Object}   modified
   * @return {Patch[]}
   */
  save(originalResource, modified) {
    return originalResource.$request()
      .$patch('self', {}, this.diff(originalResource, modified));
  }
}
```
