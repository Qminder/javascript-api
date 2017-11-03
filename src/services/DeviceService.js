import ApiBase from '../api-base.js';
import Device from '../model/Device';
import Location from '../model/Location';

/**
 * DeviceService allows the developer to manage devices such as iPads that have the Qminder
 * Sign-In app installed, or Apple TVs with the Qminder TV app.
 */
export default class DeviceService {

  /**
   * List all devices (TVs, iPads, ...) at the given location.
   *
   * ```GET /v1/locations/<ID>/devices/```
   * @example
   * const devices: Array<Device> = await Qminder.devices.list(152);
   * const device: Device = devices[0];
   * console.log(device.type); // 'MONITOR', or maybe something else
   * @param location  the Location or location's ID
   * @returns a Promise that resolves to the list of devices for the location, or rejects if
   * something went wrong.
   * @throws Error if the Location ID is not provided.
   */
  static list(location: Location | number): Promise<Array<Device>> {
    let locationId: ?number = location instanceof Location ? location.id : location;
    if (!locationId || typeof locationId !== 'number') {
      throw new Error('Location ID not provided');
    }
    return ApiBase.request(`locations/${locationId}/devices/`)
                  .then(response => response.data.map(each => new Device(each)));
  }

  /**
   * Read the details of a particular TV based on its ID.
   * Returns the ID, name, theme and settings of the TV.
   *
   * ```GET /v1/tv/<ID>```
   * @example
   * const tv: Device = await Qminder.devices.details(1425);
   * @param tv the Device that represents the TV, or the TV ID
   * @returns {Promise.<Device>} a Promise that resolves to device details, or rejects if
   * something went wrong.
   * @throws Error if the TV ID is not provided.
   */
  static details(tv: Device | number): Promise<Device> {
    let tvId: ?number = tv instanceof Device ? tv.id : tv;
    if (!tvId || typeof tvId !== 'number') {
      throw new Error('TV ID not provided');
    }

    return ApiBase.request(`tv/${tvId}`).then(response => new Device(response));
  }

  /**
   * Modify the TV's name.
   * This changes the TV's display name in the TV List in the Qminder Dashboard.
   *
   * ```POST /v1/tv/<ID>```
   * @example
   * let device: Device = Qminder.devices.details(1235);
   * device = await Qminder.devices.edit(device, device.name + ' (Offsite)');
   * @param tv the Device that represents the TV, or the TV ID.
   * @param newName the desired new name of the TV.
   * @returns a Promise that resolves to the new TV details, or rejects if something went wrong.
   * @throws Error if the TV ID and TV name are not provided.
   */
  static edit(tv: Device | number, newName: string): Promise<Device> {
    let tvId: ?number = tv instanceof Device ? tv.id : tv;
    if (!tvId || typeof tvId !== 'number') {
      throw new Error('TV ID not provided');
    }
    if (!newName || typeof newName !== 'string') {
      throw new Error('TV name not provided');
    }
    return ApiBase.request(`tv/${tvId}`, { name: newName }, 'POST');
  }

  /**
   * Remove a TV. This deletes the TV and revokes the API key, removing it from the list of TVs.
   *
   * ```DELETE /v1/tv/<ID>```
   * @example
   * await Qminder.devices.remove(1235);
   * @example
   * const device: Device = Qminder.devices.details(125);
   * await Qminder.devices.remove(device);
   * @param tv the Device that represents the TV, or the TV ID.
   * @returns A promise that resolves when successful and rejects when something went wrong.
   * @throws Error if the TV ID is not provided
   */
  static remove(tv: Device | number): Promise<{ statusCode: number }> {
    let tvId: ?number = tv instanceof Device ? tv.id : tv;
    if (!tvId || typeof tvId !== 'number') {
      throw new Error('TV ID not provided');
    }
    return ApiBase.request(`tv/${tvId}`, undefined, 'DELETE');
  }
}
