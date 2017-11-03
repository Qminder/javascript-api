#!/bin/sh
set -e
printf "\x1b[32mCompiling web...\x1b[0m\n"
npm run build-web

printf "\x1b[32mTesting web...\x1b[0m\n"
npm run test-web

printf "\x1b[32mCompiling node...\x1b[0m\n"
npm run build-node
