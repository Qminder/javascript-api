#!/bin/sh
set -e

#
# Compile Qminder API to be included with tools like Webpack.
#

rm -rf build
yarn run tsc --declaration --outDir build --module commonjs --target es2017 --moduleResolution node --esModuleInterop true ./src/qminder-api.ts
