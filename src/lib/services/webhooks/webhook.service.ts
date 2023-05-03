import { create, remove } from './webhook.js';

/**
 * The Webhooks API allows the developer to create and remove webhooks.
 */
export const WebhookService = {
  /**
   * Create a webhook.
   * Creating a webhook registers the given URL for the current account. All events for the current
   * account across all locations will be sent to the URL.
   *
   * The authenticity of the webhook can be checked using the HMAC sent along with the request.
   * To set up HMAC verification, follow the instructions here:
   * https://www.qminder.com/docs/api/webhooks/
   *
   * Calls the HTTP API `POST /v1/webhooks`.
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example. Add a webhook
   * const url = 'https://example.com/webhooks/qminder';
   * const webhook: Webhook = await Qminder.Webhook.create(url);
   * console.log(webhook.id); // 123
   * console.log(webhook.secret); // 'hmacSecretText'
   * // You can use the webhook.secret to check the message validity via HMAC.
   * ```
   * @param url  the public URL to receive the webhooks, such as https://example.com/webhook
   * @returns a Webhook object with the webhook's ID and HMAC secret.
   * @throws ERROR_NO_URL when the URL was not provided
   * @see Webhook
   */
  create,
  /**
   * Remove a webhook.
   *
   * Removing a webhook will stop all events from being sent to the URL, and removes it from the
   * list of webhooks in the Qminder Dashboard.
   *
   * Calls the HTTP API `DELETE /v1/webhooks/<ID>`
   *
   * For example:
   *
   * ```javascript
   * import { Qminder } from 'qminder-api';
   * Qminder.setKey('API_KEY_HERE');
   * // Example 1. Remove the webhook with ID '5924b157-313b-4829-bcb4-ced968347f0c'
   * await Qminder.Webhook.remove('5924b157-313b-4829-bcb4-ced968347f0c');
   * // Example 2. Create and remove a webhook
   * const url = 'https://example.com/webhooks/qminder';
   * const webhook = await Qminder.Webhook.create(url);
   * await Qminder.Webhook.remove(webhook);
   * ```
   * @param webhook  the Webhook object or the webhook ID.
   * @returns a promise that resolves when the API call worked, and rejects when it failed.
   * @throws {Error} ERROR_NO_WEBHOOK_ID when the webhook ID is not provided or is not a number
   */
  remove,
};
