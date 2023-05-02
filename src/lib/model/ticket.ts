/**
 * Represents a person in the queue. Every time someone is added to the queue, a ticket is created in Qminder.
 * The ticket contains the person's name, phone number, email address or other custom fields.
 *
 * Tickets belong to lines.
 * Tickets can have many TicketExtras.
 *
 * If the location has SMS enabled, some visitors may exchange messages with the location. Those
 * messages are stored with the ticket in the TicketMessages list.
 *
 * Methods that work with Tickets can be found under {@link TicketService}, or `Qminder.tickets`.
 *
 * For example:
 *
 * To create a Ticket, call {@link TicketService.create}.
 * To search for tickets, call {@link TicketService.search}.
 */
import { TicketExtra } from './ticket-extra';
import { TicketLabel } from './ticket-label';

export interface Ticket {
  /**
   * This ticket's unique ID. For example, 14995020
   */
  id: number | string;

  /**
   * The current status of this ticket.
   */
  status?: TicketStatus;

  /**
   * Describes how the visitor was added into the queue.
   *
   * PHONE - The visitor used the discontinued Qminder Remote Queuing app. <br>
   * MANUAL - The visitor was added into the queue by a clerk. <br>
   * NAME - The visitor added themselves into a queue via iPad Sign-In (a Name Device). <br>
   * PRINTER - The visitor used a printer (discontinued) to queue up.
   */
  source?: 'PHONE' | 'MANUAL' | 'NAME' | 'PRINTER';

  /**
   * The ID of the line that this ticket belongs to. All tickets belong to a line.
   * For example, 14142.
   */
  line: number;

  /** The first name of the visitor. For example, "Jane". */
  firstName?: string;
  /** The last name of the visitor. For example, "Smith". */
  lastName?: string;
  /** The phone number of the visitor. For example: 3725551111 */
  phoneNumber?: number;
  /** The e-mail address of the visitor. For example: "jsmith224@example.com" */
  email?: string;

  /**
   * If the ticket has been reordered, this will contain an ISO8601 timestamp with milliseconds that
   * should be preferred over the "created date" to sort tickets by.
   *
   * "orderAfter": "2017-10-31T17:30:00.000Z"
   *
   * To sort tickets chronologically, taking into account reordering, the orderAfter date
   * should be preferred before the created date:
   *
   * const tickets = [ ... ];
   * tickets.sort((ticketA, ticketB) => {
   *     const timeA = ticketA.orderAfter || ticketA.created.date;
   *     const timeB = ticketB.orderAfter || ticketB.created.date;
   *     return new Date(timeA) - new Date(timeB);
   * });
   */
  orderAfter?: string;

  /**
   * An object that contains the creation timestamp of the ticket in ISO8601 format, with
   * milliseconds.
   *
   * { "date": "2017-10-31T17:30:00.000Z" }
   */
  created: {
    date: string;
  };

  /**
   * If the ticket has been called, then this object contains the time the ticket
   * was called, in ISO8601 format, with milliseconds.
   *
   * { "date": "2017-10-31T17:30:00.000Z" }
   */
  called?:
    | {
        date: string;
      }
    | undefined;

  /**
   * If the ticket has been marked served, then this object contains the time the ticket was
   * served, in ISO8601 format, with milliseconds.
   */
  served?: {
    date: string;
  };

  /**
   * If the ticket has been assigned to a user, this contains the assigner and assignee user IDs.
   *
   * The assigner is the person who assigned the ticket.
   * The assignee is the person who will call the ticket for service.
   *
   * { "assigner": 1459, "assignee": 1460 }
   *
   * If the person has assigned a ticket to themselves, the assigner and assignee will be equal.
   *
   * { "assigner": 1459, "assignee": 1459 }
   */

  assigned?: {
    assigner: number;
    assignee: number;
  };

  /**
   * If the ticket has been cancelled, this contains the time the ticket was cancelled, in
   * ISO8601 format, and the ID of the User who cancelled the ticket.
   *
   * { "date": "2017-10-31T17:30:00.000Z", "canceller": 1445 }
   */
  cancelled?: {
    date: string;
    canceller: number;
  };

  /**
   * List of custom fields and their values attached to the ticket.
   * @see TicketExtra
   */
  extra?: TicketExtra[];

  /**
   * List of the ticket's labels.
   * @see TicketLabel
   */
  labels?: TicketLabel[];

  /**
   * List of interactions of this ticket.
   * @see TicketInteraction
   */
  interactions?: TicketInteraction[];

  /**
   * List of SMS messages exchanged with this visitor.
   * @see TicketMessage
   */
  messages?: TicketMessage[];
}

/**
 * Represents an Interaction attached to a ticket.
 *
 * Interactions log the various steps the visitor takes to proceed from start of service to the end.
 * After the first step of a service completes, the visitor can pass to a second queue, for
 * additional service.
 *
 * The Interaction logs the start and end times and line IDs of the steps a customer passed.
 *
 * The interaction contains the start time and end time of the interaction as an ISO8601 string,
 * and the Line ID that the Ticket was in, during the specified time.
 */
export interface TicketInteraction {
  start: string;
  end: string;
  line: number;
}

/**
 * Represents an SMS message sent to or received from a visitor.
 *
 * SMS messages can be exchanged between clerks and visitors, and both outgoing and incoming
 * messages are listed in the ticket messages array.
 *
 * The SMS message's `created.date` is in the ISO 8601 format.
 *
 * The message's body is a string containing the message text.
 *
 * The message's type is either `INCOMING` for messages that the visitor sent to Qminder, or
 * `OUTGOING` for messages that clerks have sent to the visitor.
 *
 * The message's status is `NEW` when it has just been created, `SENT` when the message has been
 * passed on to the SMS service, `DELIVERED` when the SMS service received the message. The status
 * is `INVALID_NUMBER` if the visitor's phone number is not correct, and the SMS was not sent.
 *
 * The message's User ID is only filled in when it's an outgoing message, and it contains the ID of
 * the clerk that sent the outgoing message.
 *
 * For example, a message like the following represents an **outgoing** message sent by an employee,
 * with the User ID `15000`.
 *
 * ```
 * {
 *    "created": {
 *      "date": "2017-04-12T16:27:57Z"
 *    },
 *    "body": "It's your turn!",
 *    "type": "OUTGOING",
 *    "status": "SENT",
 *    "userId": 15000
 * }
 * ```
 *
 * The following message represents an **incoming message** sent by the visitor.
 *
 * ```
 * {
 *    "created": {
 *      "date": "2017-04-17T11:50:13Z"
 *    },
 *    "body": "Thank you!",
 *    "type": "INCOMING",
 *    "status": "NEW"
 * }
 * ```
 */
export interface TicketMessage {
  created: {
    date: string;
  };
  body: string;
  type: 'INCOMING' | 'OUTGOING';
  status: 'NEW' | 'SENT' | 'DELIVERED' | 'INVALID_NUMBER';
  userId?: number;
}

/**
 * Represents the current status of a ticket.
 *
 * NEW - the visitor is waiting in line. <br />
 * CALLED - the visitor is currently being served. <br />
 * SERVED - the visitor has been served. <br />
 * NOSHOW - the visitor did not show up. <br />
 * CANCELLED - the ticket was cancelled by an API call. <br />
 * CANCELLED_BY_CLERK - the ticket was cancelled by a clerk. <br />
 */
export type TicketStatus =
  | 'NEW'
  | 'CALLED'
  | 'CANCELLED'
  | 'CANCELLED_BY_CLERK'
  | 'NOSHOW'
  | 'SERVED';
