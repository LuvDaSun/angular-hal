---
layout: page
title: "$halConfigurationProvider"
category: ref
date: 2016-04-27 15:40:33
---


### `addIgnoreAttributePrefix(prefix: string): void`

Add a prefix.

### `setEmbeddedAttribute(name: string): void`

Set embedded attribute name. (default: `_embedded`)

### `setForceJSONResource(force: bool): void`

Force transformation of JSON response into HAL resource. (default: `false`, **!this may break other modules!**)

### `setIgnoreAttributePrefixes(prefixes: string[]): void`

Set prefix for meta (hidden) properties. (default: `[ '_', '$' ]`)

### `setLinksAttribute(name: string): void`

Set links attribute name. (default: `_links`)

### `setSelfLink(name: string): void`

Set name of self link. (default: `self`)

### `setUrlTransformer(transformer: Function): void`

Set a function to change urls. (deprecated)
