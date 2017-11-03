// @flow
/**
 * A Location represents one service center in the real world. It can have multiple lines and
 * service clerks, and multiple iPads and TVs. A location can have SMS enabled, when using the
 * Pro plan.
 */
class Location {
  /**
   * The location's unique ID.
   */
  id: number;
  /**
   * The location's name, for example "SF Service Center" or "Manhattan Branch"
   */
  name: string;
  /**
   * The location's time zone offset, in minutes from UTC.
   * For example, this could be -420 for San Francisco (UTC - 7 hours),
   * and 60 for London (UTC + 1 hour).
   */
  timezoneOffset: number;
  /**
   * The location's geographical latitude.
   * This value is from the Google Maps API, using their projections.
   */
  latitude: number;
  /**
   * The location's geographical longitude.
   * This value is from the Google Maps API, using their projections.
   */
  longitude: number;

  /**
   * The location's country name.
   * This value is pulled from the Google Maps API.
   */
  country: string;

  /**
   * Creates a new Location object.
   * @example
   * const location = new Location(5);
   * console.log(location.id);       // 5
   * console.log(location.name);     // undefined
   * @param {number} properties the line's ID. Doesn't fill the other properties automatically.
   */
  /**
   * Creates a new Location object, filling in all of the provided fields. You can also copy another
   * Location by passing it to the constructor.
   * @example
   * const location = new Location({ id: 12345, name: 'Service Hub' });
   * console.log(location.id);       // 12345
   * console.log(location.name);     // 'Service Hub'
   * @param {Location} properties a Location, or a plain object describing a Location.
   * @param {number} properties.id the Location ID
   * @param {string} properties.name the location's name
   * @param {number} properties.latitude the Location's latitude
   * @param {number} properties.longitude the Location's longitude
   */
  constructor(properties: number | Location) {
    if (typeof properties === 'number') {
      this.id = properties;
    } else {
      // $FlowFixMe
      Object.assign(this, properties);
    }
  }
}

export default Location;
