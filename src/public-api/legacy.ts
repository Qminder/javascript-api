import Desk from '../lib/model/desk';
import Device from '../lib/model/device';
import Line from '../lib/model/line';
import Location from '../lib/model/location';
import Ticket from '../lib/model/ticket';
import User from '../lib/model/user';
import Webhook from '../lib/model/webhook';
import { ClientError } from '../lib/model/client-error';
import { ConnectionStatus } from '../lib/services/graphql/graphql.service';
import { Qminder } from '../lib/qminder';

const ApiBase = Qminder.ApiBase;
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

export { ConnectionStatus };

const devices = Qminder.Device;
const lines = Qminder.Line;
const locations = Qminder.Location;
const tickets = Qminder.Ticket;
const users = Qminder.User;
const webhooks = Qminder.Webhooks;
const graphql = Qminder.GraphQL;
export {
	devices,
	lines,
	locations,
	tickets,
	users,
	webhooks,
	graphql,
};

/**
 * Set the Qminder API key.
 *
 * This function sets the API key and enables you to use the API methods.
 *
 * @param key  the Qminder API key
 */
export const setKey = (key: string) => {
	Qminder.setKey(key);
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
	Qminder.setServer(server);
};
