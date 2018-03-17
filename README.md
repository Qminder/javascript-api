# Qminder Javascript API
[![Build Status](https://travis-ci.org/Qminder/javascript-api.svg?branch=master)](https://travis-ci.org/Qminder/javascript-api) [![Dependency Status](https://gemnasium.com/Qminder/qminder-api.svg)](https://gemnasium.com/Qminder/qminder-api)
[![npm](https://img.shields.io/npm/v/qminder-api.svg)](https://www.npmjs.com/package/qminder-api)
[![Bower](https://img.shields.io/bower/v/qminder-api.svg)](http://bower.io/search/?q=qminder-api)

[Documentation][doc] | [API Reference][api] | [Support][support] | [1.0.18 link][old-api]

The Qminder Javascript API library, supporting both Node.js (from 5.12.0) and browsers.

If you're looking for [Qminder API v1.0.18, please go here.][old-api]

### Setup

The Qminder Javascript API can be installed from npm:

    npm install --save qminder-api

### Usage

You can use Qminder API by importing it into your source code. The API uses the UMD module 
definition, which means it should work with all Javascript module bundlers. For easier use, the 
API library can just be included in the page, and will be accessible via the global Qminder object.

    // CommonJS / Node.js
    const Qminder = require('qminder-api');
    Qminder.setKey(...);

    // ES6
    import Qminder from 'qminder-api';
    Qminder.setKey(...);

    // AMD
    define(function(require) {
        const Qminder = require('qminder-api');
        Qminder.setKey(...);
    });
    
    // Root object
    // No including needed - just add the script tag to HTML.
    Qminder.setKey(...);

After importing the Qminder API library, make sure to set the access token to connect to your 
Qminder account. You can get the access token from your account's 
[Integration settings][integration].

    Qminder.setKey('API Key');

Check out the Qminder API reference for various API methods. The services (TicketService, 
UserService, LineService, LocationService) will be of interest.

For starters, you can find all tickets in a line with ID 12345:

    const tickets = await Qminder.tickets.search({ status: ['NEW'], line: 12345 });

Qminder.tickets refers to TicketService, for which you can find documentation in the 
[API reference][api].

### Testing changes to Javascript API in another project

When contributing to the JS API, you may wish to test if it works in a project that utilizes the API
library. To include your local dev version of the Javascript API for the project:

```bash
# 1. Build
npm run build
# 2. cd into the project you want to use API on
cd $PROJECT
# 3. install the local JS API folder, and keep track of its changes
npm install $JAVASCRIPT_API
# 4. Recompile the code
webpack
# The project now uses your local development copy of the Javascript API.
# The JS API will be symlinked into your project, which means you can keep changing the
# JS API until your new feature works.
```

### Contributing

To contribute to the Qminder API, set up your development environment, then clone the source code.

To run various tasks on the code, use the following commands:

**Build the web version**: `npm run build-web`
**Build the node version**: `npm run build-node`
**Test the web version**: `npm run test-web` or `npm run test`
**Build web when code changes**: `npm run watch-web`
**Test web when code changes**: `npm run watch-tests`
**Compile documentation into the docs/ folder:**: `npm run docs`

## Questions?

If you have any questions, please feel free to contact
[Qminder Support][support].

## LICENSE

Copyright 2017 Qminder Limited.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[doc]: https://api.qminder.com/
[api]: https://qminder.github.io/javascript-api/
[support]: mailto:support@qminder.com
[old-api]: https://github.com/Qminder/javascript-api/tree/v1.0.18
[integration]: https://dashboard.qminder.com/integration/
