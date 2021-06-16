/**
 * Run this script with
 * npm run build-node
 * API_KEY=XXX npm run example-new-visitors
 */

const Qminder = require('../../build-node/qminder-api');

Qminder.setKey(process.env.API_KEY);

interface Location {
  id: string;
  name: string;
}

async function findAllLocations(): Promise<Location[]> {
  const response: any = await Qminder.graphql.query(
    '{ locations { id name } }',
  );
  return response.data.locations;
}

async function listenForNewVisitors(location: Location) {
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
  const observable = Qminder.graphql.subscribe(query);

  /*
   * With that RxJS Observable, all RxJS things can be done.
   * Here is an example of a simple subscription to print
   * the results into the console.
   */
  observable.subscribe(
    (data: Object) => console.log('Data from stream:', data),
    (error: any) => console.error('Error in stream:', error),
    () => console.log('Stream completed'),
  );
}

findAllLocations().then((locations) => {
  locations.forEach(listenForNewVisitors);
});
