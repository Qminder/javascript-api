#!/bin/sh
set -ex
#
# Build the documentation for the API.
#

rm -rf docs

exec ./node_modules/.bin/typedoc \
     --mode modules \
     --out docs \
     --excludePrivate \
     --exclude "**/lib/*.ts" \
     --name Qminder \
     --readme manual/apidoc-index.md \
     src
