/*
 * An example of running GraphQL subscriptions in a Node.js script.
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
 *     node subscription.js
 */

const Qminder = require('../../build/qminder-api');

Qminder.setKey(process.env.API_KEY);

async function getCreatedTickets() {
  try {
    /*
     * This query subscribes to any ticket creation events in the
     * location specified by `locationId`.
     */
    const query = `createdTickets(locationId: 673) {
            id 
            firstName 
            lastName 
            line { 
                id 
                name 
            }
        }`;

    /*
     * Successfully subscribing returns an RxJS Observable.
     * In the case of a badly constructed query or other errors
     * the API will output an error message to the console.
     */
    const observable = Qminder.graphql.subscribe(query);

    /*
     * With that RxJS Observable, all RxJS things can be done.
     * Here is an example of a simple subscription to print
     * the results into the console.
     */
    const subscription = observable.subscribe(
      (data) => console.log('Data from stream:', data),
      (error) => console.error('Error in stream:', error),
      () => console.log('Stream completed'),
    );

    /*
     * To unsubscribe from an observable,
     * call the unsubscribe method
     */
    setTimeout(() => subscription.unsubscribe(), 180000);
  } catch (err) {
    console.error('Error: ', err);
  }
}

getCreatedTickets();
