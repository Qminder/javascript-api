// Import data structures
import Desk from './model/desk';
import Device from './model/device';
import Line from './model/line';
import Location from './model/location';
import Ticket from './model/ticket';
import User from './model/user';
import Webhook from './model/webhook';
import { ClientError } from './model/client-error';

// Import services
import ApiBase from './services/api-base/api-base';
import DeviceService from './services/device/device.service';
import LineService from './services/line/line.service';
import LocationService from './services/location/location.service';
import TicketService from './services/ticket/ticket.service';
import UserService from './services/user/user.service';
import WebhooksService from './services/webhooks/webhooks.service';
import GraphQLService from './services/graphql/graphql.service';
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
