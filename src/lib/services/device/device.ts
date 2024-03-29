import { Device } from '../../model/device.js';
import { extractId, IdOrObject } from '../../util/id-or-object.js';
import { ApiBase } from '../api-base/api-base.js';

export function details(tv: IdOrObject<Device>): Promise<Device> {
  const tvId = extractId(tv);
  if (!tvId || typeof tvId !== 'string') {
    throw new Error('TV ID not provided');
  }

  return ApiBase.request(`v1/tv/${tvId}`) as Promise<Device>;
}

export function edit(tv: IdOrObject<Device>, newName: string): Promise<Device> {
  const tvId = extractId(tv);
  if (!tvId || typeof tvId !== 'string') {
    throw new Error('TV ID not provided');
  }
  if (!newName || typeof newName !== 'string') {
    throw new Error('TV name not provided');
  }
  return ApiBase.request(`v1/tv/${tvId}`, {
    body: { name: newName },
    method: 'POST',
  }) as Promise<Device>;
}

export function remove(
  tv: IdOrObject<Device>,
): Promise<{ statusCode: number }> {
  const tvId = extractId(tv);
  if (!tvId || typeof tvId !== 'string') {
    throw new Error('TV ID not provided');
  }
  return ApiBase.request(`v1/tv/${tvId}`, { method: 'DELETE' }) as Promise<{
    statusCode: number;
  }>;
}
