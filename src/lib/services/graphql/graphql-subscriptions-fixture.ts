/* eslint-env jest */

import { DocumentNode } from 'graphql';
import WS from 'jest-websocket-mock';
import { DeserializedMessage } from 'jest-websocket-mock/lib/websocket';
import { Observer, Subscription, lastValueFrom, take } from 'rxjs';
import { ConnectionStatus } from '../../model/connection-status';
import { GraphqlService } from './graphql.service';

const keyValue = 'temporary_api_key';
const PORT = 42990;
const SERVER_URL = `ws://localhost:${PORT}`;

export class GraphQLSubscriptionsFixture {
  graphqlService = new GraphqlService();
  server: WS;

  constructor() {
    this.openServer();
    jest
      .spyOn(this.graphqlService as any, 'fetchTemporaryApiKey')
      .mockResolvedValue(keyValue);
    jest
      .spyOn(this.graphqlService as any, 'getServerUrl')
      .mockReturnValue(SERVER_URL);
  }

  triggerSubscription(
    query: DocumentNode | string = 'subscription { baba }',
  ): Subscription {
    return this.graphqlService.subscribe(query).subscribe(() => {});
  }

  getGraphqlServiceActiveSubscriptionCount(): number {
    return (this.graphqlService as any).subscriptions.length;
  }

  getGraphqlServiceSubscriptionObserverMapSize(): number {
    return Object.keys(this.getGraphqlServiceSubscriptionObserverMap()).length;
  }

  getGraphqlServiceSubscriptionObserverMap(): Record<string, Observer<object>> {
    return (this.graphqlService as any).subscriptionObserverMap;
  }

  async waitForConnection() {
    await this.server.connected;
  }

  async getNextMessage() {
    return this.server.nextMessage;
  }

  sendMessageToClient(message: DeserializedMessage<object>) {
    this.server.send(message);
  }

  openServer() {
    this.server = new WS(SERVER_URL, { jsonProtocol: true, mock: false });
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return lastValueFrom(
      this.graphqlService.getSubscriptionConnectionObservable().pipe(take(1)),
    );
  }

  async handleConnectionInit() {
    await this.waitForConnection();
    const initMessage = (await this.server.nextMessage) as { type: string };
    expect(initMessage.type).toBe('connection_init');
    this.server.send({
      type: 'connection_ack',
    });
  }

  async closeWithError(closeCode: number) {
    this.server.error({
      reason: 'Connection reset by peer',
      code: closeCode,
      wasClean: false,
    });
    await this.server.closed;
  }

  async closeWithCode(closeCode: number) {
    this.server.close({
      reason: 'Connection reset by peer',
      code: closeCode,
      wasClean: true,
    });
    await this.server.closed;
  }

  async consumeSubscribeMessage() {
    expect(await this.server.nextMessage).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
  }

  async consumePingMessage() {
    expect(await this.server.nextMessage).toEqual({
      type: 'ping',
    });
  }

  async consumeAnyMessage() {
    await this.server.nextMessage;
  }

  async cleanup() {
    WS.clean();
    await this.server.closed;
  }
}
