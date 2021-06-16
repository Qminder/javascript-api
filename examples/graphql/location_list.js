/*
 * An example of running GraphQL queries in a Node.js script.
 *
 * To run this script, make sure you have Node version 7.10.1 or up (because it uses async/await
 * syntax). You can check by running `node --version`.
 *
 * Then, get the API key for your Account:
 *
 *     # In Unix/Linux-based operating systems:
 *     export API_KEY=123456789012345678901234567
 *     # In Windows:
 *     set API_KEY=123456789012345678901234567
 *
 * Third, make sure the API is compiled:
 *
 *     npm run build-node
 *
 * Finally, run the script:
 *
 *     node location_list.js
 */

const Qminder = require('../../build-node/qminder-api');

Qminder.setKey(process.env.API_KEY);

async function getLocations() {
  try {
    const result = await Qminder.graphql(`{
       locations {
         id
         name
       }
    }`);

    if (result.errors && result.errors.length > 0) {
      /*
       * result = {
       *   "statusCode": 200,
       *   "errors": [
       *     { "message": "Validation error of /.../", ... }
       *   ]
       * };
       */
      console.log(result.errors);
      return;
    }

    /*
     * result = {
     *   "statusCode": 200,
     *   "errors": [],
     *   "data": {
     *     "locations": [
     *       { "id": 14205, "name": "Service Center" },
     *       { "id": 14214, "name": "HQ" },
     *       { "id": 14399, "name": "London Branch" },
     *     ]
     *   }
     * }
     */
    console.log(
      'Locations: ',
      result.data.locations.map((location) => location.name),
    );
  } catch (err) {
    console.error('Error: ', err);
  }
}

getLocations();
