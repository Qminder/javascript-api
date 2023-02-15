#!/bin/sh
set -e

#
# Compile Qminder API to be included with tools like Webpack.
#

rm -rf build
yarn run tsc -p .
