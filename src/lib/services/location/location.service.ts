import { details, getDesks, list } from './location';

/**
 * The LocationService allows you to get data about Locations.
 *
 * For example, to list all Locations that the Account has:
 *
 * ```javascript
 * // List all Locations
 * import { Qminder } from 'qminder-api';
 * Qminder.setKey('API_KEY_GOES_HERE');
 * const locations = await Qminder.Location.list();
 * console.log('Locations are', locations);
 * // => 'Locations are' [ { id: 14152, name: 'Service Center', ... } ]
 * ```
 */
export const LocationService = {
  /**
   * List all locations the API key has access to.
   * The API key belongs to a particular account and has access to all locations of the account.
   * This function returns a list of locations that the API key has access to.
   *
   * Calls the following HTTP API: `GET /locations/`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const locationList = await Qminder.Location.list();
   * ```
   * @returns A promise that resolves to an array of locations.
   */
  list,

  /**
   * Get details about a location.
   *
   * Calls the following HTTP API: `GET /locations/<ID>`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const locationDetails = await Qminder.Location.details(1234);
   * // locationDetails.id = 1234
   * // locationDetails.name = 'Example Location'
   * ```
   * @param locationId the location's unique ID, for example 1234
   * @returns A promise that resolves to the location.
   */
  details,

  /**
   * Fetch all desks of the location.
   * Desks may have numbered names or customized names.
   *
   * Calls the following HTTP API: `GET /v1/locations/<ID>/desks`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * const desks = await Qminder.Location.getDesks(11424);
   * console.log(desks);
   * // [ { "id": 9950, "name": "Desk 1" }, ... ]
   * ```
   *
   * @returns a Promise that resolves to the list of desks in this location
   */
  getDesks,
};
