#!/bin/sh
set -e

#
# Compile Qminder API to be included with tools like Webpack.
#

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

tsc --declaration --outDir build-es6 --module esnext --target es2017 ./src/qminder-api.ts

sedi "s/VERSION/'$qminderVersion'/g" ./build-es6/qminder-api.js
