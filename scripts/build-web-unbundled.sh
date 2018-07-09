#!/bin/sh
set -e

#
# Compile Qminder API to be included with tools like Webpack.
#

tsc --declaration --outDir build-es6 --module esnext --target es2017

# Use sed to replace VERSION in qminder-api.js
qminderVersion=$(cat package.json | jq -r '.version')

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi "s/VERSION/'$qminderVersion'/" build-es6/qminder-api.js
