import Line from '../model/Line';
import Location from '../model/Location';
import ApiBase from '../api-base';
import { extractId, IdOrObject } from '../util/id-or-object';

type LineCreateParameters = Partial<Omit<Line, 'id'>> & Pick<Line, 'name'>;
type LineUpdateParameters = Pick<Line, 'id'> &
  Partial<Pick<Line, 'color' | 'name'>>;

/**
 * The LineService allows you to access data about Lines in Qminder.
 *
 * For example, list all Lines of your Location:
 *
 * ```javascript
 * import * as Qminder from 'qminder-api';
 * Qminder.setKey('API_KEY_GOES_HERE');
 *
 * const locationId = 12345;
 * const lines = await Qminder.lines.list(locationId);
 *
 * console.log(lines);
 * ```
 */
export default class LineService {
  /**
   * Fetch the location's line list.
   * The lines will have the line ID, name, and color filled in.
   *
   * Calls the following HTTP API: `GET /locations/<ID>/lines`
   *
   * For example:
   *
   * ```javascript
   * const lines = await Qminder.lines.list(159);
   * ```
   * @param location the Location or its ID
   * @returns a promise that resolves to a list of lines, or rejects if something went wrong.
   */
  static list(location: IdOrObject<Location>): Promise<Line[]> {
    const locationId = extractId(location);
    if (!locationId || typeof locationId !== 'string') {
      throw new Error('Location ID invalid or missing.');
    }
    return ApiBase.request(`locations/${locationId}/lines`).then(
      (response: { data: Line[] }) => response.data,
    );
  }

  /**
   * Fetch detailed information about one line.
   *
   * Calls the following HTTP API: `GET /lines/<ID>`
   *
   * For example:
   *
   * ```javascript
   * const line: Line = await Qminder.lines.details(1425);
   * ```
   * @param line The line to get detailed info about, or the line's ID.
   * @returns a promise that resolves to the Line object, or rejects if something went wrong.
   */
  static details(line: IdOrObject<Line>): Promise<Line> {
    const lineId = extractId(line);
    if (!lineId) {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(`lines/${lineId}/`);
  }

  /**
   * Create a new Line and return its details.
   *
   * Calls the following HTTP API: `POST /locations/<ID>/lines`
   *
   * For example:
   *
   * ```javascript
   * const line: Line = await Qminder.lines.create(950, { name: 'Priority Service' });
   * console.log(line.id); // 1425
   * ```
   * @param location the location to add the line under
   * @param line the parameters of the new line - must include the line name
   * @returns a Promise that resolves to a new Line object, created according
   * to the parameters.
   */
  static create(
    location: IdOrObject<Location>,
    line: LineCreateParameters,
  ): Promise<Line> {
    const locationId = extractId(location);
    if (!locationId || typeof locationId !== 'string') {
      throw new Error('Location ID invalid or missing.');
    }
    if (!line || typeof line !== 'object') {
      throw new Error('Line invalid or missing.');
    }
    if (!line.name || typeof line.name !== 'string') {
      throw new Error('Cannot create a line without a line name.');
    }
    return ApiBase.request(
      `locations/${locationId}/lines`,
      line,
      'POST',
    ) as Promise<Line>;
  }

  /**
   * Update an existing Line name and color.
   *
   * Calls the following HTTP API: `POST /lines/<ID>`
   *
   * For example:
   *
   * ```javascript
   * const line = { "id": 950, "name": "Front Desk", "color": "#ffffff" };
   * await Qminder.lines.update(line);
   * ```
   * @param line the Line to be updated - must include the line id, the desired new name and color.
   * @returns A Promise that resolves when the line was updated, and rejects
   * when something went wrong.
   */
  static update(line: LineUpdateParameters): Promise<any> {
    if (!line || typeof line !== 'object') {
      throw new Error('Line is invalid or missing.');
    }

    const lineId = extractId(line);
    if (!lineId || typeof lineId !== 'string') {
      throw new Error('Line ID is invalid or missing.');
    }

    const lineName = line.name;
    if (!lineName || typeof lineName !== 'string') {
      throw new Error('Cannot update a line without a name.');
    }

    const lineColor = line.color;
    if (!lineColor || typeof lineColor !== 'string') {
      throw new Error('Cannot update a line without a color.');
    }

    const data = { name: lineName, color: lineColor };
    return ApiBase.request(`lines/${lineId}`, data, 'POST') as Promise<any>;
  }

  /**
   * Enable a disabled Line.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/enable`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.lines.enable(1425);
   * ```
   * @param line the Line or the ID of the line to be enabled.
   * @returns A Promise that resolves when the line was enabled, and rejects
   * when something went wrong.
   */
  static enable(line: IdOrObject<Line>): Promise<any> {
    const lineId = extractId(line);
    if (!lineId || typeof lineId !== 'string') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(
      `lines/${lineId}/enable`,
      undefined,
      'POST',
    ) as Promise<any>;
  }

  /**
   * Disable a Line.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/disable`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.lines.disable(1425);
   * ```
   * @param line the Line or the ID of the line to be disabled.
   * @returns A Promise that resolves when the line was disabled, and rejects
   * when there active tickets in the line or something went wrong.
   */
  static disable(line: IdOrObject<Line>): Promise<any> {
    const lineId = extractId(line);
    if (!lineId || typeof lineId !== 'string') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(
      `lines/${lineId}/disable`,
      undefined,
      'POST',
    ) as Promise<any>;
  }

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
   * await Qminder.lines.archive(1425);
   * ```
   * @param line the Line or the line's ID to archive
   * @returns A Promise that resolves when the line was archived, and rejects
   * when something went wrong.
   */
  static archive(line: IdOrObject<Line>): Promise<any> {
    const lineId = extractId(line);
    if (!lineId || typeof lineId !== 'string') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(
      `lines/${lineId}/archive`,
      undefined,
      'POST',
    ) as Promise<any>;
  }

  /**
   * Unarchive a Line.
   *
   * Calls the following HTTP API: `POST /lines/<ID>/unarchive`
   *
   * For example:
   *
   * ```javascript
   * await Qminder.lines.unarchive(1425);
   * ```
   * @param line the Line or the line's ID to unarchive
   * @returns A Promise that resolves when the line was unarchived, and rejects
   * when something went wrong.
   */
  static unarchive(line: IdOrObject<Line>): Promise<any> {
    const lineId = extractId(line);

    if (!lineId || typeof lineId !== 'string') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(
      `lines/${lineId}/unarchive`,
      undefined,
      'POST',
    ) as Promise<any>;
  }

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
   * await Qminder.lines.delete(1425);
   * ```
   * @param line the Line or the line's ID to delete
   * @returns A Promise that resolves when the line was deleted, and rejects
   * when something went wrong.
   */
  static delete(line: IdOrObject<Line>): Promise<any> {
    const lineId = extractId(line);

    if (!lineId || typeof lineId !== 'string') {
      throw new Error('Line ID invalid or missing.');
    }
    return ApiBase.request(
      `lines/${lineId}`,
      undefined,
      'DELETE',
    ) as Promise<any>;
  }
}
