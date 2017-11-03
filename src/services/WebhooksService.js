// @flow
import ApiBase from '../api-base';
import Webhook from '../model/Webhook';

export const ERROR_NO_URL = 'No URL provided';
export const ERROR_NO_WEBHOOK_ID = 'No Webhook ID provided';

/**
 * The Webhooks API allows the developer to create and remove webhooks.
 */
class WebhooksService {
  /**
   * Create a webhook.
   * Creating a webhook registers the given URL for the current account. All events for the current
   * account across all locations will be sent to the URL.
   *
   * The authenticity of the webhook can be checked using the HMAC sent along with the request.
   * To set up HMAC verification, follow the instructions here:
   * https://www.qminder.com/docs/api/webhooks/
   *
   * ```POST /v1/webhooks```
   * @example
   * const url = 'https://example.com/webhooks/qminder';
   * const webhook: Webhook = await Qminder.webhooks.create(url);
   * console.log(webhook.id); // 123
   * console.log(webhook.secret); // 'hmacSecretText'
   * // You can use the webhook.secret to check the message validity via HMAC.
   * @param url  the public URL to receive the webhooks, such as https://example.com/webhook
   * @returns a Webhook object with the webhook's ID and HMAC secret.
   * @throws ERROR_NO_URL when the URL was not provided
   * @see Webhook
   */
  static create(url: string): Promise<Webhook> {
    if (!url || typeof url !== 'string') {
      throw new Error(ERROR_NO_URL);
    }
    return ApiBase.request(`webhooks`, { url }, 'POST').then(response => new Webhook(response));
  }

  /**
   * Remove a webhook.
   *
   * Removing a webhook will stop all events from being sent to the URL, and removes it from the
   * list of webhooks in the Qminder Dashboard.
   *
   * ```DELETE /v1/webhooks/<ID>```
   * @example <caption>Remove the webhook with ID 123</caption>
   * await Qminder.webhooks.remove(123);
   * @example <caption>Create and remove a webhook</caption>
   * const url = 'https://example.com/webhooks/qminder';
   * const webhook: Webhook = await Qminder.webhooks.create(url);
   * await Qminder.webhooks.remove(webhook);
   * @param webhook  the Webhook object or the webhook ID.
   * @returns a promise that resolves when the API call worked, and rejects when it failed.
   * @throws {Error} ERROR_NO_WEBHOOK_ID when the webhook ID is not provided or is not a number
   */
  static remove(webhook: Webhook | number): Promise<*> {
    let webhookId: ?number = webhook instanceof Webhook ? webhook.id : webhook;
    if (!webhookId || typeof webhookId !== 'number') {
      throw new Error(ERROR_NO_WEBHOOK_ID);
    }
    return ApiBase.request(`webhooks/${webhookId}`, undefined, 'DELETE');
  }
}

export default WebhooksService;
