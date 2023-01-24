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

rm -rf build
tsc -p .

sedi "s/VERSION/'$qminderVersion'/g" ./build/qminder-api.js
