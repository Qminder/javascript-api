// This file is an example of Typescript Qminder API usage.
import * as Qminder from '../src/qminder-api';

Qminder.setKey(process.env.APIKEY);

async function main() {
  // Example 1. HTTP API
  const locations: Qminder.Location[] = await Qminder.locations.list();
  const lines: Qminder.Line[] = await Qminder.lines.list(locations[0]);
  console.log('Example 1. Lines', lines);

  // Example 2. GraphQL API
  const locationNames = await Qminder.graphql.query(`{ locations { name } }`);
  console.log('Example 2. Location names', locationNames);

  // Example 3. HTTP API - search for tickets
  const tickets = await Qminder.tickets.search({
    location: locations[0].id,
    status: 'NEW',
  });
}

main();
