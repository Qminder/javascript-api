import Location from '../model/Location.js';
import ApiBase from '../api-base.js';
import Desk from '../model/Desk';
/**
 * This service allows you to get location data
 *
 */
export default class LocationService {
  /**
   * List all locations the API key has access to.
   * The API key belongs to a particular account and has access to all locations of the account.
   * This function returns a list of locations that the API key has access to.
   *
   * ```GET /locations/```
   * @returns {Promise.<Array>} A promise that resolves to an array of locations.
   */
  static list(): Promise<Array<Location>> {
    return ApiBase.request('locations/').then(locations => {
      return locations.data.map(each => new Location(each));
    });
  }

  /**
   * Get details about a location.
   *
   * ```GET /locations/<ID>```
   * @param {number} locationId the location's unique ID, for example 1234
   * @returns {Promise.<Location>} A promise that resolves to the location.
   */
  static details(locationId: number): Promise<Location> {
    return ApiBase.request(`locations/${locationId}/`).then(details => new Location(details));
  }

  /**
   * Fetch all desks of the location.
   * The desks all have sequential numbered names, for example: "1".
   *
   * ```GET /v1/locations/<ID>/desks```
   * @returns the list of desks in this location
   */
  static getDesks(location: Location) : Promise<Array<Desk>> {
    return ApiBase.request(`locations/${location.id}/desks`).then(response => {
      if (!response.desks) {
        throw new Error(`Desk list response was invalid - ${response}`);
      }
      return response.desks.map(each => new Desk(each));
    });
  }

  /**
   * Get the input fields in a particular location.
   * This returns a list of the configured input fields that clerks can enter on the Qminder
   * Dashboard Service View.
   *
   * ```GET /locations/<ID>/input-fields```
   * @example
   * // Get the input fields for a location that has only Line, First Name & Last Name enabled
   * const inputFields = await Qminder.locations.getInputFields(1234);
   * console.log(inputFields);
   * // => [ { type: 'firstName' }, { type: 'lastName' }, { type: 'line' } ]
   * @param location the location to query, either as an ID or a Qminder Location object
   * @returns {Promise.<Array.<InputField>>} a Promise that resolves to an array of input
   * fields, or rejects if something went wrong.
   */
  static getInputFields(location: (Location | number)): Promise<Array<InputField>> {
    let locationId: ?number = null;
    // Get the location's ID
    if (location instanceof Location) {
      locationId = location.id;
    } else {
      locationId = location;
    }
    return ApiBase.request(`locations/${locationId}/input-fields`)
                  .then(response => response.fields);
  }
};
