/* eslint-env jest */

import { DocumentNode, print } from 'graphql';
import WS from 'jest-websocket-mock';
import { DeserializedMessage } from 'jest-websocket-mock/lib/websocket';
import { lastValueFrom, Observer, Subscriber, Subscription, take } from 'rxjs';

import { ConnectionStatus } from '../../../model/connection-status';
import { GraphqlService } from '../graphql.service';

const DUMMY_API_KEY = 'temporary_api_key';
const PORT = 42990;
const SERVER_URL = `ws://localhost:${PORT}`;

export class GraphQLSubscriptionsFixture {
  graphqlService = new GraphqlService();
  server: WS;

  constructor() {
    this.graphqlService.setKey('permanentkey');
    this.openServer();
    jest
      .spyOn(this.graphqlService as any, 'getServerUrl')
      .mockReturnValue(SERVER_URL);

    jest
      .spyOn(this.graphqlService as any, 'getTemporaryApiKey')
      .mockResolvedValue(DUMMY_API_KEY);
  }

  triggerSubscription(
    query: DocumentNode | string = 'subscription { baba }',
    subscriber:
      | Partial<Observer<object>>
      | ((value: object) => void) = () => {},
  ): Subscription {
    return this.graphqlService.subscribe(query).subscribe(subscriber);
  }

  getGraphqlServiceActiveSubscriptionCount(): number {
    return (this.graphqlService as any).subscriptions.length;
  }

  getMessagesSubscribers(): Map<string, Subscriber<Record<string, any>>> {
    return this.graphqlService['messagesSubscribers'];
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

  async closeWithError(closeCode: number, reason = 'Connection reset by peer') {
    this.server.error({
      reason,
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

  async consumeSubscribeMessage(
    query: DocumentNode | string = 'subscription { baba }',
    { id }: { readonly id: string } = { id: '1' },
  ) {
    expect(await this.server.nextMessage).toEqual({
      id,
      type: 'start',
      payload: { query: typeof query === 'string' ? query : print(query) },
    });
  }

  async consumePingMessage() {
    expect(await this.server.nextMessage).toEqual({
      type: 'ping',
    });
  }

  async consumeInitMessage() {
    expect(await this.server.nextMessage).toEqual({
      type: 'connection_init',
      payload: null,
    });
  }

  async consumeAnyMessage() {
    await this.server.nextMessage;
  }

  async cleanup(): Promise<void> {
    this.teardownService();
    WS.clean();
    await this.server.closed;
  }

  private tearDownService(): void {
    this.graphqlService['openSocket'] = () => Promise.resolve();

    const socket = this.graphqlService['socket'];
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (typeof socket.close === 'function') {
        socket.close();
      }

      this.graphqlService['socket'] = null;
    }

    this.graphqlService['clearPingMonitoring']();
  }
    const service = this.graphqlService as any;

    service.openSocket = () => Promise.resolve();

    if (service.socket) {
      service.socket.onopen = null;
      service.socket.onmessage = null;
      service.socket.onerror = null;
      service.socket.onclose = null;
      if (typeof service.socket.close === 'function') {
        service.socket.close();
      }
      service.socket = null;
    }

    service.clearPingMonitoring();
  }
}
