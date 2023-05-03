import { Device } from '../../model/device';
import { extractId, IdOrObject } from '../../util/id-or-object';
import { ApiBase } from '../api-base/api-base';

export function details(tv: IdOrObject<Device>): Promise<Device> {
  const tvId = extractId(tv);
  if (!tvId || typeof tvId !== 'string') {
    throw new Error('TV ID not provided');
  }

  return ApiBase.request(`tv/${tvId}`) as Promise<Device>;
}

export function edit(tv: IdOrObject<Device>, newName: string): Promise<Device> {
  const tvId = extractId(tv);
  if (!tvId || typeof tvId !== 'string') {
    throw new Error('TV ID not provided');
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

export function remove(
  tv: IdOrObject<Device>,
): Promise<{ statusCode: number }> {
  const tvId = extractId(tv);
  if (!tvId || typeof tvId !== 'string') {
    throw new Error('TV ID not provided');
  }
  return ApiBase.request(`tv/${tvId}`, undefined, 'DELETE') as Promise<{
    statusCode: number;
  }>;
}
