#!/bin/sh
set -ex
#
# Build the documentation for the API.
# Replace "ENV" in the two environment-specific imports, so that documentation.js can traverse
# the dep graph and won't error out on fetch & websocket.
#

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

# Replace "ENV" to "web" for both imports that are environment-specific
sedi "s:./lib/fetch-ENV:./lib/fetch-web:" src/api-base.js
sedi "s:../lib/websocket-ENV:../lib/websocket-web:" src/services/EventsService.js

# Generate the documentation
node_modules/.bin/documentation build src/qminder-api.js -f html -o docs

# Replace "web" back to env so it's like it never happened
sedi "s:./lib/fetch-web:./lib/fetch-ENV:" src/api-base.js
sedi "s:../lib/websocket-web:../lib/websocket-ENV:" src/services/EventsService.js
