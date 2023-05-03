import { ApiBase, SuccessResponse } from '../api-base/api-base.js';
import { Webhook } from '../../model/webhook.js';
import { extractId, IdOrObject } from '../../util/id-or-object.js';

export const ERROR_NO_URL = 'No URL provided';
/** @hidden */
export const ERROR_NO_WEBHOOK_ID = 'No Webhook ID provided';

type CreateWebhookResponse = Webhook;
type DeleteWebhookResponse = SuccessResponse;

export function create(url: string): Promise<Webhook> {
  if (!url || typeof url !== 'string') {
    throw new Error(ERROR_NO_URL);
  }
  return ApiBase.request(
    `webhooks`,
    { url },
    'POST',
  ) as Promise<CreateWebhookResponse>;
}

export function remove(
  webhook: IdOrObject<Webhook>,
): Promise<DeleteWebhookResponse> {
  const id = extractId(webhook);
  return ApiBase.request(`webhooks/${id}`, undefined, 'DELETE');
}
