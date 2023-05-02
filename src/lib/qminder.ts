import { ApiBase } from './services/api-base/api-base';
import { GraphqlService } from './services/graphql/graphql.service';
import { UserService } from './services/user/user.service';
import { LocationService } from './services/location/location.service';
import { WebhookService } from './services/webhooks/webhook.service';
import { TicketService } from './services/ticket/ticket.service';
import { LineService } from './services/line/line.service';
import { DeviceService } from './services/device/device.service';

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

  public static setServer(server: string): void {
    ApiBase.setServer(server);
    this.GraphQL.setServer(server);
  }
}
