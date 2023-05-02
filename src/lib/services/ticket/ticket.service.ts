import {
  search,
  count,
  create,
  details,
  edit,
  call,
  recall,
  markServed,
  markNoShow,
  cancel,
  returnToQueue,
  addLabel,
  setLabels,
  removeLabel,
  assignToUser,
  unassign,
  reorder,
  getEstimatedTimeOfService,
  getMessages,
  sendMessage,
  forward,
  setExternalData,
} from './ticket';

/**
 * TicketService includes methods that work with tickets. Tickets represent a visitor that is
 * currently in the queue.
 *
 * For example, to create a new ticket, use {@link create}.
 *
 * ```javascript
 * import { Qminder } from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 1. Create a new ticket in Line ID 12346
 * const ticket = await Qminder.Ticket.create(12346, {
 *    firstName: 'Jane',
 *    lastName: 'Eyre',
 *    phoneNumber: 13185551234
 * });
 * ```
 *
 * For example, to get a list of all visitors currently in the queue, use {@link search}.
 *
 * ```javascript
 * import { Qminder } from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 2. Get a list of all visitors currently in queue in location 12345
 * const visitors = await Qminder.Ticket.search({ location: 12345, status: ['NEW'] });
 * ```
 *
 * This service additionally includes methods to work with visitors, such as call them to
 * service, add custom business-specific labels or mark them as served.
 *
 * For example, to call the next visitor in the lines 12345, 12346 and 12347, use {@link callNext}.
 *
 * ```javascript
 * import { Qminder } from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 3. Call the next visitor in lines 12345, 12346, 12347
 * const visitor = await Qminder.Ticket.callNext([12345, 12346, 12347]);
 * console.log(visitor);
 * // => { id: 141592145 }
 * ```
 */
export const TicketService = {
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
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example 1. Search line 1234 for tickets created after July 9, 2018, ordered by IDs,
   * // smallest first.
   * const criteria = {
   *     line: [ 1234 ],
   *     order: 'id ASC',
   *     minCalled: "2018-07-09T00:00:00Z"
   * };
   * const tickets: Array<Ticket> = Qminder.Ticket.search(criteria);
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
   * const tickets: Array<Ticket> = Qminder.Ticket.search(criteria);
   * const ticket: Ticket = tickets[0];
   * // NOTE: only included in the response data, if criteria.responseScope === 'MESSAGES'
   * // This data can also be loaded with Qminder.Ticket.getMessages(Ticket)
   * const messages: Array<TicketMessage> = ticket.messages;
   * console.log(messages[0].body); // "It's your turn!"
   * ```
   * @param search the search criteria
   * @returns A promise that resolves to matching tickets.
   */
  search,

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
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const criteria = { line: 123, status: ['NEW'] };
   * const count = await Qminder.Ticket.count(criteria);
   * console.log(count); // 14
   * ```
   * @param search the search criteria to use
   * @returns the number of tickets that match the search criteria
   */
  count,

  /**
   * Creates a new ticket and puts it into the queue as the last in the given line.
   *
   * Calls this HTTP API: `POST /v1/lines/<ID>/ticket`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Create a ticket with first and last name, and phone number
   * const lineId = 1234;
   * const ticket: Ticket = new Qminder.Ticket({
   *    firstName: "Jane",
   *    lastName: "Smith",
   *    phoneNumber: 3185551234,
   * });
   * const ticketId = await Qminder.Ticket.create(lineId, ticket);
   * console.log(ticketId); // 12345678
   *
   * // Example 2. Create a ticket with custom fields
   * const lineId = 1234;
   * const ticket: Ticket = new Qminder.Ticket({
   *    firstName: "Sarah Jane",
   *    lastName: "Smith",
   *    extra: [ { "title": "Order ID", "value": "1234567890" } ]
   * });
   * const ticketId = await Qminder.Ticket.create(lineId, ticket);
   * console.log(ticketId); // 12345681

   * // Example 3. Create a ticket by using a Line object to specify the line
   * const ticket: Ticket = new Qminder.Ticket({
   *    firstName: "Sarah Jane",
   *    lastName: "Smith",
   *    extra: [ { "title": "Order ID", "value": "1234567890" } ]
   * });
   * const line: Line = await Qminder.lines.details(12345);
   * const ticketId = await Qminder.Ticket.create(line, ticket);
   * console.log(ticketId); // 12345689
   * ```
   * @param line  the ticket's desired line
   * @param ticket  the ticket data
   * @param idempotencyKey  optional: a unique identifier that lets you safely retry creating the same ticket twice
   * @returns a promise that resolves to the ID of the new ticket.
   * @throws ERROR_NO_LINE_ID when the lineId parameter is undefined or not a number.
   */
  create,

  /**
   * Fetches the details of a given ticket ID and returns a Ticket object filled with data.
   *
   * Calls the following HTTP API: `GET /v1/tickets/<ID>`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const ticket = await Qminder.Ticket.details(12345);
   * console.log(ticket.id); // 12345
   * console.log(ticket.firstName); // Jane
   * console.log(ticket.lastName); // Eyre
   * ```
   * @param ticket  the Ticket to query, by ticket ID or Ticket object
   * @returns the ticket's details as a Ticket object
   * @throws ERROR_NO_TICKET_ID when the ticket ID is undefined or not a number.
   */
  details,

  /**
   * Edits the ticket.
   *
   * To edit a ticket, pass the ticket ID to edit, and an object that only includes the keys
   * that need to be changed.
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Edit a ticket's first name
   * const ticket = { id: 12345, firstName: "John", lastName: "Smith" };
   * const changes = { firstName: "Jane" };
   * const successMessage = await Qminder.Ticket.edit(ticket, changes);
   * console.log(successMessage === "success"); // true if it worked
   * ```
   * @param ticket  the ticket to edit, either the Ticket object or the ticket's ID
   * @param changes  an object only including changed properties of the ticket
   * @returns a Promise that resolves to "success" when editing the ticket worked
   * @throws ERROR_NO_TICKET_ID when the ticket ID was undefined or not a number
   * @throws ERROR_NO_TICKET_CHANGES when the ticket changes were undefined
   */
  edit,

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
  call,

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
  recall,

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
  markServed,

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
  markNoShow,

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
  cancel,

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
  returnToQueue,

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
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const myUserId = 15151;
   * const ticket = 591050;
   * const labelText = "Has documents";
   * await Qminder.Ticket.addLabel(ticket, labelText, myUserId);
   * ```
   * @param ticket  The ticket to label. The ticket ID can be used instead of the Ticket object.
   * @param label  The label to add, eg. "Has documents"
   * @param user  The user that is adding the label.
   * @returns promise that resolves to 'success' if all was OK, and 'no
   * action' if the label was already there, and rejects if something else went wrong.
   */
  addLabel,

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
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const ticket = 591050;
   * const labels = ["Has documents", "Has invitation"];
   * await Qminder.Ticket.setLabels(ticket, labels, myUserId);
   * ```
   * @param ticket  The ticket. The ticket ID can be used instead of the Ticket object.
   * @param labels  The labels to set, eg. ["Has documents", "Has invitation"]
   * @returns promise that resolves to 'success' if all was OK, and rejects
   * if something else went wrong.
   */
  setLabels,

  /**
   * Remove a label from the ticket.
   *
   * This API call removes the label from a ticket's label list, by the label's text.
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const myUserId = 51000;
   * const ticket = 1234567;
   * const label = "Hello";
   * await Qminder.Ticket.removeLabel(ticket, label, myUserId);
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
  removeLabel,

  /**
   * Assign the given ticket to an user (assignee).
   *
   * The user who is assigning (assigner) should be the second argument.
   * The user who will take the ticket (assignee) should be the third argument.
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Assign Ticket 11425 to User 12345, and the user performing the action is 91020.
   * const myUserId = 91020;
   * const ticketId = 11425;
   * const assigneeId = 12345;
   * await Qminder.Ticket.assignToUser(ticketId, myUserId, assigneeId);
   * console.log('It worked!');
   *
   * // Example 2. Assign all tickets in Line 111 to user 15152
   * const tickets: Array<Ticket> = await Qminder.Ticket.search({ line: 111, status: ['NEW'] });
   * tickets.map((ticket: Ticket) => Qminder.Ticket.assign(ticket, 15152));
   * ```
   * @param ticket The ticket to assign to an user. The ticket ID can be used instead of the
   * Ticket object.
   * @param assigner The user who is assigning.
   * @param assignee The user who will take the ticket.
   * @returns {Promise.<string>} resolves to 'success' on success
   */
  assignToUser,

  /**
   * Un-assign a ticket. This returns the ticket to the unassigned list.
   * This call works only for Tickets that have the status: 'NEW'.
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Using unassign with async/await in latest Javascript/ES6 standard
   * const ticketID = 141412345;
   * const myUserID = 123;
   * try {
   *   await Qminder.Ticket.unassign(ticketID, myUserID);
   *   console.log('Ticket unassign worked!');
   * } catch (error) {
   *   console.log('Ticket unassign failed', error);
   * }
   *
   * // Example 2. Using unassign without async/await, with plain promises.
   * const ticketID = 1452521;
   * const myUserID = 529;
   * Qminder.Ticket.unassign(ticketID, myUserID).then(function(success) {
   *   console.log('Ticket unassign worked!');
   * }, function(error) {
   *   console.log('Ticket unassign failed!', error);
   * });
   *
   * // Example 3. Using unassign with a Ticket object and async/await in latest Javascript/ES6
   * // standard
   * const myUserID = 42049;
   * const tickets = await Qminder.Ticket.search({ line: 12345 });
   * const ticket = tickets[0];
   * await Qminder.Ticket.unassign(ticket, myUserID);
   * ```
   * @param ticket the ticket object or the ticket's ID that needs un-assignment
   * @param unassigner the User who un-assigned the ticket, for example current user's ID
   * @returns a Promise that resolves when unassigning works and rejects when
   * unassigning fails
   */
  unassign,

  /**
   * Reorder a ticket after another ticket.
   *
   * Calls this HTTP API: `POST /v1/tickets/<ID>/reorder`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const ticket1 = { id: 12345 };
   * const ticket2 = { id: 12346 };
   * const ticket3 = { id: 12347 };
   * // Queue: ticket1, ticket2, ticket3
   * // Ticket 3 will be put after Ticket 1
   * Qminder.Ticket.reorder(ticket3, ticket1);
   * // Queue: ticket1, ticket3, ticket2
   * ```
   * @param ticket The ticket to reorder. The ticket ID can be used instead
   * of the Ticket object.
   * @param afterTicket the ticket to reorder after, or null if reordering to be first in the
   * queue.
   * @returns resolves to 'success' when it worked
   */
  reorder,

  /**
   * Get the estimated time that this visitor will be called for service.
   *
   * The time will be returned as a Unix timestamp (in seconds).
   *
   * Calls the HTTP API: `GET /v1/tickets/<ID>/estimated-time`
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Get the ticket's estimated time of service
   * const lineId = 15152;
   * const visitorDetails = { firstName: "Jon", lastName: "Snow" };
   * const ticket = await Qminder.Ticket.create(lineId, visitorDetails);
   * const eta = await Qminder.Ticket.getEstimatedTimeOfService(ticket);
   * console.log(eta); // 1509460809, for example.
   * ```
   * @param ticket  the ticket to get the estimated time for. The ticket ID can be used instead
   * of the Ticket object.
   * @returns the estimated Unix time the visitor will be called, eg 1509460809
   */
  getEstimatedTimeOfService,

  /**
   * Get the ticket's SMS messages.
   * If the location has SMS enabled, clerks can send and receive SMS messages from visitors.
   * It works only if the visitor's phone number has been entered into Qminder.
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Get list of messages with async/await in ES2017
   * const messages = await Qminder.Ticket.getMessages(12345678);
   * if (messages.length > 0) {
   *   console.log(messages[0]);
   *   // { "body": "Hi!", "type": "INCOMING", ... }
   * }
   *
   * // Example 2. Get list of messages with regular Javascript
   * Qminder.Ticket.getMessages(12345678).then(function(messages) {
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
  getMessages,

  /**
   * Send a new SMS message to a visitor.
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Send the message with async/await in ES2017
   * const success = await Qminder.Ticket.sendMessage(12345678,
   *                        "Hello! Go get some coffee now!",
   *                        { id: 14142 });
   * console.log('It worked!');
   * // NOTE: If sending a message fails, then the async function will be rejected.
   *
   * // Example 2. Send the message with regular Javascript
   * Qminder.Ticket.sendMessage(
   *        12345678,
   *        "Hello! Free coffee time!",
   *        { id: 14245 }
   * ).then(function(success) {
   *     console.log('It works!');
   * }, function(error) {
   *     console.log('Something went wrong while sending the message.');
   * });
   * ```
   * @param ticket  The ticket to send a message to. The user ID may also be used.
   * @param message  the message to send, as a text string, for example "Welcome to our location!"
   * @param user  the user who is sending the message. The user ID may also be used.
   * @returns a promise that resolves to the string "success" if it works, and rejects when
   * something goes wrong.
   */
  sendMessage,

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
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * // Example 1. Forward a ticket using ES2017 features (async and await). This code only works
   * // inside an asynchronous function.
   * const tickets = await Qminder.Ticket.search({ status: ['CALLED'], location: 3, limit: 1 });
   * if (tickets.length > 0) {
   *    await Qminder.Ticket.forward(tickets[0], 15124);
   *    console.log('Success!');
   * }
   *
   * // Example 2. Forward a ticket using regular Javascript. This doesn't use any ES6
   * // features and can be deployed to a server without any pre-processing.
   * Qminder.Ticket.search({ status: ['CALLED'], location: 3, limit: 1 }).then(function(tickets) {
   *   if (tickets.length > 0) {
   *      Qminder.Ticket.forward(tickets[0], 15124).then(function(success) {
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
  forward,

  /**
   * Add external data to a ticket.
   *
   * @param ticket  The ticket to add external data to. The ticket ID can be used instead of the Ticket object.
   * @param provider  Provider of the data. One record per provider is allowed.
   * @param title     Title for the data
   * @param data      The data to set
   * @returns promise that resolves to 'success' if all was OK and rejects if something else went wrong.
   */
  setExternalData,
};
