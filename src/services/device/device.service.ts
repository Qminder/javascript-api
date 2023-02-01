import ApiBase from '../api-base/api-base';
import Device from '../../model/device';
import { extractId, IdOrObject } from '../../util/id-or-object';

/**
 * DeviceService allows the developer to manage devices such as iPads that have the Qminder
 * Sign-In app installed, or Apple TVs with the Qminder TV app.
 */
export default class DeviceService {
  /**
   * Read the details of a particular TV based on its Id.
   * Returns the Id, name, theme and settings of the TV.
   *
   * Calls the HTTP API: `GET /v1/tv/<Id>`
   *
   * For example:
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * const tv = await Qminder.devices.details(1425);
   * ```
   * @param tv the Device that represents the TV, or the TV Id
   * @returns {Promise.<Device>} a Promise that resolves to device details, or rejects if
   * something went wrong.
   * @throws Error if the TV Id is not provided.
   */
  static details(tv: IdOrObject<Device>): Promise<Device> {
    const tvId = extractId(tv);
    if (!tvId || typeof tvId !== 'string') {
      throw new Error('TV Id not provided');
    }

    return ApiBase.request(`tv/${tvId}`) as Promise<Device>;
  }

  /**
   * Modify the TV's name.
   * This changes the TV's display name in the TV List in the Qminder Dashboard.
   *
   * Calls the HTTP API: `POST /v1/tv/<Id>`
   *
   * For example:9
   *
   * ```javascript
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * let device = Qminder.devices.details(1235);
   * device = await Qminder.devices.edit(device, device.name + ' (Offsite)');
   * ```
   * @param tv the Device that represents the TV, or the TV Id.
   * @param newName the desired new name of the TV.
   * @returns a Promise that resolves to the new TV details, or rejects if something went wrong.
   * @throws Error if the TV Id and TV name are not provided.
   */
  static edit(tv: IdOrObject<Device>, newName: string): Promise<Device> {
    const tvId = extractId(tv);
    if (!tvId || typeof tvId !== 'string') {
      throw new Error('TV Id not provided');
    }
    if (!newName || typeof newName !== 'string') {
      throw new Error('TV name not provided');
    }
    return ApiBase.request(
      `tv/${tvId}`,
      { name: newName },
      'POST',
    ) as Promise<Device>;
  }

  /**
   * Remove a TV. This deletes the TV and revokes the API key, removing it from the list of TVs.
   *
   * Calls the HTTP API: `DELETE /v1/tv/<Id>`
   *
   * For example:
   *
   * ```
   * import * as Qminder from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example 1. Delete based on device Id
   * await Qminder.devices.remove(1235);
   * // Example 2. Delete based on Device object
   * const device = Qminder.devices.details(125);
   * await Qminder.devices.remove(device);
   * ```
   * @param tv the Device that represents the TV, or the TV Id.
   * @returns A promise that resolves when successful and rejects when something went wrong.
   * @throws Error if the TV Id is not provided
   */
  static remove(tv: IdOrObject<Device>): Promise<{ statusCode: number }> {
    const tvId = extractId(tv);
    if (!tvId || typeof tvId !== 'string') {
      throw new Error('TV Id not provided');
    }
    return ApiBase.request(`tv/${tvId}`, undefined, 'DELETE') as Promise<{
      statusCode: number;
    }>;
  }
}