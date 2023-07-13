import { ApiBase } from './services/api-base/api-base.js';
import { DeviceService } from './services/device/device.service.js';
import { GraphqlService } from './services/graphql/graphql.service.js';
import { LineService } from './services/line/line.service.js';
import { LocationService } from './services/location/location.service.js';
import { TicketServiceV2 } from './services/ticket-v2/ticket-v2.service.js';
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
  public static TicketV2 = TicketServiceV2;

  public static setKey(key: string): void {
    ApiBase.setKey(key);
    this.GraphQL.setKey(key);
  }

  public static setServer(server: string): void {
    ApiBase.setServer(server);
    this.GraphQL.setServer(server);
  }
}
