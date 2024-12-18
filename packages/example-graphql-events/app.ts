import { Qminder } from 'qminder-api';
import gql from 'graphql-tag';

interface LocationsResponse {
  locations: Location[];
}

interface Location {
  id: string;
  name: string;
}

interface Ticket {
  id: string;
  firstName: string;
  lastName: string;
}

interface TicketCreatedEvent {
  createdTickets: Ticket;
}

async function findFirstLocationId(): Promise<Location> {
  let result: LocationsResponse;
  try {
    result = await Qminder.GraphQL.query(gql`
      {
        locations {
          id
          name
        }
      }
    `);
  } catch (e) {
    throw new Error(`Failed to find locations. Error: ${JSON.stringify(e)}`);
  }

  if (result.locations.length < 1) {
    throw new Error('Account does not have any locations');
  }

  console.log(`Found ${result.locations.length} locations`);
  return result.locations[0];
}

async function listenForTickets() {
  if (!process.env.API_KEY) {
    console.error('Please set API key first by executing "export API_KEY=XXX"');
    console.error(
      'More information: https://developer.qminder.com/reference/overview',
    );
    throw new Error('API key is not set');
  }

  Qminder.setKey(process.env.API_KEY);

  console.log('Example of GraphQL events in Qminder');

  let location = await findFirstLocationId();
  console.log(`Listening for new visitors in: ${location.name}`);

  const observable = Qminder.GraphQL
    .subscribe(`subscription { createdTickets(locationId: ${location.id}) {
            id 
            firstName 
            lastName 
        }
        }`);

  observable.subscribe((event: TicketCreatedEvent) =>
    console.log(`New visitor: ${JSON.stringify(event.createdTickets)}`),
  );
}

listenForTickets();
