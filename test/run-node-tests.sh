#!/usr/bin/env bash
set +e
# Start the mock WS server
node ./test/mock-websocket-server.js >/dev/null &
wspid=$!

JASMINE_CONFIG_PATH=./jasmine.json ./node_modules/.bin/jasmine

kill $wspid
