import { Qminder } from 'qminder-api';

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
  const result: any = await Qminder.GraphQL.query(`{
      locations {
          id
          name
      }
  }`);

  if (result.errors) {
    throw new Error(
      `Failed to find locations. Errors: ${JSON.stringify(result.errors)}`,
    );
  }

  if (result.data.locations.length < 1) {
    throw new Error('Account does not have any locations');
  }

  console.log(`Found ${result.data.locations.length} locations`);
  return result.data.locations[0];
}

async function listenForTickets() {
  if (!process.env.API_KEY) {
    console.error('Please set API key first by executing "export API_KEY=XXX"');
    console.error('More information: https://developer.qminder.com/reference/overview');
    process.exit(1);
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
