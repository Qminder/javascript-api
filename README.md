# Qminder Javascript API
[![npm](https://img.shields.io/npm/v/qminder-api.svg)](https://www.npmjs.com/package/qminder-api)

[Documentation][doc] | [API Reference][api] | [Support][support]

The Qminder Javascript API library, supporting both Node.js (from 10.0) and browsers.

### Setup

The Qminder Javascript API can be installed from npm:

    # for npm users
    npm install --save qminder-api
    # for yarn users
    yarn add qminder-api

### Usage

You can use Qminder API by importing it with the node.js module system.

    // CommonJS / Node.js
    const Qminder = require('qminder-api');
    Qminder.setKey(...);

    // ES6
    import Qminder from 'qminder-api';
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

Alternatively, you can send a [GraphQL](https://graphql.org/) query to the Qminder API:

    const locations = await Qminder.graphql.query(`{
        locations {
            id
            name
        }
    }`);

The GraphQL API is self-documenting. Specialized query tools and IDE integrations can
automatically query the API schema and validate queries before they are sent.

### Testing changes to Javascript API in another project

When contributing to the JS API, you may wish to test if it works in a project that utilizes the API
library. To include your local dev version of the Javascript API for the project:

```bash
# 1. Build
yarn build
yarn link
# 2. cd into the project you want to use API on
cd $PROJECT
# 3. install the local JS API folder, and keep track of its changes
yarn link qminder-api
# 4. Recompile the code
# ./build.sh
# webpack
# ... whatever build tool you use
# The project now uses your local development copy of the Javascript API.
# The JS API will be symlinked into your project, which means you can keep changing the
# JS API until your new feature works.
```

### Contributing

To contribute to the Qminder API, set up your development environment, then clone the source code.

To run various tasks on the code, use the following commands:

**Build the library**: `yarn build`
**Test the library**: `yarn test` or `yarn test-node`
**Compile documentation into the docs/ folder:**: `yarn docs`

## Questions?

If you have any questions, please feel free to contact
[Qminder Support][support].

## LICENSE

Copyright 2021 Qminder Limited.

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
[integration]: https://dashboard.qminder.com/integration/
