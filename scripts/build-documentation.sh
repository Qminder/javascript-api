#!/bin/sh
set -ex
#
# Build the documentation for the API.
#

rm -rf docs

yarn run typedoc

# This is needed so GitHub Pages doesn't 404 every _* file/directory
# https://help.github.com/en/articles/files-that-start-with-an-underscore-are-missing
touch docs/.nojekyll
