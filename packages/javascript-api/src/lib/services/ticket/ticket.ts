import { Line } from '../../model/line.js';
import { TicketCreatedResponse } from '../../model/ticket/ticket-created-response.js';
import { TicketCreationRequest } from '../../model/ticket/ticket-creation-request.js';
import { TicketStatus } from '../../model/ticket/ticket-status.js';
import { Ticket, TicketMessage } from '../../model/ticket/ticket.js';
import { User } from '../../model/user.js';
import {
  IdOrObject,
  extractId,
  extractIdToNumber,
} from '../../util/id-or-object.js';
import { ApiBase } from '../api-base/api-base.js';
import { ResponseValidationError } from '../../model/errors/response-validation-error.js';
import { ExternalData } from '../../model/ticket/external-data.js';

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

export type TicketEditingParameters = Pick<
  Ticket,
  'line' | 'phoneNumber' | 'firstName' | 'lastName' | 'email' | 'extra'
> & { user: IdOrObject<User> };

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

interface LabelRemoveRequest {
  value: string;
  user?: string;
}

type TicketCreationResponse = Pick<Ticket, 'id'>;

export function search(search: TicketSearchCriteria): Promise<Array<Ticket>> {
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

  return ApiBase.request(`v1/tickets/search?${queryStr}`).then(
    (response: { data: Ticket[] }) => response.data,
  );
}

export function count(search: TicketCountCriteria): Promise<number> {
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
  return ApiBase.request(`v1/tickets/count?${queryStr}`).then(
    (response: { count: number }) => response.count,
  );
}

export async function create(
  request: TicketCreationRequest,
): Promise<TicketCreatedResponse> {
  const body = JSON.stringify(request);

  const result: TicketCreatedResponse = await ApiBase.request('tickets', {
    method: 'POST',
    body,
    headers: {
      'X-Qminder-API-Version': '2020-09-01',
    },
  });
  if (!result.id) {
    throw new ResponseValidationError('Response does not contain "id"');
  }

  return result;
}

export function details(ticket: IdOrObject<Ticket>): Promise<Ticket> {
  const ticketId = extractId(ticket);
  return ApiBase.request(`v1/tickets/${ticketId}`) as Promise<Ticket>;
}

export function edit(
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

  return ApiBase.request(`v1/tickets/${ticketId}/edit`, { body: request }).then(
    (response: { result: 'success' }) => response.result,
  );
}

export function call(
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

  return ApiBase.request(`v1/tickets/${ticketId}/call`, {
    body: request,
    method: 'POST',
  });
}

export function recall(ticket: IdOrObject<Ticket>): Promise<'success'> {
  const ticketId = extractId(ticket);

  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error(ERROR_NO_TICKET_ID);
  }
  return ApiBase.request(`v1/tickets/${ticketId}/recall`, {
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function markServed(ticket: IdOrObject<Ticket>): Promise<'success'> {
  const ticketId = extractId(ticket);

  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error(ERROR_NO_TICKET_ID);
  }

  return ApiBase.request(`v1/tickets/${ticketId}/markserved`, {
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function markNoShow(ticket: IdOrObject<Ticket>): Promise<'success'> {
  const ticketId = extractId(ticket);

  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error(ERROR_NO_TICKET_ID);
  }
  return ApiBase.request(`v1/tickets/${ticketId}/marknoshow`, {
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function cancel(
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

  return ApiBase.request(`v1/tickets/${ticketId}/cancel`, {
    body: { user: userId },
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function returnToQueue(
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
  return ApiBase.request(`v1/tickets/${ticketId}/returntoqueue?${query}`, {
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function addLabel(
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

  return ApiBase.request(`v1/tickets/${ticketId}/labels/add`, {
    body: body,
    method: 'POST',
  }).then((response: { result: 'success' | 'no action' }) => response.result);
}

export function setLabels(
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

  return ApiBase.request(`v1/tickets/${ticketId}/labels`, {
    body: JSON.stringify(body),
    method: 'PUT',
  }).then((response: { result: 'success' }) => response.result);
}

export function removeLabel(
  ticket: IdOrObject<Ticket>,
  label: string,
  user?: IdOrObject<User>,
): Promise<'success'> {
  const ticketId = extractId(ticket);
  const userId = user ? extractId(user) : undefined;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error(ERROR_NO_TICKET_ID);
  }

  if (!label) {
    throw new Error('No label given.');
  }

  const requestBody: LabelRemoveRequest = {
    value: label,
  };
  if (userId) {
    requestBody.user = userId;
  }

  return ApiBase.request(`v1/tickets/${ticketId}/labels/remove`, {
    body: requestBody,
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function assignToUser(
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
  return ApiBase.request(`v1/tickets/${ticketId}/assign`, {
    body: body,
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function unassign(
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

  return ApiBase.request(`v1/tickets/${ticketId}/unassign`, {
    body: { user: unassignerId },
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function reorder(
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

  return ApiBase.request(`v1/tickets/${ticketId}/reorder`, {
    body: postData,
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function getEstimatedTimeOfService(
  ticket: IdOrObject<Ticket>,
): Promise<number> {
  const ticketId = extractId(ticket);

  if (typeof ticketId !== 'string') {
    throw new Error(ERROR_NO_TICKET_ID);
  }

  return ApiBase.request(`v1/tickets/${ticketId}/estimated-time`).then(
    (response: { estimatedTimeOfService: number }) =>
      response.estimatedTimeOfService,
  );
}

export function getMessages(
  ticket: IdOrObject<Ticket>,
): Promise<Array<TicketMessage>> {
  const ticketId = extractId(ticket);

  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error(ERROR_NO_TICKET_ID);
  }
  return ApiBase.request(`v1/tickets/${ticketId}/messages`).then(
    (response: { messages: TicketMessage[] }) => response.messages,
  );
}

export function sendMessage(
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

  return ApiBase.request(`v1/tickets/${ticketId}/messages`, {
    body: body,
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}

export function forward(
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

  return ApiBase.request(`v1/tickets/${ticketId}/forward`, { body: body });
}


export function setExternalData(
  ticket: IdOrObject<Ticket>,
  provider: string,
  title: string,
  data: ExternalData,
): Promise<'success'> {
  const ticketId = extractId(ticket);

  if (!ticketId || typeof ticketId !== 'string') {
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

  return ApiBase.request(`v1/tickets/${ticketId}/external`, {
    body: payload,
    method: 'POST',
  }).then((response: { result: 'success' }) => response.result);
}
