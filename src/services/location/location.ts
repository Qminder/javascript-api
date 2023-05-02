import { Location } from '../../model/location';
import { Desk } from '../../model/desk';
import { extractId, IdOrObject } from '../../util/id-or-object';
import { ApiBase } from '../api-base/api-base';

export function list(): Promise<Location[]> {
  return ApiBase.request('locations/').then(
    (locations: { data: Location[] }) => {
      return locations.data;
    },
  );
}

export function details(location: IdOrObject<Location>): Promise<Location> {
  const locationId = extractId(location);
  return ApiBase.request(`locations/${locationId}/`);
}

export function getDesks(location: IdOrObject<Location>): Promise<Desk[]> {
  const locationId = extractId(location);
  return ApiBase.request(`locations/${locationId}/desks`).then(
    (response: { desks: Desk[] }) => {
      if (!response.desks) {
        throw new Error(`Desk list response was invalid - ${response}`);
      }
      return response.desks;
    },
  );
}
