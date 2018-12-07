#!/bin/sh
set -e

#
# Compile Qminder API to be used via Node.js.
#

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

# Clean before build
rm -rf build-node

# Use sed to replace ENV in fetch/websocket imports to node for compiling
sedi "s:../lib/websocket-web:../lib/websocket-node:" src/services/EventsService.ts
sedi "s:../lib/websocket-web:../lib/websocket-node:" src/services/GraphQLService.ts
tsc --declaration --outDir build-node --module commonjs --target ES2015 ./src/qminder-api.ts

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')

sedi "s/VERSION/'$qminderVersion'/" build-node/qminder-api.js
# Use sed to replace ENV in fetch/websocket imports back
sedi "s:../lib/websocket-node:../lib/websocket-web:" src/services/EventsService.ts
sedi "s:../lib/websocket-node:../lib/websocket-web:" src/services/GraphQLService.ts
