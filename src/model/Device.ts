// @flow
/**
 * The Device object represents a physical device that is paired to Qminder, such as an iPad or
 * Apple TV or custom TV screen.
 */
export default class Device {
  /** The unique identifier for this device, for example 1342 */
  id: string;
  /**
   * The device's type, used to categorize devices as iPads (sign-in device) or TVs (TV monitor).
   *
   * The 'MONITOR' device type is used for desk monitors that show the clerk's name at the desk.
   * This has been deprecated.
   *
   * The 'OVERVIEW_MONITOR' device type is used for TVs that show an overview of the location's
   * queues.
   *
   * The 'PRINTER' device type is used for legacy ticket printers, this has been deprecated.
   *
   * The 'NAME_DEVICE' device type is used for the iPad Sign-In App, more generally, as a
   * sign-in application.
   *
   */
  type: 'MONITOR' | 'OVERVIEW_MONITOR' | 'PRINTER' | 'NAME_DEVICE';

  /** The device's name. This can be modified in the Qminder Dashboard. */
  name: string;

  /** True if the device is currently online, false if it's offline. */
  offline: boolean;

  /** True if the iOS device needs a system update, false if it does not. */
  needsUpdate: ?boolean;

  /**
   * The iOS device's battery status.
   *
   * The object looks like this:
   *
   * ```
   * {
   *  "level": 15,
   *  "charging": true
   * }
   * ```
   *
   * where level is the battery level, in percent, and charging is true when the iOS device is
   * currently charging.
   * */
  battery: ?{
    level: number;
    charging: boolean;
  };

  /**
   * Construct a new Device object based on a properties object.
   * @example
   * const device = new Device({ id: 5, name: 'My iPad', type: 'NAME_DEVICE' });
   * @param properties an object with the Device's properties.
   * @constructor
   */
  constructor(properties: Device) {
    // $FlowFixMe: TODO: assign all properties the Device supports, without writing them all out?
    Object.assign(this, properties);
  }
}
