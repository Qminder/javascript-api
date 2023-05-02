import {
  list,
  details,
  create,
  update,
  enable,
  disable,
  archive,
  unarchive,
  deleteLine,
} from './line';

/**
 * The LineService allows you to access data about Lines in Qminder.
 *
 * For example, list all Lines of your Location:
 *
 * ```javascript
 * import { Qminder } from 'qminder-api';
 * Qminder.setKey('API_KEY_GOES_HERE');
 *
 * const locationId = 12345;
 * const lines = await Qminder.Line.list(locationId);
 *
 * console.log(lines);
 * ```
 */
export const LineService = {
  /**
   * Fetch the location's line list.
   * The lines will have the line ID, name, and color filled in.
   *
   * Calls the following HTTP API: `GET /locations/<ID>/lines`
   *
   * For example:
   *
   * ```javascript
   * const lines = await Qminder.Line.list(159);
   * ```
   * @param location the Location or its ID
   * @returns a promise that resolves to a list of lines, or rejects if something went wrong.
   */
  list,

  /**
   * Fetch detailed information about one line.
   *
   * Calls the following HTTP API: `GET /lines/<ID>`
   *
   * For example:
   *
   * ```javascript
   * const line: Line = await Qminder.Line.details(1425);
   * ```
   * @param line The line to get detailed info about, or the line's ID.
   * @returns a promise that resolves to the Line object, or rejects if something went wrong.
   */
  details,

  /**
   * Create a new Line and return its details.
   *
   * Calls the following HTTP API: `POST /locations/<ID>/lines`
   *
   * For example:
   *
   * ```javascript
   * const line: Line = await Qminder.Line.create(950, { name: 'Priority Service' });
   * console.log(line.id); // 1425
   * ```
   * @param location the location to add the line under
   * @param line the parameters of the new line - must include the line name
   * @returns a Promise that resolves to a new Line object, created according
   * to the parameters.
   */
  create,

  /**
   * Update an existing Line name and color.
   *
   * Calls the following HTTP API: `POST /lines/<ID>`
   *
   * For example:
   *
   * ```javascript
   * const line = { "id": 950, "name": "Front Desk", "color": "#ffffff" };
   * await Qminder.Line.update(line);
   * ```
   * @param line the Line to be updated - must include the line id, the desired new name and color.
   * @returns A Promise that resolves when the line was updated, and rejects
   * when something went wrong.
   */
  update,

  /**
   * Enable a disabled Line.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/enable`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.Line.enable(1425);
   * ```
   * @param line the Line or the ID of the line to be enabled.
   * @returns A Promise that resolves when the line was enabled, and rejects
   * when something went wrong.
   */
  enable,

  /**
   * Disable a Line.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/disable`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.Line.disable(1425);
   * ```
   * @param line the Line or the ID of the line to be disabled.
   * @returns A Promise that resolves when the line was disabled, and rejects
   * when there active tickets in the line or something went wrong.
   */
  disable,

  /**
   * Archive a Line.
   * This archives the line and removes it from the line list, from iPads and TVs, from the service screen and from
   * statistics. The line can be unarchived.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/archive`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.Line.archive(1425);
   * ```
   * @param line the Line or the line's ID to archive
   * @returns A Promise that resolves when the line was archived, and rejects
   * when something went wrong.
   */
  archive,

  /**
   * Unarchive a Line.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/unarchive`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.Line.unarchive(1425);
   * ```
   * @param line the Line or the line's ID to unarchive
   * @returns A Promise that resolves when the line was unarchived, and rejects
   * when something went wrong.
   */
  unarchive,

  /**
   * Delete a Line.
   * This deletes the line and removes it from the line list, from iPads and TVs, from the service screen and from
   * statistics. This action cannot be undone.
   *
   * Calls the following HTTP API: `DELETE /lines/<ID>`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.Line.delete(1425);
   * ```
   * @param line the Line or the line's ID to delete
   * @returns A Promise that resolves when the line was deleted, and rejects
   * when something went wrong.
   */
  delete: deleteLine,
};
