/**
 * Find all waiting tickets since a preset date, in the first location of your account.
 *
 * This script does not assume any information, so with some extra knowledge (the location ID,
 * for example), you can make this even shorter.
 *
 * 1. It looks up all the locations in your current account
 * 2. It takes the first location's ID, and searches for tickets with the following criteria:
 *      - Location ID: the first location's ID from the lookup performed in (1)
 *      - Minimum created date/time: 19 Oct 2017, 12:40 UTC
 *      - Status: NEW (tickets that are waiting)
 * 3. Once the query finishes, it outputs all of the received tickets.
 *
 * To run this code example:
 *
 * 1. Get the API key from your account's settings page in Qminder Dashboard.
 * 2. Set it into the environment variable "API_KEY":
 *    - For Windows: set API_KEY=yourapikeygoeshere
 *    - For Mac/Linux: export API_KEY=yourapikeygoeshere
 * 3. Run the script in Node.js:
 *    - node search-tickets.js
 */

const Qminder = require('../build-node/qminder-api');

if (!process.env.hasOwnProperty('API_KEY')) {
  console.error(`Use this script by setting the Qminder API key like this:
  API_KEY=apikeygoeshere node search-tickets.js`);
}

Qminder.setKey(process.env.API_KEY);

async function perform() {
  // 1. Look up all locations
  const locations = await Qminder.locations.list();

  // 2. Take the first location
  let locationId = null;
  if (locations.length > 0) {
    locationId = locations[0].id;
  }

  // 2. Search for tickets with the given criteria:
  const tickets = await Qminder.tickets.search({
    location: locationId,
    minCreated: '2017-10-19T12:40:00Z',
    status: ['NEW'],
  });

  // 3. Output the ticket results
  console.log(
    `Searched for all new tickets since 2017-10-19T12:40:00Z in location ${locationId}`,
  );
  console.log(tickets);
}

function onFulfilled() {
  console.log('Done!');
}

function errorHandler(error) {
  console.error(error);
}

perform().then(onFulfilled, errorHandler);
