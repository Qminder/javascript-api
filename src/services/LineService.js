// @flow
import Line from '../model/Line';
import Location from '../model/Location';
import ApiBase from '../api-base';

/**
 * Line Service
 */
export default class LineService {
  /**
   * Fetch the location's line list.
   * The lines will have the line ID, name, and color filled in.
   *
   * ```GET /locations/<ID>/lines```
   * @example
   * const lines: Array<Line> = await Qminder.lines.list(159);
   * @param location the Location or its ID
   * @returns a promise that resolves to a list of lines, or rejects if something went wrong.
   */
  static list(location: Location | number): Promise<Array<Line>> {
    let locationId: ?number = location instanceof Location ? location.id : location;
    if (!locationId || typeof locationId !== 'number') {
      throw new Error('Location ID invalid or missing.');
    }
    return ApiBase.request(`locations/${locationId}/lines`)
                  .then(response => response.data.map(line => new Line(line)));
  }

  /**
   * Fetch detailed information about one line.
   *
   * ```GET /lines/<ID>```
   * @example
   * const line: Line = await Qminder.lines.details(1425);
   * @param {number} line The line to get detailed info about, or the line's ID.
   * @returns {Promise.<Line>} a promise that resolves to the Line object, or rejects if
   * something went wrong.
   */
  static details(line: Line | number): Promise<Line> {
    let lineId: ?number = line instanceof Line ? line.id : line;
    if (!lineId || typeof lineId !== 'number') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(`lines/${lineId}/`).then(response => new Line(response));
  }

  /**
   * Create a new Line and return its details.
   *
   * ```POST /locations/<ID>/lines```
   * @example
   * const line: Line = await Qminder.lines.create(950, { name: 'Priority Service' });
   * console.log(line.id); // 1425
   * @param {number} location the location to add the line under
   * @param {Line} line the parameters of the new line - must include the line name
   * @returns {Promise.<Object>} a Promise that resolves to a new Line object, created according
   * to the parameters.
   */
  static create(location: Location | number, line: Line): Promise<Line> {
    let locationId: ?number = location instanceof Location ? location.id : location;
    if (!locationId || typeof locationId !== 'number') {
      throw new Error('Location ID invalid or missing.');
    }
    if (!line || typeof line !== 'object') {
      throw new Error('Line invalid or missing.');
    }
    if (!line.name || typeof line.name !== 'string') {
      throw new Error('Cannot create a line without a line name.');
    }
    return ApiBase.request(`locations/${locationId}/lines/`, line, 'POST');
  }

  /**
   * Remove a Line.
   * This removes the line from the line list, from iPads and TVs, from the service screen and from
   * statistics. This action cannot be undone.
   *
   * ```DELETE /lines/<ID>```
   * @example
   * await Qminder.lines.remove(1425);
   * @param line  the Line or the line's ID to remove
   * @returns {Promise.<Object>} A Promise that resolves when the line was deleted, and rejects
   * when something went wrong.
   */
  static remove(line: Line | number): Promise<*> {
    let lineId: ?number = line instanceof Line ? line.id : line;
    if (!lineId || typeof lineId !== 'number') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(`lines/${lineId}`, undefined, 'DELETE');
  }
};
