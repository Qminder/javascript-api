#!/bin/sh
set -e

#
# Compile Qminder API to be used via Node.js.
#

tsc --declaration --outDir build-node --module commonjs --target ES2015

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi "s/VERSION/'$qminderVersion'/" build-node/qminder-api.js

# Use sed to replace ENV in fetch/websocket imports
sedi "s:./lib/fetch-web:./lib/fetch-node:" build-node/api-base.js
sedi "s:../lib/websocket-web:../lib/websocket-node:" build-node/services/EventsService.js
