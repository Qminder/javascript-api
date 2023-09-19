import { ID } from '../../util/id-or-object';
import { InputFieldRequest } from './input-field-request';
import { TicketLabelRequest } from './ticket-label-request';
import { TicketType } from './ticket-type';

export interface TicketCreationRequest {
  /** ID of the line to create the ticket into */
  lineId: ID;
  /**
   * First name (given name) of the visitor.
   * Min length: 2
   * Max length: 50
   */
  firstName: string;
  /**
   * Last name (family name) of the visitor.
   * Can be blank and undefined.
   * Max length: 50
   */
  lastName?: string;
  /** Phone number. Regex: /^\+?[0-9]{5,20}$/ */
  phoneNumber?: string;
  /** Email address. Regex: /^\S+@\S+\.\S+$/ */
  email?: string;
  /** Ticket's source. If unspecified, falls back to TicketType.MANUAL */
  source?: TicketType;
  fields?: InputFieldRequest[];
  labels?: TicketLabelRequest[];
}
