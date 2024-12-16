export enum TicketType {
  /** Ticket was created by clerk or API integration */
  MANUAL = 'MANUAL',
  /** Ticket was created by sign-in kiosk device */
  NAME = 'NAME',
  /** Ticket was created by Remote Sign-in App */
  MICROSITE = 'MICROSITE',
  /** @deprecated */
  PHONE = 'PHONE',
  /** @deprecated */
  PRINTER = 'PRINTER',
}
