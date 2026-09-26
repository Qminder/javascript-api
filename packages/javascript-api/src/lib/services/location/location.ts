import { Desk } from '../../model/desk.js';
import { ResponseValidationError } from '../../model/errors/response-validation-error.js';
import { InputFieldCreationRequest } from '../../model/input-field/input-field-creation-request.js';
import { LocationCreatedResponse } from '../../model/location/location-created-response.js';
import { LocationCreationRequest } from '../../model/location/location-creation-request.js';
import { Location } from '../../model/location.js';
import { OpeningHours } from '../../model/opening-hours.js';
import { OpeningHoursException } from '../../model/opening-hours-exception.js';
import { extractId, IdOrObject } from '../../util/id-or-object.js';
import { ApiBase } from '../api-base/api-base.js';
import { V2_HEADERS } from '../v2-headers.js';

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

export async function create(
  request: LocationCreationRequest,
): Promise<LocationCreatedResponse> {
  if (!request || typeof request !== 'object') {
    throw new Error('Location creation request invalid or missing.');
  }
  if (!request.name || typeof request.name !== 'string') {
    throw new Error('Cannot create a location without a name.');
  }
  if (typeof request.latitude !== 'number' || isNaN(request.latitude)) {
    throw new Error('Cannot create a location without a valid latitude.');
  }
  if (typeof request.longitude !== 'number' || isNaN(request.longitude)) {
    throw new Error('Cannot create a location without a valid longitude.');
  }
  if (!request.address || typeof request.address !== 'string') {
    throw new Error('Cannot create a location without an address.');
  }
  if (!request.country || typeof request.country !== 'string') {
    throw new Error('Cannot create a location without a country.');
  }

  const result: LocationCreatedResponse = await ApiBase.request('locations', {
    method: 'POST',
    body: JSON.stringify(request),
    headers: V2_HEADERS,
  });

  if (!result.id) {
    throw new ResponseValidationError('Response does not contain "id"');
  }

  return result;
}

export async function createInputField(
  inputField: InputFieldCreationRequest,
): Promise<void> {
  await ApiBase.request('input-fields', {
    method: 'POST',
    body: JSON.stringify(inputField),
    headers: V2_HEADERS,
  });
}
