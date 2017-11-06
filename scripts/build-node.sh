#!/bin/sh
set -e

#
# Compile Qminder API v2 for Node.js, avoiding webpack to get rid of the bundler.
#

# Use babel to compile all source files
babel src -d build-node --quiet

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi "s/VERSION/'$qminderVersion'/" build-node/qminder-api.js

# Use sed to replace ENV in fetch/websocket imports
sedi "s:./lib/fetch-ENV:./lib/fetch-node:" build-node/api-base.js
sedi "s:../lib/websocket-ENV:../lib/websocket-node:" build-node/services/EventsService.js

# Copy all sources next to the compiled files, with ".flow" in the end of the name
for flowSource in $(find src -name "*.js"); do
    cutFlowSource=$(echo $flowSource | cut -c 5-)
    echo ${flowSource} "->" ${cutFlowSource}.flow
    cp ${flowSource} build-node/${cutFlowSource}.flow
done
