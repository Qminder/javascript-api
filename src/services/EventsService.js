
import WebSocket from '../lib/websocket-ENV';
import Ticket from '../model/Ticket';

/**
 * The type of event to receive notifications for.
 */
type EventType = 'TICKET_CREATED' | 'TICKET_CALLED' | 'TICKET_RECALLED' | 'TICKET_CANCELLED' |
  'TICKET_SERVED' | 'TICKET_CHANGED' | 'OVERVIEW_MONITOR_CHANGE' | 'SIGN_IN_CHANGE' |
  'LINES_CHANGED';

/** A callback type that takes a parameter of type T and the return value is ignored. */
type EventCallback<T> = (T) => void;

/** An event filter. */
type EventFilter = ?{ line?: number, location?: number };

/** An event subscription. These are kept in an array for re-subscription. */
type EventSubscription = {
  subscribe: EventType,
  id: string,
  line?: number,
  location?: number,
  parameters?: { id: number },
};

/**
 * Interface for the Qminder WebSocket events API.
 *
 * The events API allows listening to Qminder events over a WebSocket connection. The events can
 * be filtered so only relevant messages will reach the source code.
 *
 * To start using the events API, simply set the API key and add an event callback.
 *
 * For example:
 *
 * ```
 * const apiKey = 'asdfApiKey';
 * Qminder.setKey(apiKey);
 * Qminder.events.onTicketCalled((event) => {
 *    console.log(event);
 * }, { location: 1234 });
 * ```
 *
 * When the WebSocket connection drops, the API will automatically try to reconnect to the
 * socket repeatedly, until the connection has been established.
 *
 * When the WebSocket connection is lost and regained, any events that happened in the meantime
 * will not be repeated to the client. However, the API will automatically re-subscribe to all
 * previously subscribed events.
 */
class EventsService {

  /** The Qminder API key
   * @private */
  apiKey: string;

  /** The WebSocket instance used to connect to the Qminder API.
   * @private */
  socket: WebSocket;

  /** True if the API is currently connecting to the Qminder API, false if not.
   * @private */
  connecting: boolean;

  /** True if there is a connection to the Qminder API websocket, false if not
   * @private */
  connected: boolean;

  /** A queue of subscriptions to create when the connection is re-established. When the
   *  websocket is disconnected, all subscription requests are queued until connected again.
   * @private */
  messageQueue: Array<{ message: EventSubscription, callback: Function }>;

  /** A timeout object after which to retry connecting to Qminder API.
   * @private*/
  retryTimeout: Object;

  /** An interval object to automatically send keep-alive pings.
   * @private */
  pingInterval: Object;

  /** An array of all event subscription messages, to re-establish event subscriptions when the
   *  websocket re-connects
   * @private */
  subscriptions: Array<EventSubscription>;

  /** Counts the amount of times the event emitter retried connecting. This is used for
   *  exponential retry falloff.
   * @private */
  connectionRetries: number;

  /**
   * Keeps track of each subscription's callback.
   * For example, when subscribing to the ticket called event, a random identifier is generated and
   * sent to the Qminder Server. Any incoming messages with the same random identifier will be
   * handled by using the callback corresponding to the random identifier.
   *
   * For example:
   *
   * {
   *    "fzkf9afasoofiSr1o": function(messageData: Object): undefined {}
   * }
   * @private
   */
  subscriptionCallbackMap: { [string]: Function };

  /**
   * The list of callbacks that listen to when the socket connects.
   * @private
   */
  onConnectCallbacks: Array<() => void>;

  /**
   * The list of callbacks that listen to when the socket disconnects.
   */
  onDisconnectCallbacks: Array<() => void>;

  /**
   * Create a 30-letter random identifier.
   * The letters are taken from [A-Za-z0-9].
   * @example
   * const identifier = Qminder.events.createId();
   * // identifier = "h2bjBXYvsQoZGp8RXiEumvWSXiEp4Z";
   * @returns {string} A random identifier.
   * @private
   */
  createId(): string {
    const POSSIBLE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";

    for (let i = 0; i < 30; i++) {
      text += POSSIBLE_LETTERS.charAt(Math.floor(Math.random() * POSSIBLE_LETTERS.length));
    }
    return text;
  }

  /**
   * Construct the EventsService.
   * Initializes variables to their default values.
   * @private
   * @constructor
   */
  constructor() {
    this.reset();
  }

  onConnect(callback: () => void): void {
    if (typeof callback === 'function') {
      this.onConnectCallbacks.push(callback);
    } else {
      throw new Error('Connect callback is not a function.');
    }
  }

  /**
   * Add an event listener to be called when the Qminder Events API websocket disconnects.
   * @example
   * Qminder.events.onDisconnect(function() {
   *   console.log('Connection lost.');
   * });
   * @param callback  the function to call
   */
  onDisconnect(callback: () => void): void {
    if (typeof callback === 'function') {
      this.onDisconnectCallbacks.push(callback);
    } else {
      throw new Error('Disconnect callback is not a function.');
    }
  }

  /**
   * Initialize the EventsService by setting the API key.
   * When the API key is set, the socket can be opened.
   * This method is automatically called when doing Qminder.setKey().
   * @private
   */
  setKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Set the WebSocket hostname the EventsService uses.
   * @private */
  setServer(apiServer: string) {
    this.apiServer = apiServer;
  }

  /**
   * Open a WebSocket connection to the Qminder API.
   * Doesn't allow connecting if the connection already exists.
   * Re-initializes previously held subscriptions and sends queued messages.
   * Automatically starts sending pings every 10 s to keep the connection alive.
   * @private
   */
  openSocket() {
    if (!this.apiKey) {
      throw new Error('Please set the API key: Qminder.setKey(...);');
    }

    // Don't allow double-opening sockets
    if (this.connecting || this.connected) {
      return;
    }

    this.connecting = true;

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    const socket = new WebSocket(`${this.apiServer}/events?rest-api-key=${this.apiKey}`);
    this.socket = socket;

    socket.onopen = () => {
      console.log('[Qminder Events API] Connection established!');
      this.connected = true;
      // Reset the retries count
      this.connectionRetries = 0;

      // When the socket opens, re-establish all subscriptions
      this.subscriptions.forEach(message => this.subscribe(message));

      // Make sure that any subscriptions in the queue get re-established too
      while (this.messageQueue.length > 0) {
        const { message, callback } = this.messageQueue.pop();
        this.subscribe(message, callback);
        this.subscriptions.push(message);
      }

      // Start sending pings every 10s
      this.pingInterval = setInterval(() => this.socket.send("PING"), 10000);

      if (this.onConnectCallbacks && this.onConnectCallbacks.length > 0) {
        this.onConnectCallbacks.forEach(each => (typeof each === 'function') && each());
      }
    };

    socket.onclose = (event) => {
      // NOTE: if the event code is 1006, it is any of the errors in the list here:
      // https://www.w3.org/TR/websockets/#concept-websocket-close-fail
      console.log('[Qminder Events API] Connection lost: ' + event.code);

      this.connected = false;
      this.connecting = false;

      // Stop pinging when the socket is disconnected
      if (this.pingInterval !== null) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      // If it wasn't a client-side close socket, retry connecting.
      if (event.code !== 1000) {
        // Increase the retry timeout, the more times we retry
        const timeoutMult = Math.floor(this.connectionRetries / 10);
        const newTimeout = Math.min(5000 + timeoutMult * 1000, 60000);

        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
        }

        console.log('[Qminder Events API] Reconnecting in ' + newTimeout/1000 + ' seconds...');
        this.retryTimeout = setTimeout(this.openSocket, newTimeout);

        this.connectionRetries++;
      }

      if (this.onDisconnectCallbacks && this.onDisconnectCallbacks.length > 0) {
        this.onDisconnectCallbacks.forEach(each => (typeof each === 'function') && each());
      }
    };

    socket.onerror = () => {
      console.log('[Qminder Events API] An error occurred, the websocket will disconnect.');
    };

    socket.onmessage = (rawMessage: MessageEvent) => {
      if (rawMessage.data === 'PONG') {
        return;
      }
      try {
        const message = JSON.parse(rawMessage.data);
        const callback = this.subscriptionCallbackMap[message.subscriptionId];
        if (callback && typeof callback === 'function') {
          callback(message.data);
        }
      } catch (exc) {
        console.log(exc.stack);
      }
    };
  }

  /**
   * Close the websocket connected to Qminder.
   * This will stop all events from coming.
   * @private
   */
  closeSocket(): void {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.close();
    } else if (this.socket) {
      console.error('[Qminder Events API] The socket is not open yet!', this.socket.readyState);
    }
  }

  /**
   * Subscribes to a specific type of event to start receiving messages when the event occurs.
   * Some events can be filtered by location or line.
   * @param eventType  the type of event, for example 'TICKET_CALLED'
   * @param callback  the function to call when the event is fired
   * @param filter  the event filter, for example { line: 14142 }
   * @param parameters  the event parameters, for example { id: 15920 }. Used by iPad / TV /
   * Location Changed events.
   * @private
   */
  createSubscription(eventType: EventType, callback: Function, filter?: EventFilter, parameters?: { id: number }) {
    const subscription: EventSubscription = {
      id: this.createId(),
      subscribe: eventType,
    };

    if (filter) {
      if (typeof filter.line !== 'undefined') {
        subscription.line = filter.line;
      }
      if (typeof filter.location !== 'undefined') {
        subscription.location = filter.location;
      }
    }

    if (parameters) {
      subscription.parameters = parameters;
    }

    this.subscribe(subscription, callback);
    this.subscriptions.push(subscription);
  }

  /**
   * Subscribe to an event.
   * Sends a WebSocket message if possible to Qminder API, to subscribe to events based on the
   * EventSubscription. If not possible, opens the connection and queues the subscription message.
   * @param subscription  details about the event to subscribe to
   * @param callback  a callback to call when the event occurs
   * @private
   */
  subscribe(subscription: EventSubscription, callback: Function) {
    if (this.connected) {
      if (typeof callback === 'function') {
        this.subscriptionCallbackMap[subscription.id] = callback;
      }
      this.socket.send(JSON.stringify(subscription));
    } else {
      this.messageQueue.push({ message: subscription, callback });
      if (!this.connecting) {
        this.openSocket();
      }
    }
  }

  /**
   * Register a callback to get notified when a new ticket is created.
   * It is possible to filter the tickets based on their line and location, which is a good
   * practice if you do not want events on all tickets for the entire account.
   * @example
   * // Listening to all created tickets in location 1234
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCreated(function(event) {
   *     console.log("Ticket created in location 1234: ", event);
   * }, { location: 1234 });
   * @example
   * // Listening to all created tickets in line 94502
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCreated(function(event) {
   *     console.log("Ticket created in line 94502: ", event);
   * }, { line: 94502 });
   * @param callback  a function that gets called every time a new ticket is created
   * @param filter  an object that contains a location or line ID to filter the events
   */
  onTicketCreated(callback: EventCallback<Ticket>, filter?: EventFilter) {
    this.createSubscription('TICKET_CREATED', callback, filter);
  }

  /**
   * Register a callback to get notified when a ticket is called to service.
   * It is possible to filter the tickets based on their line and location, which is a good
   * practice if you do not want events on all tickets for the entire account.
   * @example
   * // Listening to all called tickets in location 1234
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCalled(function(event) {
   *     console.log("Ticket called in location 1234: ", event);
   * }, { location: 1234 });
   * @example
   * // Listening to all called tickets in line 94502
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCalled(function(event) {
   *     console.log("Ticket called in line 94502: ", event);
   * }, { line: 94502 });
   * @param callback  a function that gets called every time a new ticket is called
   * @param filter  an object that contains a location or line ID to filter the events
   */
  onTicketCalled(callback: EventCallback<Ticket>, filter?: EventFilter) {
    this.createSubscription('TICKET_CALLED', callback, filter);
  }

  /**
   * Register a callback to get notified when a ticket is re-called.
   * It is possible to filter the tickets based on their line and location, which is a good
   * practice if you do not want events on all tickets for the entire account.
   * @example
   * // Listening to all recalled tickets in location 1234
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketRecalled(function(event) {
   *     console.log("Ticket recalled in location 1234: ", event);
   * }, { location: 1234 });
   * @example
   * // Listening to all recalled tickets in line 94502
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketRecalled(function(event) {
   *     console.log("Ticket recalled in line 94502: ", event);
   * }, { line: 94502 });
   * @param callback  a function that gets called every time a new ticket is recalled
   * @param filter  an object that contains a location or line ID to filter the events
   */
  onTicketRecalled(callback: EventCallback<Ticket>, filter?: EventFilter) {
    this.createSubscription('TICKET_RECALLED', callback, filter);
  }

  /**
   * Register a callback to get notified when a ticket is cancelled.
   * It is possible to filter the tickets based on their line and location, which is a good
   * practice if you do not want events on all tickets for the entire account.
   * @example
   * // Listening to all cancelled tickets in location 1234
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCancelled(function(event) {
   *     console.log("Ticket cancelled in location 1234: ", event);
   * }, { location: 1234 });
   * @example
   * // Listening to all cancelled tickets in line 94502
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCancelled(function(event) {
   *     console.log("Ticket cancelled in line 94502: ", event);
   * }, { line: 94502 });
   * @param callback  a function that gets called every time a new ticket is cancelled
   * @param filter  an object that contains a location or line ID to filter the events
   */
  onTicketCancelled(callback: EventCallback<Ticket>, filter?: EventFilter) {
    this.createSubscription('TICKET_CANCELLED', callback, filter);
  }

  /**
   * Register a callback to get notified when a ticket is served.
   * It is possible to filter the tickets based on their line and location, which is a good
   * practice if you do not want events on all tickets for the entire account.
   * @example
   * // Listening to all served tickets in location 1234
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCancelled(function(event) {
   *     console.log("Ticket served in location 1234: ", event);
   * }, { location: 1234 });
   * @example
   * // Listening to all served tickets in line 94502
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketCancelled(function(event) {
   *     console.log("Ticket served in line 94502: ", event);
   * }, { line: 94502 });
   * @param callback  a function that gets called every time a new ticket is served
   * @param filter  an object that contains a location or line ID to filter the events
   */
  onTicketServed(callback: EventCallback<Ticket>, filter?: EventFilter) {
    this.createSubscription('TICKET_SERVED', callback, filter);
  }

  /**
   * Register a callback to get notified when a ticket has changed.
   * It is possible to filter the tickets based on their line and location, which is a good
   * practice if you do not want events on all tickets for the entire account.
   * @example
   * // Listening to all changed tickets in location 1234
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketChanged(function(event) {
   *     console.log("Ticket changed in location 1234: ", event);
   * }, { location: 1234 });
   * @example
   * // Listening to all changed tickets in line 94502
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onTicketChanged(function(event) {
   *     console.log("Ticket changed in line 94502: ", event);
   * }, { line: 94502 });
   * @param callback  a function that gets called every time a ticket has changed
   * @param filter  an object that contains a location or line ID to filter the events
   */
  onTicketChanged(callback: EventCallback<Ticket>, filter?: EventFilter) {
    this.createSubscription('TICKET_CHANGED', callback, filter);
  }

  /**
   * Register a callback to get notified when TV settings change.
   * @example
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onOverviewMonitorChanged(function(event) {
   *     console.log("TV changed: ", event);
   * });
   * @param callback  a function that gets called every time TV settings change
   * @param id  The TV's ID to listen to
   */
  onOverviewMonitorChanged(callback: EventCallback<{}>, id: number) {
    this.createSubscription('OVERVIEW_MONITOR_CHANGE', callback, undefined, { id });
  }

  /**
   * Register a callback to get notified when iPad settings change.
   * @example
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onSignInDeviceChanged(function(event) {
   *     console.log("iPad changed: ", event);
   * });
   * @param callback  a function that gets called every time the iPad settings change
   * @param id  The iPad's ID to listen to
   */
  onSignInDeviceChanged(callback: EventCallback<{}>, id: number) {
    this.createSubscription('SIGN_IN_CHANGE', callback, undefined, { id });
  }

  /**
   * Register a callback to get notified when a location's lines change.
   * @example
   * const apiKey = "...";
   * Qminder.setKey(apiKey);
   * Qminder.events.onLinesChanged(function(event) {
   *     console.log("Lines changed: ", event);
   * });
   * @param callback  a function that gets called every time the lines change
   * @param id  The Location ID to listen to
   */
  onLinesChanged(callback: EventCallback<{}>, id: number) {
    this.createSubscription('LINES_CHANGED', callback, undefined, { id });
  }

  /**
   * Reset the Events API.
   * You will normally not need this.
   * @private
   */
  reset(): void {
    this.apiKey = '';
    this.apiServer = 'api.qminder.com';
    if (this.socket && this.socket.readyState === 1) {
      this.socket.close();
    }
    this.connecting = false;
    this.connected = false;
    this.messageQueue = [];

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.retryTimeout = null;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.pingInterval = null;
    this.subscriptions = [];
    this.connectionRetries = 0;
    this.subscriptionCallbackMap = {};
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
  }
}

export default new EventsService();
