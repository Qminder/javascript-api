/**
 * Desks represent working stations in a service location. For example, a bank office would use
 * numbered desks to call visitors to a specific clerk or table.
 *
 * For example, Jane Doe works at Desk 3, or John Smith works at Desk 2.
 *
 * Clerks can select the desk they are using before servicing customers, by using the Service View.
 *
 * Customers will be informed of the desk they need to go to in the Apple TV app or via SMS.
 *
 * Desks need to be enabled in a Location to be able to use them.
 */
export default interface Desk {
  /**
   * The desk's Id.
   *
   * This is used to select the desk, and call tickets to a specific desk.
   */
  id: number;

  /**
   * The desk's name.
   *
   * For numbered desks, this desk is a string containing the number, for example "4".
   */
  name: string;
}
