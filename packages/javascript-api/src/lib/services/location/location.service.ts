import {
  details,
  getDesks,
  list,
  setOpeningHours,
  setOpeningHoursExceptions,
} from './location.js';

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

  /**
   * Set the weekly opening hours for a location.
   *
   * Each day can have `businessHours` (array of time ranges), `closed: true`, or
   * neither (open all day). `businessHours` and `closed` are mutually exclusive.
   *
   * Calls the following HTTP API: `PUT /locations/<ID>/opening-hours`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * await Qminder.Location.setOpeningHours(1234, {
   *   mon: { businessHours: [{ opens: { hours: 9, minutes: 0 }, closes: { hours: 17, minutes: 0 } }] },
   *   tue: { businessHours: [{ opens: { hours: 9, minutes: 0 }, closes: { hours: 17, minutes: 0 } }] },
   *   wed: {},
   *   thu: {},
   *   fri: {},
   *   sat: { closed: true },
   *   sun: { closed: true },
   * });
   * ```
   *
   * @param location the location or location ID
   * @param openingHours the weekly opening hours configuration
   */
  setOpeningHours,

  /**
   * Set date-specific exceptions to the regular opening hours schedule.
   *
   * Each exception requires a `date` and exactly one of `closed: true` or `businessHours`.
   * An optional `closedReason` (max 30 characters) can be provided when closed.
   *
   * Calls the following HTTP API: `PUT /locations/<ID>/opening-hours/exceptions`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   *
   * await Qminder.Location.setOpeningHoursExceptions(1234, [
   *   { date: '2020-05-13', closed: true, closedReason: 'Holiday' },
   * ]);
   * ```
   *
   * @param location the location or location ID
   * @param exceptions the list of opening hours exceptions
   */
  setOpeningHoursExceptions,
};
