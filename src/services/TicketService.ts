import Ticket, { TicketStatus, TicketMessage, TicketExtra } from '../model/Ticket';
import User from '../model/User';
import Desk from '../model/Desk';
import Line from '../model/Line';
import ApiBase from '../api-base';
import * as querystring from 'querystring';


/**
 * Represents a collection of search criteria for TicketService.count().
 *
 * All of the criteria that have been included must match for tickets to be included.
 *
 * For example, the query `{ line: [123, 34], status: ['SERVED'] }` will retrieve a count of
 * tickets that were marked served in lines 123 and 34.
 */
interface TicketCountCriteria {
  /**
   * An array of lines to search tickets from, represented as an array of line IDs.
   *
   * For example:
   * `line: [123, 234, 456]`
   * `line: '123,234,456'`
   */
  line?: string | Array<number> | number;
  /**
   * The location ID to search tickets from.
   *
   * For example: `location: 4`
   */
  location?: number;
  /**
   * The ticket statuses to include (for example new, called, served, no-shows)
   *
   * For example, `status: ['NEW', 'CALLED', 'SERVED']`
   */
  status?: Array<TicketStatus> | string;
  /**
   * The caller of the ticket, for finding tickets that were called by a particular user.
   * Tickets that are NEW have not been called - they won't be included in results with a caller
   * filter.
   *
   * For example, `caller: 13410`
   */
  caller?: User | number;
  /**
   * The minimum creation date of the ticket, using either a Unix timestamp or an ISO8601 date.
   * If minCreated is specified, search results will only include tickets created after minCreated.
   *
   * For example, `minCreated: '2017-09-02T10:12:10Z'` or `minCreated: 1504348504`
   */
  minCreated?: string | number;
  /**
   * The maximum creation date of the ticket.
   * If maxCreated is specified, search results will only include tickets created before maxCreated.
   *
   * For example, `maxCreated: '2017-09-02T10:12:10Z'` or `maxCreated: 1504348504`
   */
  maxCreated?: string | number;
  /**
   * The minimum called date of the ticket.
   * If minCalled is specified, search results will only include tickets called after minCalled.
   *
   * For example, `minCalled: '2017-09-02T10:12:10Z'` or `minCalled: 1504348504`
   */
  minCalled?: string | number;
  /**
   * The maximum called date of the ticket.
   * If maxCalled is specified, search results will only include tickets called before maxCalled.
   *
   * For example, `maxCalled: '2017-09-02T10:12:10Z'` or `maxCalled: 1504348504`
   */
  maxCalled?: string | number;
}

/**
 * Represents a collection of search criteria for TicketService.search().
 * All of these criteria need to apply in order for tickets to be included.
 *
 * For example, the query `{ line: [123, 34], status: ['SERVED'] }` will retrieve all tickets that
 * were marked served in lines 123 and 34.
 *
 * The query `{ status: ['CALLED'], caller: 11111, limit: 1 }` will retrieve the clerk 11111's
 * currently called ticket.
 */
interface TicketSearchCriteria {
  /**
   * An array of lines to search tickets from, represented as an array of line IDs.
   *
   * For example: `line: [123, 234, 456]`, or `line: 1234`, or `line: '1234,2434,5555'`
   */
  line?: string | Array<number> | number;
  /**
   * The location ID to search tickets from.
   *
   * For example: `location: 4`
   */
  location?: number;
  /**
   * The ticket statuses to include (for example new, called, served, no-shows)
   *
   * For example, `status: ['NEW', 'CALLED', 'SERVED']`
   */
  status?: Array<TicketStatus> | string;
  /**
   * The caller of the ticket, for finding tickets that were called by a particular user.
   * Tickets that are NEW have not been called - they won't be included in results with a caller
   * filter.
   *
   * For example, `caller: 13410`
   */
  caller?: User | number;
  /**
   * The minimum creation date of the ticket, using either a Unix timestamp or an ISO8601 date.
   * If minCreated is specified, search results will only include tickets created after minCreated.
   *
   * For example, `minCreated: '2017-09-02T10:12:10Z'` or `minCreated: 1504348504`
   */
  minCreated?: string | number;
  /**
   * The maximum creation date of the ticket.
   * If maxCreated is specified, search results will only include tickets created before maxCreated.
   *
   * For example, `maxCreated: '2017-09-02T10:12:10Z'` or `maxCreated: 1504348504`
   */
  maxCreated?: string | number;
  /**
   * The minimum called date of the ticket.
   * If minCalled is specified, search results will only include tickets called after minCalled.
   *
   * For example, `minCalled: '2017-09-02T10:12:10Z'` or `minCalled: 1504348504`
   */
  minCalled?: string | number;
  /**
   * The maximum called date of the ticket.
   * If maxCalled is specified, search results will only include tickets called before maxCalled.
   *
   * For example, `maxCalled: '2017-09-02T10:12:10Z'` or `maxCalled: 1504348504`
   */
  maxCalled?: string | number;
  /**
   * The maximum number of results retrieved.
   * The number has to be between 1 and 10000, and by default up to 1000 results will be retrieved.
   *
   * For example, `limit: 50`
   */
  limit?: number;
  /**
   * The order of the returned tickets.
   *
   * Tickets can be sorted by the following keys: id, number, created, called.
   *
   * Additionally, you may specify ascending or descending order by adding 'ASC' or 'DESC' after
   * the key, separated by spaces.
   *
   * If this property is omitted, the default ordering is 'id ASC'.
   *
   * For example, `order: 'id ASC'`, or `order: 'created DESC'`
   */
  order?: string;

  /**
   * This property decides whether to include additional information along with the tickets.
   *
   * It is possible to add the ticket's **messages** and **interactions** to each ticket in the
   * response, by specifying the responseScope.
   *
   * If omitted, the ticket will not include the message list or interaction list.
   *
   * If the value is 'MESSAGES', the ticket's message list is attached to each ticket. Tickets
   * without messages have an empty array.
   *
   * If the value is 'INTERACTIONS', the ticket's interaction list is attached to each ticket.
   * Tickets without interactions have an empty array.
   *
   * For example:
   *
   * responseScope: 'MESSAGES'
   * responseScope: ['MESSAGES', 'INTERACTIONS']
   * responseScope: 'MESSAGES,INTERACTIONS'
   */
  responseScope?: string | Array<'MESSAGES' | 'INTERACTIONS'> | 'MESSAGES' | 'INTERACTIONS';
}


/**
 * Represents a position in the queue where the ticket should go when returning it to the queue.
 * They should either be the first in line, somewhere in the center (when they will be back
 * soon), or the last in line.
 */
type DesiredQueuePosition = 'FIRST' | 'MIDDLE' | 'LAST';

/** This error is thrown when a Line ID is not passed to the API method, or when its type is not
 *  a number.
 *  @hidden */
export const ERROR_NO_LINE_ID: string = 'Line ID missing from arguments.';
/**
 * This error is thrown when the line is not a number (for the line ID) or a valid Line object.
 * @hidden
 */
export const ERROR_INVALID_LINE: string = 'Line is not a number or Line object.';

/** This error is thrown when the Ticket ID is not passed to the API method, or when its type is
 *  not a number.
 *  @hidden */
export const ERROR_NO_TICKET_ID: string = 'Ticket ID missing from arguments.';
/** @hidden */
export const ERROR_INVALID_TICKET: string = 'Ticket is not a number or Ticket object.';
/** This error is thrown when the Ticket Changes object is not passed to TicketService.edit.
 * @hidden */
export const ERROR_NO_TICKET_CHANGES: string = 'Ticket changes missing from arguments.';

/** This error is thrown when a user is not passed into API methods that take a user.
 * @hidden */
export const ERROR_NO_USER: string = 'User missing from arguments.';
/** @hidden */
export const ERROR_INVALID_USER: string = 'User is not a number or User object.';
/** This error is thrown when the desired queue position is not passed into
 *  TicketService.returnToQueue.
 *  @hidden */
export const ERROR_NO_QUEUE_POSITION: string = 'Queue position missing from arguments.';
/** @hidden */
export const ERROR_INVALID_DESK: string = 'Desk is not a number or Desk object.';


export type TicketCreationParameters = Pick<Ticket, 'id' | 'source' | 'firstName' | 'lastName' | 'phoneNumber' | 'email' | 'extra'>;
export type TicketEditingParameters = Pick<Ticket, 'line' | 'phoneNumber' | 'firstName' | 'lastName' | 'email' | 'extra'> & { user: User | number };
/**
 * The format of the HTTP request to send when creating a ticket.
 */
interface TicketCreationRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: number;
  email?: string;
  extra?: string;
  source?: string;
}

/**
 * The format of the HTTP request to send when editing a ticket.
 */
interface TicketEditingRequest extends TicketCreationRequest {
  line?: number;
  user?: number;
}

interface TicketCallRequest {
  user?: number;
  desk?: number;
  keepActiveTicketsOpen?: boolean;
}

interface CallNextRequest extends TicketCallRequest {
  lines: string;
}

type TicketCreationResponse = Pick<Ticket, 'id'>; 

/**
 * TicketService includes methods that work with tickets. Tickets represent a visitor that is
 * currently in the queue.
 *
 * For example, to create a new ticket, use {@link create}.
 *
 * ```javascript
 * import * as Qminder from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 1. Create a new ticket in Line ID 12346
 * const ticket = await Qminder.tickets.create(12346, {
 *    firstName: 'Jane',
 *    lastName: 'Eyre',
 *    phoneNumber: 13185551234
 * });
 * ```
 *
 * For example, to get a list of all visitors currently in the queue, use {@link search}.
 *
 * ```javascript
 * import * as Qminder from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 2. Get a list of all visitors currently in queue in location 12345
 * const visitors = await Qminder.tickets.search({ location: 12345, status: ['NEW'] });
 * ```
 *
 * This service additionally includes methods to work with visitors, such as call them to
 * service, add custom business-specific labels or mark them as served.
 *
 * For example, to call the next visitor in the lines 12345, 12346 and 12347, use {@link callNext}.
 *
 * ```javascript
 * import * as Qminder from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 3. Call the next visitor in lines 12345, 12346, 12347
 * const visitor = await Qminder.tickets.callNext([12345, 12346, 12347]);
 * console.log(visitor);
 * // => { id: 141592145 }
 * ```
 */
export default class TicketService {
  /**
   * Searches for tickets according to the given search criteria.
   * Resolves to a list of tickets that match the search.
   *
   * Only the first 10000 tickets are returned.
   *
   * The various search criteria to use are documented under {@link TicketSearchCriteria}.
   *
   * This method calls the following HTTP API: `GET /v1/tickets/search?<CRITERIA>`
   *
   * For example:
   *
   * ```
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example 1. Search line 1234 for tickets created after July 9, 2018, ordered by IDs,
   * // smallest first.
   * const criteria = {
   *     line: [ 1234 ],
   *     order: 'id ASC',
   *     minCalled: "2018-07-09T00:00:00Z"
   * };
   * const tickets: Array<Ticket> = Qminder.tickets.search(criteria);
   * const ticket: Ticket = tickets[0];
   * console.log(ticket.id); // 12345
   * console.log(ticket.firstName); // John
   * console.log(ticket.lastName);  // Smith
   *
   * // Example 2. Search tickets, including their SMS conversation in the response data.
   * const criteria = {
   *     ...,
   *     responseScope: 'MESSAGES'
   * };
   * const tickets: Array<Ticket> = Qminder.tickets.search(criteria);
   * const ticket: Ticket = tickets[0];
   * // NOTE: only included in the response data, if criteria.responseScope === 'MESSAGES'
   * // This data can also be loaded with Qminder.tickets.getMessages(Ticket)
   * const messages: Array<TicketMessage> = ticket.messages;
   * console.log(messages[0].body); // "It's your turn!"
   * ```
   * @param search the search criteria
   * @returns A promise that resolves to matching tickets.
   */
  static search(search: TicketSearchCriteria): Promise<Array<Ticket>> {
    if (search.line && search.line instanceof Array) {
      search.line = search.line.join(',');
    }
    if (search.status && search.status instanceof Array) {
      search.status = search.status.join(',');
    }

    if (search.caller && search.caller instanceof User) {
      search.caller = search.caller.id;
    }

    if (search.responseScope && search.responseScope instanceof Array) {
      search.responseScope = search.responseScope.join(',');
    }

    const queryStr = querystring.stringify(search);

    return ApiBase.request(`tickets/search?${queryStr}`).then((response: { data: Ticket[] }) => {
      return response.data.map(ticket => new Ticket(ticket))
    });
  }

  /**
   * Count all tickets that match the search criteria.
   *
   * Fetches a count of all tickets matching the criteria and returns the number.
   * Note that this function is not limited by 10000 like TicketService.search.
   *
   * Calls this HTTP API: `POST /v1/tickets/count?(search)`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const criteria = { line: 123, status: ['NEW'] };
   * const count = await Qminder.tickets.count(criteria);
   * console.log(count); // 14
   * ```
   * @param search the search criteria to use
   * @returns the number of tickets that match the search criteria
   */
  static count(search: TicketCountCriteria): Promise<number> {
    if (search.line && search.line instanceof Array) {
      search.line = search.line.join(',');
    }
    if (search.status && search.status instanceof Array) {
      search.status = search.status.join(',');
    }
    if (search.caller && search.caller instanceof User) {
      search.caller = search.caller.id;
    }
    // Sanity checks if user passes TicketSearchCriteria
    if ((search as TicketSearchCriteria).limit) {
      delete (search as TicketSearchCriteria).limit;
    }
    if ((search as TicketSearchCriteria).order) {
      delete (search as TicketSearchCriteria).order;
    }
    if ((search as TicketSearchCriteria).responseScope) {
      delete (search as TicketSearchCriteria).responseScope;
    }
    const queryStr = querystring.stringify(search);
    return ApiBase.request(`tickets/count?${queryStr}`)
                  .then((response: { count: number }) => response.count);
  }

  /**
   * Creates a new ticket and puts it into the queue as the last in the given line.
   *
   * Calls this HTTP API: `POST /v1/lines/<ID>/ticket`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Create a ticket with first and last name, and phone number
   * const lineId = 1234;
   * const ticket: Ticket = new Qminder.Ticket({
   *    firstName: "Jane",
   *    lastName: "Smith",
   *    phoneNumber: 3185551234,
   * });
   * const ticketId = await Qminder.tickets.create(lineId, ticket);
   * console.log(ticketId); // 12345678
   *
   * // Example 2. Create a ticket with custom fields
   * const lineId = 1234;
   * const ticket: Ticket = new Qminder.Ticket({
   *    firstName: "Sarah Jane",
   *    lastName: "Smith",
   *    extra: [ { "title": "Order ID", "value": "1234567890" } ]
   * });
   * const ticketId = await Qminder.tickets.create(lineId, ticket);
   * console.log(ticketId); // 12345681

   * // Example 3. Create a ticket by using a Line object to specify the line
   * const ticket: Ticket = new Qminder.Ticket({
   *    firstName: "Sarah Jane",
   *    lastName: "Smith",
   *    extra: [ { "title": "Order ID", "value": "1234567890" } ]
   * });
   * const line: Line = await Qminder.lines.details(12345);
   * const ticketId = await Qminder.tickets.create(line, ticket);
   * console.log(ticketId); // 12345689
   * ```
   * @param line  the ticket's desired line
   * @param ticket  the ticket data
   * @param idempotencyKey  optional: a unique identifier that lets you safely retry creating the same ticket twice
   * @returns a promise that resolves to the ID of the new ticket.
   * @throws ERROR_NO_LINE_ID when the lineId parameter is undefined or not a number.
   */
  static create(line: number | Pick<Line, 'id'>, ticket: TicketCreationParameters, idempotencyKey?: string | number): Promise<TicketCreationResponse> {
    if (line === undefined) {
      throw new Error(ERROR_NO_LINE_ID);
    }

    let lineId: any = null;
    if (typeof line === 'number') {
      lineId = line;
    } else if (typeof line === 'object' && typeof line.id === 'number') {
      lineId = line.id;
    } else {
      throw new Error(ERROR_INVALID_LINE);
    }
  
    const converted: any = Object.assign({}, ticket);
    if (converted.extra) {
      converted.extra = JSON.stringify(converted.extra);
    }

    const requestParams: TicketCreationRequest = Object.assign({}, converted);

    return ApiBase.request(`lines/${lineId}/ticket`, requestParams, 'POST', idempotencyKey)
                  .then((response: TicketCreationResponse) => {
      const ticketId = parseInt(`${response.id}`, 10);
      const ticket = new Ticket(ticketId);
      ticket.line = lineId;
      return ticket;
    });
  }

  /**
   * Fetches the details of a given ticket ID and returns a Ticket object filled with data.
   *
   * Calls the following HTTP API: `GET /v1/tickets/<ID>`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const ticket = await Qminder.tickets.details(12345);
   * console.log(ticket.id); // 12345
   * console.log(ticket.firstName); // Jane
   * console.log(ticket.lastName); // Eyre
   * ```
   * @param ticket  the Ticket to query, by ticket ID or Ticket object
   * @returns the ticket's details as a Ticket object
   * @throws ERROR_NO_TICKET_ID when the ticket ID is undefined or not a number.
   */
  static details(ticket: number | string | Pick<Ticket, 'id'>): Promise<Ticket> {
    let ticketId: string | number = null;
    if (ticket === undefined) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (typeof ticket === 'number' || typeof ticket === 'string') {
      ticketId = ticket;
    } else if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'number' || typeof ticket.id === 'string')) {
      ticketId = ticket.id;
    } else {
      throw new Error(ERROR_INVALID_TICKET);
    }

    return ApiBase.request(`tickets/${ticketId}`).then((response: Ticket) => new Ticket(response));
  }

  /**
   * Edits the ticket.
   *
   * To edit a ticket, pass the ticket ID to edit, and an object that only includes the keys
   * that need to be changed.
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Edit a ticket's first name
   * const ticket = { id: 12345, firstName: "John", lastName: "Smith" };
   * const changes = { firstName: "Jane" };
   * const successMessage = await Qminder.tickets.edit(ticket, changes);
   * console.log(successMessage === "success"); // true if it worked
   * ```
   * @param ticket  the ticket to edit, either the Ticket object or the ticket's ID
   * @param changes  an object only including changed properties of the ticket
   * @returns a Promise that resolves to "success" when editing the ticket worked
   * @throws ERROR_NO_TICKET_ID when the ticket ID was undefined or not a number
   * @throws ERROR_NO_TICKET_CHANGES when the ticket changes were undefined
   */
  static edit(ticket: number | string | Pick<Ticket, 'id'>, changes: TicketEditingParameters): Promise<'success'> {
    if (!ticket) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    let ticketId: any = null;

    if (typeof ticket === 'number' || typeof ticket === 'string') {
      ticketId = ticket;
    } else if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'number' || typeof ticket.id === 'string')) {
      ticketId = ticket.id;
    } else {
      throw new Error(ERROR_INVALID_TICKET);
    }

    if (!changes) {
      throw new Error(ERROR_NO_TICKET_CHANGES);
    }

    const intermediate: any = Object.assign({}, changes);

    if (intermediate.extra) {
      intermediate.extra = JSON.stringify(intermediate.extra);
    }

    if (intermediate.user && typeof intermediate.user === 'object' &&
        typeof intermediate.user.id === 'number') {
      intermediate.user = intermediate.user.id;
    }

    const request: TicketEditingRequest = intermediate;

    return ApiBase.request(`tickets/${ticketId}/edit`, request)
                  .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Call the next ticket to service, from a set of lines.
   *
   * To decide which ticket is next in line to be served, all waiting tickets from the selected
   * lines are put in chronological order, making sure to keep "orderAfter" in mind, and the first
   * ticket is called.
   *
   * By default, allows only one ticket to be in the 'CALLED' state, and marks other 'CALLED'
   * tickets as served.
   *
   * Multiple tickets can be called by setting `keepActiveTicketsOpen` to true.
   *
   * @param lines  the list of lines to search for tickets
   * @param user  the user that is calling the ticket. This is needed when the API is used with
   * the account API key, instead of a user-specific API key.
   * @param desk  the desk to call the user to.
   * @param keepActiveTicketsOpen if tickets are currently being served, do not mark them served
   * when calling a new ticket. This allows calling multiple tickets at the same time.
   * @returns a Promise that resolves to the ticket that was called, resolves to null if there
   * was no ticket to call, and rejects if something went wrong.
   */
  static callNext(lines: Array<Pick<Line, 'id'> | number>,
                  user?: (User | number),
                  desk?: (Desk | number),
                  keepActiveTicketsOpen?: boolean): Promise<Ticket> {

    function linesIsArrayOfNumber(lines: (Pick<Line, 'id'> | number)[]): lines is number[] {
      for (let i = 0; i < lines.length; i++) {
        if (typeof lines[i] !== 'number') {
          return false;
        }
      }
      return true;
    }

    function linesIsArrayOfLine(lines: (Pick<Line, 'id'> |number)[]): lines is Pick<Line, 'id'>[] {
      for (let i = 0; i < lines.length; i++) {
        if (!(typeof lines[i] === 'object' && typeof (lines[i] as Pick<Line, 'id'>).id === 'number')) {
          return false;
        }
      }
      return true;
    }

    if (!lines || lines.length === 0) {
      throw new Error('Lines not specified.');
    }

    let lineIds: Array<number> = null;

    if (linesIsArrayOfNumber(lines)) {
      lineIds = lines;
    } else if (linesIsArrayOfLine(lines)) {
      lineIds = lines.map(line => line.id);
    } else {
      throw new Error('Invalid line list specified');
    }

    if (lineIds.some(id => !id)) {
      throw new Error('Invalid line list specified');
    }

    const request: CallNextRequest = {
      lines: lineIds.join(','),
    };

    if (user && typeof user === 'number') {
      request.user = user;
    } else if (user && user instanceof User) {
      if (!user.id) {
        throw new Error('User has no user ID');
      }
      request.user = user.id;
    } else if (user) {
      throw new Error('Invalid User specified: use a number or User instance instead.');
    }

    if (desk && typeof desk === 'number') {
      request.desk = desk;
    } else if (desk && desk instanceof Desk) {
      if (!desk.id) {
        throw new Error('Desk has no ID');
      }
      request.desk = desk.id;
    } else if (desk) {
      throw new Error('Invalid Desk specified.');
    }

    if (typeof keepActiveTicketsOpen !== 'undefined') {
      request.keepActiveTicketsOpen = keepActiveTicketsOpen;
    }

    return ApiBase.request('tickets/call', request, 'POST')
                  .then((response: Ticket) => response.hasOwnProperty('id') ? new Ticket(response) : null);
  }

  /**
   * Call a specific ticket to service.
   *
   * Calling a ticket will notify the visitor via all available channels, show the visitor
   * details to the clerk on the Service View, and change the ticket status to 'CALLED'.
   *
   * Only tickets that are waiting (their status is 'NEW') can be called.
   *
   * By default, allows only one ticket to be in the 'CALLED' state, and marks other 'CALLED'
   * tickets as served.
   *
   * Multiple tickets can be called by setting `keepActiveTicketsOpen` to true.
   *
   * @param ticket  The ticket to call. The ticket ID can be used instead of the Ticket object.
   * @param user  the user that is calling the ticket. This parameter is not needed if
   * Qminder.setKey was called with an API key belonging to a specific User. The user ID can be
   * used instead of the User object.
   * @param desk  the desk to call the ticket into. The desk ID can be used instead of the Desk
   * object.
   * @param keepActiveTicketsOpen if tickets are currently being served, do not mark them served
   * when calling a new ticket. This allows calling multiple tickets at the same time.
   * @returns  the ticket that was just called
   */
  static call(ticket: (Pick<Ticket, 'id'> | number | string),
              user?: (User | number),
              desk?: (Desk | number),
              keepActiveTicketsOpen?: boolean): Promise<Ticket> {
    if (!ticket) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    let ticketId: number | string = null;
    if (typeof ticket === 'number') {
      ticketId = ticket;
    } else if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      throw new Error(ERROR_INVALID_TICKET);
    }

    let request: TicketCallRequest = {};

    if (user) {
      if (typeof user === 'number') {
        request.user = user;
      } else if (user instanceof User && user.id) {
        request.user = user.id;
      } else {
        throw new Error(ERROR_INVALID_USER);
      }
    }

    if (desk) {
      if (typeof desk === 'number') {
        request.desk = desk;
      } else if (desk instanceof Desk && desk.id) {
        request.desk = desk.id;
      } else {
        throw new Error(ERROR_INVALID_DESK);
      }
    }

    if (typeof keepActiveTicketsOpen !== 'undefined') {
      request.keepActiveTicketsOpen = keepActiveTicketsOpen;
    }

    // If no request parameters specified, don't include the empty object.
    if (!user && !desk && typeof keepActiveTicketsOpen === 'undefined') {
      request = undefined;
    }

    return ApiBase.request(`tickets/${ticketId}/call`, request, 'POST')
                  .then((response: Ticket) => new Ticket(response));
  }

  /**
   * Recall a ticket.
   *
   * Recalling a ticket will notify the visitor again.
   *
   * Only called tickets (with the status 'CALLED') can be recalled.
   *
   * @param ticket  The ticket to recall. The ticket ID can be used instead of the Ticket object.
   * @returns  a promise that resolves to 'success' if all went well.
   */
  static recall(ticket: (Pick<Ticket, 'id'> | number | string)): Promise<'success'> {
    let ticketId: number | string = null;

    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(`tickets/${ticketId}/recall`, undefined, 'POST')
                  .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Mark a ticket served.
   *
   * If a visitor has been serviced, they should be marked served immediately.
   *
   * Only called tickets (with the status 'CALLED') can be marked served.
   *
   * @param ticket  The ticket to mark served. The ticket ID can be used instead of the Ticket
   * object.
   * @returns  a promise that resolves to 'success' if all went well.
   */
  static markServed(ticket: (Pick<Ticket, 'id'> | number | string)): Promise<'success'> {
    let ticketId: string | number = null;

    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    return ApiBase.request(`tickets/${ticketId}/markserved`, undefined, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Mark a ticket as "no-show".
   *
   * If a visitor did not appear for service, they should be marked "no-show".
   *
   * Only called tickets (with the status 'CALLED') can be marked as "no-show".
   *
   * @param ticket  The ticket to mark no-show. The ticket ID can be used instead of the Ticket
   * object.
   * @returns A promise that resolves to "success" when marking no-show works, and rejects when
   * something went wrong.
   */
  static markNoShow(ticket: (Pick<Ticket, 'id'> | number | string)): Promise<'success'> {
    let ticketId: number | string = null;
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(`tickets/${ticketId}/marknoshow`, undefined, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Cancel a ticket.
   *
   * Cancelling a ticket removes them from the queue, and from statistics.
   *
   * Only new tickets (with the status 'NEW') can be cancelled.
   *
   * The user ID is mandatory.
   *
   * @param ticket  The ticket to cancel. The ticket ID can be used instead of the Ticket object.
   * @param user  The user who canceled the ticket. This is a mandatory argument.
   * @returns  a promise that resolves to "success" if removing works, and rejects if something
   * went wrong.
   */
  static cancel(ticket: (Pick<Ticket, 'id'> | number | string), user: User | number): Promise<string> {
    let ticketId: string | number = null;
    let userId: any = null;

    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as number | string;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (user instanceof User) {
      userId = user.id;
    } else {
      userId = user;
    }

    if (!userId || typeof userId !== 'number') {
      throw new Error(ERROR_NO_USER);
    }


    return ApiBase.request(`tickets/${ticketId}/cancel`, { user: userId }, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Return a ticket to the queue.
   *
   * Returning a ticket to the queue makes the ticket's status go back to 'NEW', a Ticket
   * Created event will fire, and the ticket will appear back in the queue. The ticket can be
   * ordered to be first in queue, somewhere in the middle, or the last in queue, depending on
   * the reason the visitor needs to go back to the queue and when they will be back for service.
   *
   * Only called tickets (with the status 'CALLED') can be returned to the queue.
   *
   * @param ticket  The ticket to return to queue. The ticket ID can be used instead of the
   * Ticket object.
   * @param user  The user that returned the ticket to the queue. The user ID can be used instead
   * of the User object.
   * @param position  The position where to place the returned ticket. Either 'FIRST', 'MIDDLE'
   * or 'LAST'.
   * @returns {Promise<string>} a promise that resolves to "success" if it worked, and rejects
   * if something went wrong.
   */
  static returnToQueue(ticket: (Pick<Ticket, 'id'> | number | string),
                       user: (User | number),
                       position: DesiredQueuePosition): Promise<'success'> {
    let ticketId: string | number = null;
    let userId: any = null;
    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (user instanceof User) {
      userId = user.id;
    } else {
      userId = user;
    }
    if (!userId || typeof userId !== 'number') {
      throw new Error('No user given');
    }

    if (!position) {
      throw new Error(ERROR_NO_QUEUE_POSITION);
    }

    const query = querystring.stringify({ position, user: userId });
    return ApiBase.request(`tickets/${ticketId}/returntoqueue?${query}`, undefined, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Add a label to a ticket.
   *
   * It adds a label to the ticket's labels list. Clerks can see the labels in the Service View,
   * and can save additional details about the visitor into the label list. Labels are
   * automatically colored.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const myUserId = 15151;
   * const ticket = 591050;
   * const labelText = "Has documents";
   * await Qminder.tickets.addLabel(ticket, labelText, myUserId);
   * ```
   * @param ticket  The ticket to label. The ticket ID can be used instead of the Ticket object.
   * @param label  The label to add, eg. "Has documents"
   * @param user  The user that is adding the label.
   * @returns promise that resolves to 'success' if all was OK, and 'no
   * action' if the label was already there, and rejects if something else went wrong.
   */
  static addLabel(ticket: (Pick<Ticket, 'id'> | number | string), label: string, user?: (User|number)): Promise<'success' | 'no action'> {
    let ticketId: string | number = null;
    let userId: any = null;

    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!label) {
      throw new Error('No label given.');
    }

    if (user instanceof User) {
      userId = user.id;
    } else {
      userId = user;
    }

    const body: { value: string, user?: number } = {
      value: label,
    };

    if (typeof userId === 'number') {
      body.user = userId;
    }

    return ApiBase.request(`tickets/${ticketId}/labels/add`, body, 'POST')
      .then((response: { result: 'success' | 'no action' }) => response.result);
  }

  /**
   * Remove a label from the ticket.
   *
   * This API call removes the label from a ticket's label list, by the label's text.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const myUserId = 51000;
   * const ticket = 1234567;
   * const label = "Hello";
   * await Qminder.tickets.removeLabel(ticket, label, myUserId);
   * console.log('It worked!');
   * ```
   *
   * @param ticket  The ticket to remove a label from. The ticket ID can be used instead of the
   * Ticket object.
   * @param label  The label to remove, for example, "Has Cool Hair"
   * @param user  The user who is removing the label, for example 9500
   * @returns {Promise<string>}  A promise that resolves to "success" when removing the label
   * worked, and rejects when something went wrong.
   */
  static removeLabel(ticket: (Pick<Ticket, 'id'> | number | string), label: string, user: (User|number)): Promise<'success'> {
    let ticketId: string | number = null;
    let userId: any = null;

    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'number' || typeof ticket.id === 'string')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!label) {
      throw new Error('No label given.');
    }

    if (user instanceof User) {
      userId = user.id;
    } else {
      userId = user;
    }
    if (!userId || typeof userId !== 'number') {
      throw new Error('No user given');
    }

    const body = {
      value: label,
      user: userId
    };

    return ApiBase.request(`tickets/${ticketId}/labels/remove`, body, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Assign the given ticket to an user (assignee).
   *
   * The user who is assigning (assigner) should be the second argument.
   * The user who will take the ticket (assignee) should be the third argument.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Assign Ticket 11425 to User 12345, and the user performing the action is 91020.
   * const myUserId = 91020;
   * const ticketId = 11425;
   * const assigneeId = 12345;
   * await Qminder.tickets.assignToUser(ticketId, myUserId, assigneeId);
   * console.log('It worked!');
   *
   * // Example 2. Assign all tickets in Line 111 to user 15152
   * const tickets: Array<Ticket> = await Qminder.tickets.search({ line: 111, status: ['NEW'] });
   * tickets.map((ticket: Ticket) => Qminder.tickets.assign(ticket, 15152));
   * ```
   * @param ticket The ticket to assign to an user. The ticket ID can be used instead of the
   * Ticket object.
   * @param assigner The user who is assigning.
   * @param assignee The user who will take the ticket.
   * @returns {Promise.<string>} resolves to 'success' on success
   */
  static assignToUser(ticket: (Pick<Ticket, 'id'> | number | string),
                      assigner: (User|number),
                      assignee: (User|number)): Promise<'success'> {
    let ticketId: string | number = null;
    let assignerId: any = null;
    let assigneeId: any = null;

    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'number' || typeof ticket.id === 'string')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (assigner instanceof User) {
      assignerId = assigner.id;
    } else {
      assignerId = assigner;
    }

    if (!assignerId || typeof assignerId !== 'number') {
      throw new Error('No assigner given');
    }

    if (assignee instanceof User) {
      assigneeId = assignee.id;
    } else {
      assigneeId = assignee;
    }

    if (!assigneeId || typeof assigneeId !== 'number') {
      throw new Error('No assignee given');
    }

    const body = {
      assigner: assignerId,
      assignee: assigneeId
    };
    return ApiBase.request(`tickets/${ticketId}/assign`, body, 'POST')
                  .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Un-assign a ticket. This returns the ticket to the unassigned list.
   * This call works only for Tickets that have the status: 'NEW'.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Using unassign with async/await in latest Javascript/ES6 standard
   * const ticketID = 141412345;
   * const myUserID = 123;
   * try {
   *   await Qminder.tickets.unassign(ticketID, myUserID);
   *   console.log('Ticket unassign worked!');
   * } catch (error) {
   *   console.log('Ticket unassign failed', error);
   * }
   *
   * // Example 2. Using unassign without async/await, with plain promises.
   * const ticketID = 1452521;
   * const myUserID = 529;
   * Qminder.tickets.unassign(ticketID, myUserID).then(function(success) {
   *   console.log('Ticket unassign worked!');
   * }, function(error) {
   *   console.log('Ticket unassign failed!', error);
   * });
   *
   * // Example 3. Using unassign with a Ticket object and async/await in latest Javascript/ES6
   * // standard
   * const myUserID = 42049;
   * const tickets = await Qminder.tickets.search({ line: 12345 });
   * const ticket = tickets[0];
   * await Qminder.tickets.unassign(ticket, myUserID);
   * ```
   * @param ticket the ticket object or the ticket's ID that needs un-assignment
   * @param unassigner the User who un-assigned the ticket, for example current user's ID
   * @returns a Promise that resolves when unassigning works and rejects when
   * unassigning fails
   */
  static unassign(ticket: (Pick<Ticket, 'id'> | number | string), unassigner: (User|number)): Promise<'success'> {
    let ticketId: number | string = null;
    let unassignerId: any = null;

    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (unassigner instanceof User) {
      unassignerId = unassigner.id;
    } else {
      unassignerId = unassigner;
    }

    if (!unassignerId || typeof unassignerId !== 'number') {
      throw new Error('Qminder.tickets.unassign was called without a valid unassigner user.');
    }

    return ApiBase.request(`tickets/${ticketId}/unassign`, { user: unassignerId }, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Reorder a ticket after another ticket.
   *
   * Calls this HTTP API: `POST /v1/tickets/<ID>/reorder`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const ticket1 = { id: 12345 };
   * const ticket2 = { id: 12346 };
   * const ticket3 = { id: 12347 };
   * // Queue: ticket1, ticket2, ticket3
   * // Ticket 3 will be put after Ticket 1
   * Qminder.tickets.reorder(ticket3, ticket1);
   * // Queue: ticket1, ticket3, ticket2
   * ```
   * @param ticket The ticket to reorder. The ticket ID can be used instead
   * of the Ticket object.
   * @param afterTicket the ticket to reorder after, or null if reordering to be first in the
   * queue.
   * @returns resolves to 'success' when it worked
   */
  static reorder(ticket: (Pick<Ticket, 'id'> | number | string), afterTicket: (Pick<Ticket, 'id'> | number | string | null)): Promise<'success'> {
    let ticketId: string | number = null;
    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    let afterTicketId: string | number | null = null;
    if (afterTicket && typeof afterTicket === 'object' && (typeof afterTicket.id === 'string' || typeof afterTicket.id === 'number')) {
      afterTicketId = afterTicket.id;
    } else {
      afterTicketId = afterTicket as string | number | null;
    }

    let postData: { after: string | number | null } = undefined;
    if (afterTicketId) {
      postData = {
        after: afterTicketId,
      };
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(`tickets/${ticketId}/reorder`, postData, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Get the estimated time that this visitor will be called for service.
   *
   * The time will be returned as a Unix timestamp (in seconds).
   *
   * Calls the HTTP API: `GET /v1/tickets/<ID>/estimated-time`
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Get the ticket's estimated time of service
   * const lineId = 15152;
   * const visitorDetails = { firstName: "Jon", lastName: "Snow" };
   * const ticket = await Qminder.tickets.create(lineId, visitorDetails);
   * const eta = await Qminder.tickets.getEstimatedTimeOfService(ticket);
   * console.log(eta); // 1509460809, for example.
   * ```
   * @param ticket  the ticket to get the estimated time for. The ticket ID can be used instead
   * of the Ticket object.
   * @returns the estimated Unix time the visitor will be called, eg 1509460809
   */
  static getEstimatedTimeOfService(ticket: (Pick<Ticket, 'id'> | number | string)): Promise<number> {
    let ticketId: string | number = null;
    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (typeof ticketId !== 'number' && typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    return ApiBase.request(`tickets/${ticketId}/estimated-time`)
      .then((response: { estimatedTimeOfService: number }) => response.estimatedTimeOfService);
  }

  /**
   * Get the ticket's SMS messages.
   * If the location has SMS enabled, clerks can send and receive SMS messages from visitors.
   * It works only if the visitor's phone number has been entered into Qminder.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Get list of messages with async/await in ES2017
   * const messages = await Qminder.tickets.getMessages(12345678);
   * if (messages.length > 0) {
   *   console.log(messages[0]);
   *   // { "body": "Hi!", "type": "INCOMING", ... }
   * }
   *
   * // Example 2. Get list of messages with regular Javascript
   * Qminder.tickets.getMessages(12345678).then(function(messages) {
   *     if (messages.length > 0) {
   *        console.log(messages[0]);
   *        // { "body": "Hi!", "type": "INCOMING", ... }
   *     }
   * });
   * ```
   * @param ticket   The ticket to get the message list for. The ticket ID can be used instead
   * of the Ticket object.
   * @returns  a Promise that resolves to a list of ticket messages
   * @throws ERROR_NO_TICKET_ID  if the ticket is missing from the arguments, or invalid.
   */
  static getMessages(ticket: (Pick<Ticket, 'id'> | number | string)): Promise<Array<TicketMessage>> {
    let ticketId: string | number = null;
    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(`tickets/${ticketId}/messages`)
                  .then((response: { messages: TicketMessage[] }) => response.messages);
  }

  /**
   * Send a new SMS message to a visitor.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Send the message with async/await in ES2017
   * const success = await Qminder.tickets.sendMessage(12345678,
   *                        "Hello! Go get some coffee now!",
   *                        { id: 14142 });
   * console.log('It worked!');
   * // NOTE: If sending a message fails, then the async function will be rejected.
   *
   * // Example 2. Send the message with regular Javascript
   * Qminder.tickets.sendMessage(
   *        12345678,
   *        "Hello! Free coffee time!",
   *        { id: 14245 }
   * ).then(function(success) {
   *     console.log("It works!");
   * }, function(error) {
   *     console.log("Something went wrong while sending the message.");
   * });
   * ```
   * @param ticket  The ticket to send a message to. The user ID may also be used.
   * @param message  the message to send, as a text string, for example "Welcome to our location!"
   * @param user  the user who is sending the message. The user ID may also be used.
   * @returns a promise that resolves to the string "success" if it works, and rejects when
   * something goes wrong.
   */
  static sendMessage(ticket: (Pick<Ticket, 'id'> | number | string),
                     message: string,
                     user: (User|number)): Promise<'success'> {
    let ticketId: string | number = null;
    let userId: any = null;
    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!message || typeof message !== 'string') {
      throw new Error('No message specified. The message has to be a string.');
    }

    if (user instanceof User) {
      userId = user.id;
    } else {
      userId = user;
    }

    if (!userId || typeof userId !== 'number') {
      throw new Error(ERROR_NO_USER);
    }

    const body = {
      message,
      user: userId
    };

    return ApiBase.request(`tickets/${ticketId}/messages`, body, 'POST')
                  .then((response: { result: 'success' }) => response.result);
  }

  /**
   * Forward the ticket to another queue.
   *
   * If a visitor's served at one step of the flow, they can be queued for a second service. This
   * allows to build multi-step workflows. Only tickets with the status 'CALLED' can be forwarded.
   *
   * After forwarding, a ticket's status will be 'NEW'.
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Forward a ticket using ES2017 features (async and await). This code only works
   * // inside an asynchronous function.
   * const tickets = await Qminder.tickets.search({ status: ['CALLED'], location: 3, limit: 1 });
   * if (tickets.length > 0) {
   *    await Qminder.tickets.forward(tickets[0], 15124);
   *    console.log('Success!');
   * }
   *
   * // Example 2. Forward a ticket using regular Javascript. This doesn't use any ES6
   * // features and can be deployed to a server without any pre-processing.
   * Qminder.tickets.search({ status: ['CALLED'], location: 3, limit: 1 }).then(function(tickets) {
   *   if (tickets.length > 0) {
   *      Qminder.tickets.forward(tickets[0], 15124).then(function(success) {
   *          console.log('Success!');
   *      }, function(error) { console.error(error); });
   *   }
   * });
   * ```
   * @param ticket  the ticket to forward, as ticket ID or ticket object
   * @param line  the visitor's next line, as line ID or line object.
   * @param user  the user who forwarded the ticket, as user ID or user object. Only necessary
   * if forwarding on behalf of a User.
   * @returns  a Promise that resolves when forwarding works, and rejects when it fails.
   * @throws an Error when the ticket or line are missing or invalid.
   */
  static forward(ticket: (Pick<Ticket, 'id'> | number | string),
                 line: (Line|number),
                 user?: (User|number)): Promise<Object> {
    let ticketId: string | number = null;
    let lineId: any = null;
    let userId: any = null;

    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (typeof ticketId !== 'number' && typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    // Get the line ID
    if (line instanceof Line) {
      lineId = line.id;
    } else {
      lineId = line;
    }

    if (typeof lineId !== 'number') {
      throw new Error('Line ID is not a number or is missing.');
    }

    // Get the user ID, if passed
    if (user instanceof User) {
      userId = user.id;
    } else {
      userId = user;
    }

    // If the user's ID was passed and it's invalid, throw an error
    if (user !== undefined && typeof userId !== 'number') {
      throw new Error('User ID is not a number.');
    }

    const body: { line: number, user?: number } = {
      line: lineId
    };

    if (userId !== undefined) {
      body.user = userId;
    }

    return ApiBase.request(`tickets/${ticketId}/forward`, body);
  }

  /**
   * Add external data to a ticket.
   *
   * @param ticket  The ticket to add external data to. The ticket ID can be used instead of the Ticket object.
   * @param provider  Provider of the data. One record per provider is allowed.
   * @param title     Title for the data
   * @param data      The data to set
   * @returns promise that resolves to 'success' if all was OK and rejects if something else went wrong.
   */
  static setExternalData(ticket: (Pick<Ticket, 'id'> | number | string), provider: string, title: string, data: any): Promise<'success'> {
    let ticketId: string | number = null;

    // Get the ticket's ID
    if (ticket && typeof ticket === 'object' && (typeof ticket.id === 'string' || typeof ticket.id === 'number')) {
      ticketId = ticket.id;
    } else {
      ticketId = ticket as string | number;
    }

    if (!ticketId || (typeof ticketId !== 'number' && typeof ticketId !== 'string')) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!provider || typeof provider !== 'string') {
      throw new Error('No provider specified. The provider has to be a string.');
    }

    if (!title || typeof title !== 'string') {
      throw new Error('No title specified. The title has to be a string.');
    }

    if (!data) {
      throw new Error('No data provided.');
    }

    const payload = {
      provider,
      title,
      data: JSON.stringify(data),
    };

    return ApiBase.request(`tickets/${ticketId}/external`, payload, 'POST')
      .then((response: { result: 'success' }) => response.result);
  }
};
