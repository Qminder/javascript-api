#!/usr/bin/env bash
set -e
# Start the mock WS server
node ./test/mock-websocket-server.js >/dev/null &
wspid=$!

# Start the Karma test runner and pass it all the arguments to this script:
# ./test/run-tests.sh --single-run ===> karma start --log-level error --single-run
echo "Suppressing logs. Allow logs in the karma config with captureConsole: true."
./node_modules/.bin/karma start --log-level error ${@:1}

kill $wspid || :
