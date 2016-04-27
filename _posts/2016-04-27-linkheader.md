---
layout: page
title: "LinkHeader"
category: ref
date: 2016-04-27 15:50:40
---

The `LinkHeader` is used to generate standard compliant link header to [RFC 5988](https://tools.ietf.org/html/rfc5988).

They are used by the `HalResourceClient` on the methods `$link` and `$unlink`.

### `LinkHeader(uriReference: string, linkParams: Object): void`

Parameters:

 * `uriReference` - The place where the Link points.
 * `linkParams` - Parameters for the link. Can be default ones like `rel` or new ones.

### `toString(void): string`

Generate a standard compliant Link header string.
