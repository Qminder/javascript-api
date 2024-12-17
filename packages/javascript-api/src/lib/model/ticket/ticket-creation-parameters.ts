import { Ticket } from './ticket.js';

export type TicketCreationParameters = Pick<
  Ticket,
  'source' | 'firstName' | 'lastName' | 'phoneNumber' | 'email' | 'extra'
>;
