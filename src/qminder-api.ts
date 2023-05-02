// Import data structures
import Desk from './model/Desk.js';
import Device from './model/Device.js';
import Line from './model/Line.js';
import Location from './model/Location.js';
import Ticket from './model/Ticket.js';
import User from './model/User.js';
import Webhook from './model/Webhook.js';
import { ClientError } from './model/ClientError.js';

// Import services
import ApiBase from './api-base.js';
import DeviceService from './services/device/DeviceService';
import LineService from './services/line/LineService';
import LocationService from './services/location/LocationService';
import TicketService from './services/ticket/TicketService';
import UserService from './services/user/UserService';
import WebhooksService from './services/webhooks/WebhooksService';
import GraphQLService from './services/graphql/GraphQLService';
import { ConnectionStatus } from './model/connection-status.js';

// Export all data structures
export {
  ApiBase,
  Desk,
  Device,
  Line,
  Location,
  Ticket,
  User,
  Webhook,
  ClientError,
};

// Export misc structures
export { ConnectionStatus };

// Export all services
export {
  /** List and manage Apple TVs attached to a location. */
  DeviceService as devices,
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
  GraphQLService as graphql,
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
  GraphQLService.setServer(server);
};
