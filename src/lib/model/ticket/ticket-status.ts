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
