import { details, edit, remove } from './device';

/**
 * DeviceService allows the developer to manage devices such as iPads that have the Qminder
 * Sign-In app installed, or Apple TVs with the Qminder TV app.
 */
export const DeviceService = {
  /**
   * Read the details of a particular TV based on its ID.
   * Returns the ID, name, theme and settings of the TV.
   *
   * Calls the HTTP API: `GET /v1/tv/<ID>`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * const tv = await Qminder.devices.details(1425);
   * ```
   * @param tv the Device that represents the TV, or the TV ID
   * @returns {Promise.<Device>} a Promise that resolves to device details, or rejects if
   * something went wrong.
   * @throws Error if the TV ID is not provided.
   */
  details,
  /**
   * Modify the TV's name.
   * This changes the TV's display name in the TV List in the Qminder Dashboard.
   *
   * Calls the HTTP API: `POST /v1/tv/<ID>`
   *
   * For example:9
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * let device = Qminder.devices.details(1235);
   * device = await Qminder.devices.edit(device, device.name + ' (Offsite)');
   * ```
   * @param tv the Device that represents the TV, or the TV ID.
   * @param newName the desired new name of the TV.
   * @returns a Promise that resolves to the new TV details, or rejects if something went wrong.
   * @throws Error if the TV ID and TV name are not provided.
   */
  edit,
  /**
   * Remove a TV. This deletes the TV and revokes the API key, removing it from the list of TVs.
   *
   * Calls the HTTP API: `DELETE /v1/tv/<ID>`
   *
   * For example:
   *
   * ```
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example 1. Delete based on device ID
   * await Qminder.devices.remove(1235);
   * // Example 2. Delete based on Device object
   * const device = Qminder.devices.details(125);
   * await Qminder.devices.remove(device);
   * ```
   * @param tv the Device that represents the TV, or the TV ID.
   * @returns A promise that resolves when successful and rejects when something went wrong.
   * @throws Error if the TV ID is not provided
   */
  remove,
};
