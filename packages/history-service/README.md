# @feature-hub/history-service

[![Package Version](https://img.shields.io/npm/v/@feature-hub/history-service.svg)](https://www.npmjs.com/package/@feature-hub/history-service)

A history facade guaranteeing safe access for multiple consumers on the same
page.

**This package is part of the
[Feature Hub](https://github.com/sinnerschrader/feature-hub) monorepo.**

## Table of Contents

- [@feature-hub/history-service](#feature-hubhistory-service)
  - [Table of Contents](#table-of-contents)
  - [Getting started](#getting-started)
  - [Motivation](#motivation)
  - [Functional Behaviour](#functional-behaviour)
    - [Location Transformer](#location-transformer)
  - [Demo](#demo)
    - [Running the Demo](#running-the-demo)
  - [Usage](#usage)
    - [As a Consumer](#as-a-consumer)
      - [In the browser:](#in-the-browser)
      - [On the server:](#on-the-server)
    - [As the Integrator](#as-the-integrator)
      - [Writing a Custom Location Transformer](#writing-a-custom-location-transformer)
  - [Caveats](#caveats)
    - [Replace & Pop](#replace--pop)
    - [Push, Push & Pop](#push-push--pop)

## Getting started

Install `@feature-hub/history-service` as a dependency:

```sh
# Install using Yarn
yarn add @feature-hub/history-service
```

```sh
# Install using npm
npm install @feature-hub/history-service
```

## Motivation

When multiple Feature Apps coexist on the same page, they shouldn't access the
browser history API directly. Otherwise, they would potentially overwrite their
respective history and location changes. This service provides an abstraction of
the [history package](https://www.npmjs.com/package/history) to enable save
access to the history for multiple consumers.

## Functional Behaviour

The History Service combines multiple consumer histories (and their locations)
into a single one. It does this by merging all registered consumer locations
into one, and persisting this combined root location on the history stack. As
long as the consumer performs all history and location interactions through the
history it obtained from the History Service, the existence of the facade and
other consumers isn't noticeable for the consumer. For example, the consumer
receives history change events only for location changes that affect its own
history.

### Location Transformer

How the root location is build from the consumer locations, is a problem that
can not be solved generally, since it is dependant on the usecase. This is why
the integrator defines the service with a so-called location transformer. The
location transformer provides functions for merging consumer locations into a
root location, and for extracting a consumer path from the root location.

For a quick out-of-the-box experience, this package also provides a location
transformer ready for use. The included location transformer has the concept of
a primary consumer. Only the primary's location (pathname and query) will get
inserted directly into the root location. All other consumer locations are
encoded into a json string which will be assigned to a single configurable query
parameter.

## Demo

There is a demo that simulates the capabilities of the History Service with two
Feature Apps.

### Running the Demo

Go to the monorepo top-level directory and install all dependencies:

```sh
yarn
```

Now run the demo:

```sh
yarn watch:demo history-service
```

## Usage

### As a Consumer

#### In the browser:

```js
import {Router} from 'react-router';

export default {
  id: 'acme:my-feature-app',

  dependencies: {
    's2:history': '^1.0'
  },

  create(env) {
    const historyService = env.featureServices['s2:history'];
    const browserHistory = historyService.createBrowserHistory();

    return {
      render: () => (
        <Router history={browserHistory}>
          <App />
        </Router>
      )
    };
  }
};
```

#### On the server:

```js
import {Router} from 'react-router';

export default {
  id: 'acme:my-feature-app',

  dependencies: {
    's2:history': '^1.0'
  },

  create(env) {
    const historyService = env.featureServices['s2:history'];
    const staticHistory = historyService.createStaticHistory();

    return {
      render: () => (
        <Router history={staticHistory}>
          <App />
        </Router>
      )
    };
  }
};
```

For both the browser and the static history, the service is API-compatible with
the history package. Note, however, that the `go`, `goBack`, `goForward` and
`block` methods are not supported. For further information, reference
[its documentation](https://www.npmjs.com/package/history).

### As the Integrator

The integrator defines the History Service with a
[location transformer](#location-transformer) and registers it at the Feature
Service registry:

```js
// In the browser:
import {FeatureServiceRegistry} from '@feature-hub/core';
import {
  defineHistoryService,
  createRootLocationTransformer
} from '@feature-hub/history-service';
import {defineServerRenderer} from '@feature-hub/server-renderer';

const registry = new FeatureServiceRegistry();

const rootLocationTransformer = createRootLocationTransformer({
  consumerPathsQueryParamName: '---'
});

const featureServiceDefinitions = [
  defineHistoryService(rootLocationTransformer),
  defineServerRenderer()
];

registry.registerProviders(featureServiceDefinitions, 'integrator');
```

On the server, the integrator defines the server renderer with a request. The
History Service depends on the server renderer to obtain its request and use it
for the initial history location:

```js
// On the server:
import {FeatureServiceRegistry} from '@feature-hub/core';
import {
  defineHistoryService,
  createRootLocationTransformer
} from '@feature-hub/history-service';
import {defineServerRenderer} from '@feature-hub/server-renderer';

const registry = new FeatureServiceRegistry();

const rootLocationTransformer = createRootLocationTransformer({
  consumerPathsQueryParamName: '---'
});

const request = {
  // ... obtain the request from somewhere, e.g. a request handler
};

const featureServiceDefinitions = [
  defineHistoryService(rootLocationTransformer),
  defineServerRenderer(request)
];

registry.registerProviders(featureServiceDefinitions, 'integrator');
```

#### Writing a Custom Location Transformer

A location transformer is an object exposing two functions,
`getConsumerPathFromRootLocation` and `createRootLocation`. In the following
example, each consumer location is encoded as its own query parameter, with the
unique consumer ID used as parameter name:

```js
import * as history from 'history';

// ...

const rootLocationTransformer = {
  getConsumerPathFromRootLocation(rootLocation, consumerId) {
    const searchParams = new URLSearchParams(rootLocation.search);

    return searchParams.get(consumerId);
  },

  createRootLocation(consumerLocation, rootLocation, consumerId) {
    const searchParams = new URLSearchParams(rootLocation.search);

    if (consumerLocation) {
      searchParams.set(consumerId, history.createPath(consumerLocation));
    } else {
      searchParams.delete(consumerId);
    }

    const {pathname, state} = rootLocation;

    return {
      pathname,
      search: searchParams.toString(),
      state
    };
  }
};

// ...
```

## Caveats

### Replace & Pop

Since multiple consumers can push and replace location changes at any time onto
the browser history, special attention must be given when **replacing** consumer
locations. Imagine the following scenario with two history service consumers (A
and B):

- A and B are initially loaded with `/`.

  | Browser History Stack | Current URL  |
  | --------------------- | ------------ |
  | /?a=**/**&b=**/**     | :arrow_left: |

* A pushes `/a1`, e.g. caused by user interaction.

  | Browser History Stack | Current URL  |
  | --------------------- | ------------ |
  | /?a=/&b=/             |              |
  | /?a=**/a1**&b=/       | :arrow_left: |

* B decides it needs to replace `/` with `/b1`, e.g. because it received some
  outdated data.

  | Browser History Stack | Current URL  |
  | --------------------- | ------------ |
  | /?a=/&b=/             |              |
  | /?a=/a1&b=**/b1**     | :arrow_left: |

* The user navigates back.

  | Browser History Stack | Current URL  |
  | --------------------- | ------------ |
  | /?a=/&b=/             | :arrow_left: |
  | /?a=/a1&b=/b1         |              |

* ⚠️ Now it is B's responsibility, again, to replace its location with `/b1` on
  the first browser history entry.

  | Browser History Stack | Current URL  |
  | --------------------- | ------------ |
  | /?a=/&b=**/b1**       | :arrow_left: |
  | /?a=/a1&b=/b1         |              |

**Note:** The alternating background colors of the table rows don't have any
meaning.

### Push, Push & Pop

When a history service consumer pushes the same location multiple times in a row
and the user subsequently navigates back, no pop event is emitted for the
unchanged location of this consumer.

---

Copyright (c) 2018 SinnerSchrader Deutschland GmbH. Released under the terms of
the
[MIT License](https://github.com/sinnerschrader/feature-hub/blob/master/LICENSE).
