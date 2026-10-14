import { AccessTokenProvider } from './services/auth-headers.js';
import { ApiBase } from './services/api-base/api-base.js';
import { DeviceService } from './services/device/device.service.js';
import { GraphqlService } from './services/graphql/graphql.service.js';
import { LineService } from './services/line/line.service.js';
import { LocationService } from './services/location/location.service.js';
import { TicketService } from './services/ticket/ticket.service.js';
import { UserService } from './services/user/user.service.js';
import { WebhookService } from './services/webhooks/webhook.service.js';

export class Qminder {
  public static ApiBase = ApiBase;
  public static GraphQL = new GraphqlService();

  public static Device = DeviceService;
  public static Line = LineService;
  public static Ticket = TicketService;
  public static Webhook = WebhookService;
  public static User = UserService;
  public static Location = LocationService;

  public static setKey(key: string): void {
    ApiBase.setKey(key);
    this.GraphQL.setKey(key);
  }

  /**
   * Authenticate with a Bearer access token, instead of an API key.
   *
   * The provider is called before every request and before every WebSocket connection,
   * so it can return a token that it refreshes. Calling this replaces the key of `setKey`.
   *
   * When the API answers 401, the library asks the provider for a new token with `forceRefresh: true`
   * and sends the request once more. The provider must then return a new token, also when the one that it has
   * has not expired.
   *
   * ```javascript
   * Qminder.setAccessTokenProvider(async ({ forceRefresh }) =>
   *   forceRefresh ? await refreshAccessToken() : await getAccessToken(),
   * );
   * ```
   */
  public static setAccessTokenProvider(provider: AccessTokenProvider): void {
    ApiBase.setAccessTokenProvider(provider);
    this.GraphQL.setAccessTokenProvider(provider);
  }

  public static setServer(server: string): void {
    ApiBase.setServer(server);
    this.GraphQL.setServer(server);
  }
}
