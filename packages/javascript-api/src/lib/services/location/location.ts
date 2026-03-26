import { Desk } from '../../model/desk.js';
import { InputFieldCreationRequest } from '../../model/input-field/input-field-creation-request.js';
import { Location } from '../../model/location.js';
import { OpeningHours } from '../../model/opening-hours.js';
import { OpeningHoursException } from '../../model/opening-hours-exception.js';
import { extractId, IdOrObject } from '../../util/id-or-object.js';
import { ApiBase } from '../api-base/api-base.js';

const V2_HEADERS = { 'X-Qminder-API-Version': '2020-09-01' } as const;

export function list(): Promise<Location[]> {
  return ApiBase.request('v1/locations/').then(
    (locations: { data: Location[] }) => {
      return locations.data;
    },
  );
}

export function details(location: IdOrObject<Location>): Promise<Location> {
  const locationId = extractId(location);
  return ApiBase.request(`v1/locations/${locationId}/`);
}

export function getDesks(location: IdOrObject<Location>): Promise<Desk[]> {
  const locationId = extractId(location);
  return ApiBase.request(`v1/locations/${locationId}/desks`).then(
    (response: { desks: Desk[] }) => {
      if (!response.desks) {
        throw new Error(`Desk list response was invalid - ${response}`);
      }
      return response.desks;
    },
  );
}

export async function setOpeningHours(
  location: IdOrObject<Location>,
  openingHours: OpeningHours,
): Promise<void> {
  const locationId = extractId(location);
  await ApiBase.request(`locations/${locationId}/opening-hours`, {
    method: 'PUT',
    body: JSON.stringify(openingHours),
    headers: V2_HEADERS,
  });
}

export async function setOpeningHoursExceptions(
  location: IdOrObject<Location>,
  exceptions: OpeningHoursException[],
): Promise<void> {
  const locationId = extractId(location);
  await ApiBase.request(`locations/${locationId}/opening-hours/exceptions`, {
    method: 'PUT',
    body: JSON.stringify(exceptions),
    headers: V2_HEADERS,
  });
}

/**
 * Create a new input field for a location.
 *
 * Calls the following HTTP API: `POST /input-fields` (with V2 header)
 *
 * @param inputField the input field creation request
 * @returns a promise that resolves when the input field has been created
 */
export async function createInputField(
  inputField: InputFieldCreationRequest,
): Promise<void> {
  await ApiBase.request('input-fields', {
    method: 'POST',
    body: JSON.stringify(inputField),
    headers: V2_HEADERS,
  });
}
