#!/bin/sh
set -ex
#
# Build the documentation for the API.
#
exec ./node_modules/.bin/typedoc \
     --mode modules \
     --out docs \
     --excludePrivate \
     --exclude "**/lib/*.ts" \
     --name Qminder \
     --readme manual/apidoc-index.md \
     src
