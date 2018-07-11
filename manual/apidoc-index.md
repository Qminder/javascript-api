# Qminder API

The Qminder Javascript API library, supporting both Node.js (from 5.12.0) and browsers.

The API is written in Typescript and provides Typescript declaration files alongside the Javascript
code.

## Including in your project

The Node.js package includes three distributions:

- build-web: bundled, minified ES5 ready package, ready for inclusion via a `<script>` tag.
  This distribution includes one script file that can be included directly on the web page.
- build-node: separated, minified Node.js package, including type declarations and sourcemaps.
  This distribution will be used when you are creating a Node.js project.
- build-es6: separated, minified ES6+ package, using imports and async syntax, including type
  declarations and sourcemaps. This distribution will be used if you use webpack or similar software
  to package your code.

This package is set up in a way that you should be able to simply use the following code to include
Qminder API in your project:

```
var Qminder = require('qminder-api');
```

Alternatively, using ES6 `import` syntax:

```
import * as Qminder from 'qminder-api';
```

## Setting up

Before starting to use API methods, it's necessary to provide your API key to the Qminder API.

The API key can be found in [Qminder Dashboard](https://dashboard.qminder.com) under Account Setup.

```
// This line of code needs to be before any other API calls, otherwise you get an error!
Qminder.setKey('COPIED_API_KEY_GOES_HERE');
```
## Using the API

The functionality of Qminder API is grouped under different Services. For example, to work with
visitors in the Qminder queue, you should use `Qminder.tickets`.

Qminder API services are built based on [Promises][promise]. This means that Qminder API can be 
used with `await` keywords in modern Javascript and `.then()` callbacks in ES5.

Unless specifically mentioned otherwise, the API code examples are written using modern 
Javascript (ES2015) standards. To write code according to modern JS standards, use latest 
versions of Node.js, or in the browser, compile to an older version of Javascript.

Here's a list of things you can do with the Qminder API:

- [`Qminder.devices`][ds]: List and manage Apple TVs attached to a location. 
- [`Qminder.events`][es]: Listen to realtime events of your location and perform actions when they occur.
- [`Qminder.lines`][lis]: List, create or remove lines in a location.
- [`Qminder.locations`][los]: Get information about the current location.
- [`Qminder.tickets`][ts]: Query visitor data, search for visitors, modify visitor properties, put 
  them back in the queue, automatically label your visitors and more.
- [`Qminder.users`][us]: Create and manage users, their permissions and user information.
- [`Qminder.webhooks`][ws]: Create and remove webhooks.

[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises

[ds]: ./classes/_services_deviceservice_.deviceservice.html
[es]: ./classes/_services_eventsservice_.eventsservice.html
[lis]: ./classes/_services_lineservice_.lineservice.html
[los]: ./classes/_services_locationservice_.locationservice.html
[ts]: ./classes/_services_ticketservice_.ticketservice.html
[us]: ./classes/_services_userservice_.userservice.html
[ws]: ./classes/_services_webhooksservice_.webhooksservice.html

## Example

An example Web project has been included under [`examples/list_of_locations`][ex_web].

Another example for Node.js has been included in [`examples/search-tickets.js`][ex_node].

Some example GraphQL queries have been included in [`examples/graphql`][ex_gql].

[ex_web]: https://github.com/Qminder/javascript-api/tree/master/examples/list_of_locations
[ex_node]: https://github.com/Qminder/javascript-api/blob/master/examples/search-tickets.js
[ex_gql]: https://github.com/Qminder/javascript-api/tree/master/examples/graphql/
