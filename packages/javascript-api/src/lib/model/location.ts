/**
 * A Location represents one service center in the real world. It can have multiple lines and
 * service clerks, and multiple iPads and TVs. A location can have SMS enabled, when using the
 * Pro plan.
 */
export interface Location {
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
}

/**
 * Represents a Qminder Dashboard input field.
 * Input fields are either the name, phone number and line, or a number of custom fields defined
 * by the Location Manager.
 * @see TextInputField
 * @see SpecialInputField
 * @see SelectInputField
 */
export type InputField = SpecialInputField | TextInputField | SelectInputField;

/**
 * Represents a Qminder Dashboard input field that accepts freeform text.
 *
 * For example:
 *
 * ```
 * {
 *  type: "text",
 *  title: "E-mail address"
 * }
 * ```
 */
export interface TextInputField {
  type: 'text';
  title: string;
}

/** Represents a Qminder Dashboard input field that collects the first and last name, phone
 *  number or line.
 *
 *  For example:
 *
 *  ```{ type: "firstName" }```
 */
export interface SpecialInputField {
  type: 'firstName' | 'lastName' | 'phoneNumber' | 'line';
}

/**
 * Represents a single option in a dropdown select input field.
 * An option can have a color, which is represented as a hex string.
 *
 * For example:
 *
 * ```{ title: "Documents filled", color: "#ff00ff" }```
 */
export interface SelectFieldOption {
  color?: string;
  title: string;
}

/**
 * Represents a dropdown select input field that allows clerks to select between multiple
 * options in Qminder Dashboard.
 *
 * For example:
 *
 * ```
 * {
 *  type: "select",
 *  title: "Action taken",
 *  options: [
 *    { "title": "Documents filled", color: "#ff00ff" },
 *    { "title": "Hired", color: "#ff0000" },
 *    { "title": "Needs a permit", color: "#f00f00" },
 *    { "title": "No action taken" },
 *  ]
 * }
 * ```
 *
 * @see SelectFieldOption
 */
export interface SelectInputField {
  type: 'select';
  title: string;
  options: Array<SelectFieldOption>;
}
