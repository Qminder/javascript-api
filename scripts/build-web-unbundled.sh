#!/bin/sh
set -e

#
# Compile Qminder API v2 for ES6 inclusion with tools like Closure Compiler.
#

# Use babel to compile all source files
babel src \
    -d build-es6 \
    --quiet \
    --plugins transform-flow-strip-types \
    --presets es2017 \
    --no-babelrc \
    --no-comments

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi "s/VERSION/'$qminderVersion'/" build-es6/qminder-api.js

# Use sed to replace ENV in fetch/websocket imports
sedi "s:./lib/fetch-ENV:./lib/fetch-web:" build-es6/api-base.js
sedi "s:../lib/websocket-ENV:../lib/websocket-web:" build-es6/services/EventsService.js

# Copy all sources next to the compiled files, with ".flow" in the end of the name
for flowSource in $(find src -name "*.js"); do
    cutFlowSource=$(echo $flowSource | cut -c 5-)
    echo ${flowSource} "->" ${cutFlowSource}.flow
    cp ${flowSource} build-es6/${cutFlowSource}.flow
done
