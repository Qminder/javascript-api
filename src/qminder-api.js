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

/**
 * Set the Qminder API key.
 * This function sets the API key and enables you to use the API methods.
 * @param key  the Qminder API key
 */
const setKey = (key: string) => {
  ApiBase.setKey(key);
  EventsService.setKey(key);
};

/**
 * Set the Qminder API server hostname.
 * @param server  the API server hostname, for example "api.qminder.com"
 * @private
 */
const setServer = (server: string) => {
  ApiBase.setServer(server);
  EventsService.setServer(`wss://${server}:443`);
};

// VERSION is replaced with the version string from package.json during compile time
const qminderVersion = VERSION;

export {
  DeviceService as devices,
  EventsService as events,
  LineService as lines,
  LocationService as locations,
  TicketService as tickets,
  UserService as users,
  WebhooksService as webhooks,

  qminderVersion as version,
  setKey,
  setServer,

  ApiBase,
  Desk,
  Device,
  Line,
  Location,
  Ticket,
  User,
  Webhook,
};
