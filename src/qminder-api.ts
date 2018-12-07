// Import data structures
import Desk from './model/Desk';
import Device from './model/Device';
import Line from './model/Line';
import Location from './model/Location';
import Ticket from './model/Ticket';
import User from './model/User';
import Webhook from './model/Webhook';

// Import services
import ApiBase from './api-base';
import DeviceService from './services/DeviceService';
import EventsService from './services/EventsService';
import LineService from './services/LineService';
import LocationService from './services/LocationService';
import TicketService from './services/TicketService';
import UserService from './services/UserService';
import WebhooksService from './services/WebhooksService';
import GraphQLService from './services/GraphQLService';

// Export all data structures
export {
  ApiBase,
  Desk,
  Device,
  Line,
  Location,
  Ticket,
  User,
  Webhook
};

// Export all services
export {
  /** List and manage Apple TVs attached to a location. */
  DeviceService as devices,
  /** Listen to realtime events of your location and perform actions when they occur. */
  EventsService as events,
  /** List, create or remove lines in a location. */
  LineService as lines,
  /** Get information about locations. */
  LocationService as locations,
  /** Query visitor data, search for visitors, modify visitor properties, put them back in the
   *  queue, automatically label your visitors and more. */
  TicketService as tickets,
  /** Create and manage employees, and their permissions in Qminder Dashboard. */
  UserService as users,
  /** Create and remove webhooks. */
  WebhooksService as webhooks,
  /** GraphQL */
  GraphQLService as graphql
};

/**
 * Set the Qminder API key.
 *
 * This function sets the API key and enables you to use the API methods.
 *
 * @param key  the Qminder API key
 */
export const setKey = (key: string) => {
  ApiBase.setKey(key);
  EventsService.setKey(key);
  GraphQLService.setKey(key);
};

/**
 * Set the Qminder API server hostname.
 *
 * This is used to point the API at a different server.
 *
 * @param server  the API server hostname, for example "api.qminder.com"
 * @hidden
 */
export const setServer = (server: string) => {
  ApiBase.setServer(server);
  EventsService.setServer(`wss://${server}:443`);
  GraphQLService.setServer(`wss://${server}:443`);
};

// VERSION is replaced with the version string from package.json during compile time
declare var VERSION: string;
/** @hidden */
export const version = VERSION;

