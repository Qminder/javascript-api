import { ApiBase } from './services/api-base/api-base';
import { GraphQLService } from './services/graphql/graphql.service';
import { User } from './services/user/user.interface';
import { Location } from './services/location/location.interface';
import { Webhooks } from './services/webhooks/webhooks.interface';
import { Ticket } from './services/ticket/ticket.interface';
import { Line } from './services/line/line.interface';
import { Device } from './services/device/device.interface';

export class Qminder {
  public static ApiBase = ApiBase;
  public static GraphQL = new GraphQLService();

  public static Device = Device;
  public static Line = Line;
  public static Ticket = Ticket;
  public static Webhooks = Webhooks;
  public static User = User;
  public static Location = Location;

  public static setKey(key: string): void {
    ApiBase.setKey(key);
    this.GraphQL.setKey(key);
  }

  public static setServer(server: string): void {
    ApiBase.setServer(server);
    this.GraphQL.setServer(server);
  }
}
