#!/bin/sh
set -e

#
# Compile Qminder API v2 for Node.js, avoiding webpack to get rid of the bundler.
#

# Use babel to compile all source files
babel src -d build-node --quiet

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')
sed -i.bak -e "s/VERSION/'$qminderVersion'/" build-node/qminder-api.js

# Use sed to replace ENV in fetch/websocket imports
sed -i.bak -e "s:./lib/fetch-ENV:./lib/fetch-node:" build-node/api-base.js
sed -i.bak -e "s:../lib/websocket-ENV:../lib/websocket-node:" build-node/services/EventsService.js

# Clean up .bak-files
for bakFile in $(find build-node -name "*.bak"); do
    rm -v $bakFile
done

# Copy all sources next to the compiled files, with ".flow" in the end of the name
for flowSource in $(find src -name "*.js"); do
    cutFlowSource=$(echo $flowSource | cut -c 5-)
    echo ${flowSource} "->" ${cutFlowSource}.flow
    cp ${flowSource} build-node/${cutFlowSource}.flow
done
