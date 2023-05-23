/**
 * Run this script with
 * yarn build
 * API_KEY=XXX ts-node ./examples/events/example-new-visitors.ts
 */

import { Qminder } from '../../build/index.js';

Qminder.setKey(process.env.API_KEY);

async function findAllLocations() {
  const response = await Qminder.GraphQL.query(
    '{ locations { id name } }',
  );
  return response.data.locations;
}

async function listenForNewVisitors(location) {
  console.log(`Listening for new visitors in ${location.name}`);
  /*
   * This query subscribes to any ticket creation events in the
   * location specified by `locationId`.
   */
  const query = `createdTickets(locationId: ${location.id}) {
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
  const observable = Qminder.GraphQL.subscribe(query);

  /*
   * With that RxJS Observable, all RxJS things can be done.
   * Here is an example of a simple subscription to print
   * the results into the console.
   */
  observable.subscribe(
    (data) => console.log('Data from stream:', data),
    (error) => console.error('Error in stream:', error),
    () => console.log('Stream completed'),
  );
}

findAllLocations().then((locations) => {
  locations.forEach(listenForNewVisitors);
});

Qminder.GraphQL.getSubscriptionConnectionObservable().subscribe({
  next(value) { console.log('subscription connection status: ', value); },
  error(value) { console.error('failed sub conn status: ', value); },
  complete() { console.info('sub conn status completed'); }
});
