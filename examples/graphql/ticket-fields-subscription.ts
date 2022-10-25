/*
 * An example of running GraphQL subscriptions in a Node.js script.
 *
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
 *     yarn build
 *
 * Finally, run the script:
 *
 *     npx ts-node ticket-fields-subscription.ts
 */

import * as Qminder from '../../build/qminder-api';

Qminder.setKey(process.env.API_KEY);

async function subscribeToTicketFieldChanges() {
  try {
    const query = `
        subscription { 
          changedTicketFields(locationId: 673) {
            id
            title
            ... on ChangedUniTicketField {
              value
            }
            ... on ChangedMultiTicketField {
                values
            }
            ticket {
              id
            }
          }
        }`;

    const observable = Qminder.graphql.subscribe(query);
    const subscription = observable.subscribe(
      (data) => console.log('Data from stream:', data),
      (error) => console.error('Error in stream:', error),
      () => console.log('Stream completed'),
    );

    setTimeout(() => subscription.unsubscribe(), 180000);
  } catch (err) {
    console.error('Error: ', err);
  }
}

subscribeToTicketFieldChanges();
