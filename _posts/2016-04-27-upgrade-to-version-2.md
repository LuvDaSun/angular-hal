---
layout: page
title: "Upgrade to Version 2"
category: tut
date: 2016-04-27 15:31:36
---

### Methods

A few methods have changed. The original `HalClient` still exists, but is deprecated and will be removed soon.

| **old**              | **new**                       |
|----------------------|-------------------------------|
| halClient.$*         | $http()                       |
| halClient.LinkHeader | LinkHeader                    |
| resource.$[method]   | resource.$request().$[method] |

### URL Transformer

The URL Transformer function is deprecated and will be removed soon. Use [Interceptors](https://docs.angularjs.org/api/ng/service/$http#interceptors) instead.

The old URL transformer can still be used by giving the method to `$halConfigurationProvider.setUrlTransformer`. A deprecation warning will be thrown.
