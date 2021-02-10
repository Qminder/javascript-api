#!/bin/sh
set -e
printf "\x1b[32mCompiling web bundled...\x1b[0m\n"
yarn run build-web

printf "\x1b[32mTesting web bundle...\x1b[0m\n"
yarn run test || true

printf "\x1b[32mBuilding web unbundled...\x1b[0m\n"
yarn run build-web-unbundled

printf "\x1b[32mCompiling node...\x1b[0m\n"
yarn run build-node

printf "\x1b[32mTesting node bundle...\x1b[0m\n"
yarn run test-node || true
