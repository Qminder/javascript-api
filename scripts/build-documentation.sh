#!/bin/sh
set -ex
#
# Build the documentation for the API.
#

# Generate the documentation
node_modules/.bin/documentation build src/qminder-api.js -f html -o docs
