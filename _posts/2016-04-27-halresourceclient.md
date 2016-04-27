---
layout: page
title: "HalResourceClient"
category: ref
date: 2016-04-27 16:01:28
---

Send requests for links on a resource, lookup Embedded resources.

### $request(method: string, rel: string, urlParams: Object, body: *, options: Object): Promise

### $get(rel: string, urlParams: Object, options: Object): Promise

### $post(rel: string, urlParams: Object, body: *, options: Object): Promise

### $patch(rel: string, urlParams: Object, body: *, options: Object): Promise

### $delete(rel: string, urlParams: Object, options: Object): Promise

### $link(rel: string, urlParams: Object, links: LinkHeader[]|{toString: Function}[], options: Object): Promise

### $unlink(rel: string, urlParams: Object, links: LinkHeader[]|{toString: Function}[], options: Object): Promise
