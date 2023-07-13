import { create } from './ticket-v2.js';

/**
 * TicketServiceV2 allows creating tickets.
 *
 * For example, to create a new ticket, use {@link create}.
 *
 * ```javascript
 * import { Qminder } from 'qminder-api';
 * Qminder.setKey('API_KEY_HERE');
 *
 * // Example 3. Call the next visitor in lines 12345, 12346, 12347
 * const visitor = await Qminder.TicketV2.create({
 *  lineId: '292201',
 *  firstName: 'Jane',
 *  lastName: 'Eyre',
 * });
 * console.log(visitor);
 * // => { id: 141592145 }
 * ```
 */
export const TicketServiceV2 = {
  /**
   * Adds a waiting ticket into a given line.
   *
   * @example
   * ```
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * const parameters: TicketCreationRequestV2 = {
   *     // Required parameter
   *     lineId: '194929',
   *     // First and last name are required
   *     firstName: 'James',
   *     lastName: 'Baxter',
   *     // Phone number and email are optional
   *     phoneNumber: '+12125551234',
   *     email: 'fred@example.com',
   *     // Source, if left unspecified, falls back to 'MANUAL'
   *     source: 'MANUAL',
   *     // Input fields are referenced by UUID
   *     fields: [
   *       // Text, URL and Date fields are set with the "value" key
   *       { inputFieldId: '5489ebf7-bcd9-4cd1-aae1-cad42538d83c', value: 'Yes' },
   *       // Select fields are set with "optionIds" key
   *       {
   *          inputFieldId: '5489ebf7-bcd9-4cd1-aae1-cad42538d83c',
   *          optionIds: [
   *            '84c40725-e80a-4281-aa9a-9db252373f16',
   *            'ed74eaa9-78ab-4cb7-9b91-26e0673ed70e'
   *          ]
   *       },
   *     ],
   *     labels: [
   *       { value: 'from website' }
   *     ],
   * };
   * const ticket: TicketCreatedResponse = await Qminder.TicketV2.create(parameters);
   * ```
   *
   * @param search the search criteria
   * @returns A promise that resolves to matching tickets.
   */
  create,
};
