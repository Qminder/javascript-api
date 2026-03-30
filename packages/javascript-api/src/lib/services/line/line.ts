import { Line } from '../../model/line.js';
import { LineCreatedResponse } from '../../model/line/line-created-response.js';
import { LineCreationRequest } from '../../model/line/line-creation-request.js';
import { Location } from '../../model/location.js';
import { extractId, IdOrObject } from '../../util/id-or-object.js';
import { ApiBase, SuccessResponse } from '../api-base/api-base.js';
import { V2_HEADERS } from '../v2-headers.js';
import { ResponseValidationError } from '../../model/errors/response-validation-error.js';

type LineUpdateParameters = Pick<Line, 'id'> &
  Partial<Pick<Line, 'color' | 'name'>>;

export function list(location: IdOrObject<Location>): Promise<Line[]> {
  const locationId = extractId(location);
  if (!locationId || typeof locationId !== 'string') {
    throw new Error('Location ID invalid or missing.');
  }
  return ApiBase.request(`v1/locations/${locationId}/lines`).then(
    (response: { data: Line[] }) => response.data,
  );
}

export function details(line: IdOrObject<Line>): Promise<Line> {
  const lineId = extractId(line);
  if (!lineId) {
    throw new Error('Line ID invalid or missing.');
  }
  return ApiBase.request(`v1/lines/${lineId}/`);
}

export async function create(
  location: IdOrObject<Location>,
  line: LineCreationRequest,
): Promise<LineCreatedResponse> {
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
  if (!line.color || typeof line.color !== 'string') {
    throw new Error('Cannot create a line without a color.');
  }

  const result: LineCreatedResponse = await ApiBase.request(
    `locations/${locationId}/lines`,
    {
      method: 'POST',
      body: JSON.stringify(line),
      headers: V2_HEADERS,
    },
  );

  if (!result.id) {
    throw new ResponseValidationError('Response does not contain "id"');
  }

  return result;
}

export function update(line: LineUpdateParameters): Promise<SuccessResponse> {
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
  return ApiBase.request(`v1/lines/${lineId}`, {
    body: data,
    method: 'POST',
  }) as Promise<SuccessResponse>;
}

export function enable(line: IdOrObject<Line>): Promise<SuccessResponse> {
  const lineId = extractId(line);
  if (!lineId || typeof lineId !== 'string') {
    throw new Error('Line ID invalid or missing.');
  }
  return ApiBase.request(`v1/lines/${lineId}/enable`, {
    method: 'POST',
  }) as Promise<SuccessResponse>;
}

export function disable(line: IdOrObject<Line>): Promise<SuccessResponse> {
  const lineId = extractId(line);
  if (!lineId || typeof lineId !== 'string') {
    throw new Error('Line ID invalid or missing.');
  }
  return ApiBase.request(`v1/lines/${lineId}/disable`, {
    method: 'POST',
  }) as Promise<SuccessResponse>;
}

export function archive(line: IdOrObject<Line>): Promise<SuccessResponse> {
  const lineId = extractId(line);
  if (!lineId || typeof lineId !== 'string') {
    throw new Error('Line ID invalid or missing.');
  }
  return ApiBase.request(`v1/lines/${lineId}/archive`, {
    method: 'POST',
  }) as Promise<SuccessResponse>;
}

export function unarchive(line: IdOrObject<Line>): Promise<SuccessResponse> {
  const lineId = extractId(line);

  if (!lineId || typeof lineId !== 'string') {
    throw new Error('Line ID invalid or missing.');
  }
  return ApiBase.request(`v1/lines/${lineId}/unarchive`, {
    method: 'POST',
  }) as Promise<SuccessResponse>;
}

export function deleteLine(line: IdOrObject<Line>): Promise<SuccessResponse> {
  const lineId = extractId(line);

  if (!lineId || typeof lineId !== 'string') {
    throw new Error('Line ID invalid or missing.');
  }
  return ApiBase.request(`v1/lines/${lineId}`, {
    method: 'DELETE',
  }) as Promise<SuccessResponse>;
}
