import Ticket, {
  TicketStatus,
  TicketMessage,
  TicketExtra,
} from '../model/Ticket.js';
import User from '../model/User.js';
import Desk from '../model/Desk.js';
import Line from '../model/Line.js';
import ApiBase from '../api-base.js';
import {
  extractId,
  extractIdToNumber,
  IdOrObject,
} from '../util/id-or-object.js';

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
  caller?: IdOrObject<User>;
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
  caller?: IdOrObject<User>;
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
  responseScope?:
    | string
    | Array<'MESSAGES' | 'INTERACTIONS'>
    | 'MESSAGES'
    | 'INTERACTIONS';
}

/**
 * Represents a position in the queue where the ticket should go when returning it to the queue.
 * They should either be the first in line or the last in line.
 */
type DesiredQueuePosition = 'FIRST' | 'LAST';

/** This error is thrown when a Line ID is not passed to the API method, or when its type is not
 *  a number.
 *  @hidden */
export const ERROR_NO_LINE_ID: string = 'Line ID missing from arguments.';
/**
 * This error is thrown when the line is not a number (for the line ID) or a valid Line object.
 * @hidden
 */
export const ERROR_INVALID_LINE: string =
  'Line is not a number or Line object.';

/** This error is thrown when the Ticket ID is not passed to the API method, or when its type is
 *  not a number.
 *  @hidden */
export const ERROR_NO_TICKET_ID: string = 'Ticket ID missing from arguments.';
/** @hidden */
export const ERROR_INVALID_TICKET: string =
  'Ticket is not a number or Ticket object.';
/** This error is thrown when the Ticket Changes object is not passed to TicketService.edit.
 * @hidden */
export const ERROR_NO_TICKET_CHANGES: string =
  'Ticket changes missing from arguments.';

/** This error is thrown when a user is not passed into API methods that take a user.
 * @hidden */
export const ERROR_NO_USER: string = 'User missing from arguments.';
/** @hidden */
export const ERROR_INVALID_USER: string =
  'User is not a number or User object.';
/** This error is thrown when the desired queue position is not passed into
 *  TicketService.returnToQueue.
 *  @hidden */
export const ERROR_NO_QUEUE_POSITION: string =
  'Queue position missing from arguments.';
/** @hidden */
export const ERROR_INVALID_DESK: string =
  'Desk is not a number or Desk object.';

export type TicketCreationParameters = Pick<
  Ticket,
  'source' | 'firstName' | 'lastName' | 'phoneNumber' | 'email' | 'extra'
>;
export type TicketEditingParameters = Pick<
  Ticket,
  'line' | 'phoneNumber' | 'firstName' | 'lastName' | 'email' | 'extra'
> & { user: IdOrObject<User> };
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
  user?: number | string;
  desk?: number | string;
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
    const newSearch = { ...search };
    if (newSearch.line && newSearch.line instanceof Array) {
      newSearch.line = newSearch.line.join(',');
    }
    if (newSearch.status && newSearch.status instanceof Array) {
      newSearch.status = newSearch.status.join(',');
    }

    if (newSearch.caller) {
      newSearch.caller = extractIdToNumber(newSearch.caller);
    } else {
      delete newSearch.caller;
    }

    if (newSearch.responseScope && newSearch.responseScope instanceof Array) {
      newSearch.responseScope = newSearch.responseScope.join(',');
    }

    const queryStr = new URLSearchParams(
      newSearch as Record<string, string>,
    ).toString();

    return ApiBase.request(`tickets/search?${queryStr}`).then(
      (response: { data: Ticket[] }) => response.data,
    );
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
    const newSearch = { ...search };
    if (newSearch.line && newSearch.line instanceof Array) {
      newSearch.line = newSearch.line.join(',');
    }
    if (newSearch.status && newSearch.status instanceof Array) {
      newSearch.status = newSearch.status.join(',');
    }
    if (newSearch.caller) {
      newSearch.caller = extractIdToNumber(newSearch.caller);
    } else {
      delete newSearch.caller;
    }
    // Sanity checks if user passes TicketSearchCriteria
    if ((newSearch as TicketSearchCriteria).limit) {
      delete (newSearch as TicketSearchCriteria).limit;
    }
    if ((newSearch as TicketSearchCriteria).order) {
      delete (newSearch as TicketSearchCriteria).order;
    }
    if ((newSearch as TicketSearchCriteria).responseScope) {
      delete (newSearch as TicketSearchCriteria).responseScope;
    }
    const queryStr = new URLSearchParams(
      newSearch as Record<string, string>,
    ).toString();
    return ApiBase.request(`tickets/count?${queryStr}`).then(
      (response: { count: number }) => response.count,
    );
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
  static create(
    line: IdOrObject<Line>,
    ticket: TicketCreationParameters,
    idempotencyKey?: string | number,
  ): Promise<TicketCreationResponse> {
    if (line === undefined) {
      throw new Error(ERROR_NO_LINE_ID);
    }

    const lineId = extractId(line);

    const converted: any = { ...ticket };
    if (converted.lastName === null) {
      delete converted.lastName;
    }
    if (converted.extra) {
      converted.extra = JSON.stringify(converted.extra);
    }

    const requestParams: TicketCreationRequest = { ...converted };

    return ApiBase.request(
      `lines/${lineId}/ticket`,
      requestParams,
      'POST',
      idempotencyKey,
    ).then((response: TicketCreationResponse) => {
      const ticketId = parseInt(`${response.id}`, 10);
      const reply: TicketCreationResponse = { id: ticketId };
      return reply;
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
  static details(ticket: IdOrObject<Ticket>): Promise<Ticket> {
    const ticketId = extractId(ticket);
    return ApiBase.request(`tickets/${ticketId}`) as Promise<Ticket>;
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
  static edit(
    ticket: IdOrObject<Ticket>,
    changes: TicketEditingParameters,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!changes) {
      throw new Error(ERROR_NO_TICKET_CHANGES);
    }

    const intermediate: any = { ...changes };

    if (intermediate.extra) {
      intermediate.extra = JSON.stringify(intermediate.extra);
    }

    if (intermediate.user) {
      intermediate.user = extractId(intermediate.user);
    } else {
      delete intermediate.user;
    }

    const request: TicketEditingRequest = intermediate;

    return ApiBase.request(`tickets/${ticketId}/edit`, request).then(
      (response: { result: 'success' }) => response.result,
    );
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
  static call(
    ticket: IdOrObject<Ticket>,
    user?: IdOrObject<Ticket>,
    desk?: IdOrObject<Ticket>,
    keepActiveTicketsOpen?: boolean,
  ): Promise<Ticket> {
    if (!ticket) {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    const ticketId = extractId(ticket);

    let request: TicketCallRequest = {};

    if (user) {
      request.user = extractId(user);
    }

    if (desk) {
      request.desk = extractId(desk);
    }

    if (typeof keepActiveTicketsOpen !== 'undefined') {
      request.keepActiveTicketsOpen = keepActiveTicketsOpen;
    }

    // If no request parameters specified, don't include the empty object.
    if (!user && !desk && typeof keepActiveTicketsOpen === 'undefined') {
      request = undefined;
    }

    return ApiBase.request(`tickets/${ticketId}/call`, request, 'POST');
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
  static recall(ticket: IdOrObject<Ticket>): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(
      `tickets/${ticketId}/recall`,
      undefined,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static markServed(ticket: IdOrObject<Ticket>): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    return ApiBase.request(
      `tickets/${ticketId}/markserved`,
      undefined,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static markNoShow(ticket: IdOrObject<Ticket>): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(
      `tickets/${ticketId}/marknoshow`,
      undefined,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static cancel(
    ticket: IdOrObject<Ticket>,
    user: IdOrObject<User>,
  ): Promise<string> {
    const ticketId = extractId(ticket);
    const userId = extractId(user);
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error(ERROR_NO_USER);
    }

    return ApiBase.request(
      `tickets/${ticketId}/cancel`,
      { user: userId },
      'POST',
    ).then((response: { result: 'success' }) => response.result);
  }

  /**
   * Return a ticket to the queue.
   *
   * Returning a ticket to the queue makes the ticket's status go back to 'NEW', a Ticket
   * Created event will fire, and the ticket will appear back in the queue. The ticket can be
   * ordered to be first in queue or the last in queue, depending on
   * the reason the visitor needs to go back to the queue and when they will be back for service.
   *
   * Only called tickets (with the status 'CALLED') can be returned to the queue.
   *
   * @param ticket  The ticket to return to queue. The ticket ID can be used instead of the
   * Ticket object.
   * @param user  The user that returned the ticket to the queue. The user ID can be used instead
   * of the User object.
   * @param position  The position where to place the returned ticket. Either 'FIRST' or 'LAST'.
   * @returns {Promise<string>} a promise that resolves to "success" if it worked, and rejects
   * if something went wrong.
   */
  static returnToQueue(
    ticket: IdOrObject<Ticket>,
    user: IdOrObject<User>,
    position: DesiredQueuePosition,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);
    const userId = extractId(user);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('No user given');
    }

    if (!position) {
      throw new Error(ERROR_NO_QUEUE_POSITION);
    }

    const query = new URLSearchParams({
      position: `${position}`,
      user: userId,
    }).toString();
    return ApiBase.request(
      `tickets/${ticketId}/returntoqueue?${query}`,
      undefined,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static addLabel(
    ticket: IdOrObject<Ticket>,
    label: string,
    user?: IdOrObject<User>,
  ): Promise<'success' | 'no action'> {
    const ticketId = extractId(ticket);
    const userId = user ? extractId(user) : undefined;

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!label) {
      throw new Error('No label given.');
    }

    const body: { value: string; user?: string } = {
      value: label,
    };

    if (typeof userId === 'string') {
      body.user = userId;
    }

    return ApiBase.request(`tickets/${ticketId}/labels/add`, body, 'POST').then(
      (response: { result: 'success' | 'no action' }) => response.result,
    );
  }

  /**
   * Set ticket labels.
   *
   * It sets ticket's labels list. Clerks can see the labels in the Service View,
   * and can save additional details about the visitor into the label list. Labels are
   * automatically colored.
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const ticket = 591050;
   * const labels = ["Has documents", "Has invitation"];
   * await Qminder.tickets.setLabels(ticket, labels, myUserId);
   * ```
   * @param ticket  The ticket. The ticket ID can be used instead of the Ticket object.
   * @param labels  The labels to set, eg. ["Has documents", "Has invitation"]
   * @returns promise that resolves to 'success' if all was OK, and rejects
   * if something else went wrong.
   */
  static setLabels(
    ticket: IdOrObject<Ticket>,
    labels: Array<string>,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!labels) {
      throw new Error('No labels given.');
    }

    const body: { labels: Array<string> } = { labels };

    return ApiBase.request(
      `tickets/${ticketId}/labels`,
      JSON.stringify(body),
      'PUT',
    ).then((response: { result: 'success' }) => response.result);
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
  static removeLabel(
    ticket: IdOrObject<Ticket>,
    label: string,
    user: IdOrObject<User>,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);
    const userId = extractId(user);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!label) {
      throw new Error('No label given.');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('No user given');
    }

    const body = {
      value: label,
      user: userId,
    };

    return ApiBase.request(
      `tickets/${ticketId}/labels/remove`,
      body,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static assignToUser(
    ticket: IdOrObject<Ticket>,
    assigner: IdOrObject<User>,
    assignee: IdOrObject<User>,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);
    const assignerId = extractId(assigner);
    const assigneeId = extractId(assignee);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!assignerId || typeof assignerId !== 'string') {
      throw new Error('No assigner given');
    }

    if (!assigneeId || typeof assigneeId !== 'string') {
      throw new Error('No assignee given');
    }

    const body = {
      assigner: assignerId,
      assignee: assigneeId,
    };
    return ApiBase.request(`tickets/${ticketId}/assign`, body, 'POST').then(
      (response: { result: 'success' }) => response.result,
    );
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
  static unassign(
    ticket: IdOrObject<Ticket>,
    unassigner: IdOrObject<User>,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);
    const unassignerId = extractId(unassigner);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!unassignerId || typeof unassignerId !== 'string') {
      throw new Error(
        'Qminder.tickets.unassign was called without a valid unassigner user.',
      );
    }

    return ApiBase.request(
      `tickets/${ticketId}/unassign`,
      { user: unassignerId },
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static reorder(
    ticket: IdOrObject<Ticket>,
    afterTicket: IdOrObject<Ticket> | null,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    const afterTicketId: string | null =
      afterTicket === null ? (afterTicket as null) : extractId(afterTicket);

    let postData: { after: string | null } | undefined;
    if (afterTicketId) {
      postData = {
        after: afterTicketId,
      };
    }

    return ApiBase.request(
      `tickets/${ticketId}/reorder`,
      postData,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
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
  static getEstimatedTimeOfService(
    ticket: IdOrObject<Ticket>,
  ): Promise<number> {
    const ticketId = extractId(ticket);

    if (typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    return ApiBase.request(`tickets/${ticketId}/estimated-time`).then(
      (response: { estimatedTimeOfService: number }) =>
        response.estimatedTimeOfService,
    );
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
  static getMessages(
    ticket: IdOrObject<Ticket>,
  ): Promise<Array<TicketMessage>> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }
    return ApiBase.request(`tickets/${ticketId}/messages`).then(
      (response: { messages: TicketMessage[] }) => response.messages,
    );
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
  static sendMessage(
    ticket: IdOrObject<Ticket>,
    message: string,
    user: IdOrObject<User>,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);
    const userId = extractId(user);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!message || typeof message !== 'string') {
      throw new Error('No message specified. The message has to be a string.');
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error(ERROR_NO_USER);
    }

    const body = {
      message,
      user: userId,
    };

    return ApiBase.request(`tickets/${ticketId}/messages`, body, 'POST').then(
      (response: { result: 'success' }) => response.result,
    );
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
  static forward(
    ticket: IdOrObject<Ticket>,
    line: IdOrObject<Line>,
    user?: IdOrObject<User>,
  ): Promise<object> {
    const ticketId = extractId(ticket);
    const lineId = extractId(line);
    const userId = extractId(user);

    if (typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (typeof lineId !== 'string') {
      throw new Error('Line ID is missing.');
    }

    // If the user's ID was passed and it's invalid, throw an error
    if (user !== undefined && typeof userId !== 'string') {
      throw new Error('User ID is missing.');
    }

    const body: { line: string; user?: string } = {
      line: lineId,
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
  static setExternalData(
    ticket: IdOrObject<Ticket>,
    provider: string,
    title: string,
    data: any,
  ): Promise<'success'> {
    const ticketId = extractId(ticket);

    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error(ERROR_NO_TICKET_ID);
    }

    if (!provider || typeof provider !== 'string') {
      throw new Error(
        'No provider specified. The provider has to be a string.',
      );
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

    return ApiBase.request(
      `tickets/${ticketId}/external`,
      payload,
      'POST',
    ).then((response: { result: 'success' }) => response.result);
  }
}
