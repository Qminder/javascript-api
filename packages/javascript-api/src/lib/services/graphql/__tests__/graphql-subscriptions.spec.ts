import gql from 'graphql-tag';
import fetchMock from 'jest-fetch-mock';
import { WebSocket } from 'mock-socket';
import { firstValueFrom } from 'rxjs';

import { ConnectionStatus } from '../../../model/connection-status';
import { GraphQLSubscriptionsFixture } from '../__fixtures__/graphql-subscriptions-fixture';

jest.mock('isomorphic-ws', () => WebSocket);
jest.mock('../../../util/sleep-ms/sleep-ms', () => ({
  sleepMs: () => new Promise((resolve) => setTimeout(resolve, 4)),
}));

/**
 * The message sequence during these tests is the following:
 *
 * client -> server: 'connection_init'
 * server -> client: 'connection_ack'
 * client -> server: 'start', ID, query
 * server -> client: 'data', ID, payload
 * client -> server: 'end', ID
 * ...
 */

// Close codes: https://www.rfc-editor.org/rfc/rfc6455#section-7.4
describe('GraphQL subscriptions', () => {
  let fixture: GraphQLSubscriptionsFixture;

  beforeEach(async () => {
    fetchMock.enableMocks();
    fixture = new GraphQLSubscriptionsFixture();
  });

  afterEach(async () => {
    await fixture.cleanup();
    fetchMock.mockClear();
  });

  it('sends connection init to start', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.waitForConnection();
    const initMessage = await fixture.getNextMessage();
    expect(initMessage).toEqual({
      type: 'connection_init',
      payload: null,
    });

    subscription.unsubscribe();
  });

  it('sends a subscribe message to the socket when someone subscribes', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    const nextMessage = await fixture.getNextMessage();
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(1);
    expect(nextMessage).toEqual({
      id: expect.anything(),
      type: 'start',
      payload: {
        query: 'subscription { baba }',
      },
    });

    subscription.unsubscribe();
  });

  it('sends an un-subscribe message when the subscription is unsubscribed from', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
    expect(await fixture.getNextMessage()).toEqual({
      type: 'stop',
      id: '1',
      payload: null,
    });
  });

  it('works with graphql-tag generated documents', async () => {
    const subscription = fixture.triggerSubscription(
      gql`
        subscription {
          baba
        }
      `,
    );
    await fixture.handleConnectionInit();
    expect(fixture.getGraphqlServiceActiveSubscriptionCount()).toBe(1);
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription {\n  baba\n}\n' },
    });

    subscription.unsubscribe();
  });

  it('cleans up internal state when unsubscribing', async () => {
    expect(fixture.getMessagesSubscribers().size).toBe(0);

    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();

    expect([...fixture.getMessagesSubscribers().keys()]).toEqual(['1']);

    subscription.unsubscribe();
    await fixture.consumeAnyMessage();

    expect(fixture.getMessagesSubscribers().size).toBe(0);
  });

  it('when receiving a published message for a subscription that does not exist anymore, it does not throw', async () => {
    expect(fixture.getMessagesSubscribers().size).toBe(0);

    const subscription = fixture.triggerSubscription();

    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
    await fixture.consumeAnyMessage();

    fixture.sendMessageToClient({
      id: '1',
      type: 'data',
      payload: {
        data: {
          baba: 9,
        },
      },
    });
  });

  it('when the server closes the connection, it will reconnect and subscribe again', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithCode(1001); // sets timeout to try again later
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    subscription.unsubscribe();
  });

  it('when the server does not reply to ping message, reconnects', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDrop',
    );
    jest.useFakeTimers();
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();

    await fixture.consumeSubscribeMessage();

    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    await jest.runOnlyPendingTimersAsync();

    expect(reconnectSpy).toHaveBeenCalled();
    await fixture.consumeInitMessage();
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('handles multiple consecutive connect/ping/timeout cycles gracefully', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDrop',
    );
    jest.useFakeTimers();
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    // connect
    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();

    await fixture.consumeSubscribeMessage();

    // ping
    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    // timeout
    await jest.runOnlyPendingTimersAsync();
    expect(reconnectSpy).toHaveBeenCalledTimes(1);

    // connect
    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();
    await fixture.consumeSubscribeMessage();

    // ping
    await jest.advanceTimersToNextTimerAsync();
    await fixture.consumePingMessage();

    // timeout
    await jest.runOnlyPendingTimersAsync();
    expect(reconnectSpy).toHaveBeenCalledTimes(2);

    // connect
    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();
    await fixture.consumeSubscribeMessage();

    expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('when the server replies to ping message, does not reconnect', async () => {
    const reconnectSpy = jest.spyOn(
      fixture.graphqlService as any,
      'handleConnectionDrop',
    );
    jest.useFakeTimers();
    const subscription = fixture.triggerSubscription();
    await jest.runAllTimersAsync();

    await fixture.handleConnectionInit();
    await jest.runOnlyPendingTimersAsync();

    await fixture.consumeSubscribeMessage();

    await jest.advanceTimersToNextTimerAsync();
    expect(await fixture.getNextMessage()).toEqual({
      type: 'ping',
    });

    fixture.sendMessageToClient({ type: 'pong' });
    await jest.runOnlyPendingTimersAsync();

    expect(reconnectSpy).not.toHaveBeenCalled();
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('when the server sends an error, it will reconnect and subscribe again', async () => {
    const subscription = fixture.triggerSubscription();
    useFakeSetInterval();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithError(1002);
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('reconnects when there are open subscriptions, and the server closes with code 1000', async () => {
    const subscription = fixture.triggerSubscription();
    useFakeSetInterval();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    await fixture.closeWithError(1000);
    fixture.openServer();
    await fixture.handleConnectionInit();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    jest.useRealTimers();
    subscription.unsubscribe();
  });

  it('does not reconnect when there are no open subscriptions, and the server closes with code 1000', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
    await fixture.consumeAnyMessage();
    await fixture.closeWithError(1000, 'Bye Bye');
    fixture.openServer();
    expect(fixture.server.messages).toHaveLength(0);
  });

  it('when the connection closes abnormally, it will reconnect and subscribe again', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    useFakeSetInterval();
    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.runAllTimers();
    await fixture.handleConnectionInit();
    jest.advanceTimersToNextTimer();
    jest.useRealTimers();
    expect(await fixture.getNextMessage()).toEqual({
      id: '1',
      type: 'start',
      payload: { query: 'subscription { baba }' },
    });
    subscription.unsubscribe();
  });

  it('when a reconnection fails, it will continue to retry', async () => {
    const subscription = fixture.triggerSubscription();
    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    useFakeSetInterval();
    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.runAllTimers();
    await fixture.waitForConnection();
    jest.advanceTimersToNextTimer();
    // NOTE: when we don't send a CONNECTION_ACK, then we will still be in the
    // CONNECTING state.
    expect(await fixture.getConnectionStatus()).toBe(
      ConnectionStatus.CONNECTING,
    );

    await fixture.closeWithError(1006);
    fixture.openServer();
    jest.advanceTimersToNextTimer();
    jest.useRealTimers();

    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage();
    subscription.unsubscribe();
  });

  it(`should retry errored subscriptions if socket reconnects`, async () => {
    const subscription1 = fixture.triggerSubscription(gql`
      subscription {
        name
      }
    `);

    const subscription2 = fixture.triggerSubscription(gql`
      subscription {
        name2
      }
    `);

    await fixture.handleConnectionInit();

    fixture.server.send({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: ['The maximum subscription limit of 100 has been reached'],
      },
    });

    fixture.server.send({
      id: '2',
      type: 'error',
      payload: {
        data: null,
        errors: ['The maximum subscription limit of 100 has been reached'],
      },
    });

    await fixture.closeWithCode(1001);

    fixture.openServer();
    await fixture.handleConnectionInit();

    expect(await fixture.getNextMessage()).toEqual(
      expect.objectContaining({
        id: '1',
        type: 'start',
      }),
    );

    expect(await fixture.getNextMessage()).toEqual(
      expect.objectContaining({
        id: '2',
        type: 'start',
      }),
    );

    subscription1.unsubscribe();
    subscription2.unsubscribe();
  });

  it(`should send GQL_STOP for errored subscription if it's unsubscribed`, async () => {
    const query = gql`
      subscription {
        name
      }
    `;

    const subscription = fixture.triggerSubscription(query);

    await fixture.handleConnectionInit();
    await fixture.consumeSubscribeMessage(query);

    fixture.server.send({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: ['The maximum subscription limit of 100 has been reached'],
      },
    });

    expect([...fixture.getMessagesSubscribers().keys()]).toEqual(['1']);

    subscription.unsubscribe();

    expect(await fixture.getNextMessage()).toEqual(
      expect.objectContaining({
        id: '1',
        type: 'stop',
      }),
    );
  });

  it(`should not send GQL_STOP for subscription if it has been cleaned up`, async () => {
    const subscription = fixture.triggerSubscription(gql`
      subscription {
        name
      }
    `);

    await fixture.handleConnectionInit();

    fixture.server.send({
      id: '1',
      type: 'complete',
    });

    expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);

    subscription.unsubscribe();
  });

  it(`should clean up errored subscription if it's unsubscribed`, async () => {
    const subscription = fixture.triggerSubscription(gql`
      subscription {
        name
      }
    `);

    await fixture.handleConnectionInit();

    fixture.server.send({
      id: '1',
      type: 'error',
      payload: {
        data: null,
        errors: ['The maximum subscription limit of 100 has been reached'],
      },
    });

    expect([...fixture.getMessagesSubscribers().keys()]).toEqual(['1']);

    subscription.unsubscribe();

    expect(fixture.getMessagesSubscribers().size).toBe(0);
  });

  describe('GQL_DATA', () => {
    it('should send data to subscriber', async () => {
      const subscriptionNextSpy = jest.fn();

      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { next: subscriptionNextSpy },
      );

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'data',
        payload: { data: { id: '1' } },
      });

      expect(subscriptionNextSpy).toHaveBeenCalledWith({ id: '1' });

      subscription.unsubscribe();
    });
  });

  describe('GQL_COMPLETE', () => {
    it(`should complete subscription`, async () => {
      const subscriptionCompleteSpy = jest.fn();

      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { complete: subscriptionCompleteSpy },
      );

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'complete',
      });

      expect(subscriptionCompleteSpy).toHaveBeenCalled();

      subscription.unsubscribe();
    });

    it(`should clean up subscription`, async () => {
      const subscription = fixture.triggerSubscription(gql`
        subscription {
          name
        }
      `);

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'complete',
      });

      expect(fixture.getMessagesSubscribers().size).toBe(0);

      subscription.unsubscribe();
    });

    it(`shouldn't send GQL_STOP if subscription completes`, async () => {
      const subscription = fixture.triggerSubscription(gql`
        subscription {
          name
        }
      `);

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'complete',
      });

      expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);

      subscription.unsubscribe();
    });
  });

  describe('GQL_ERROR', () => {
    it(`shouldn't error subscriptions before retrying`, async () => {
      const subscriptionErrorSpy = jest.fn();

      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { error: subscriptionErrorSpy },
      );

      await fixture.handleConnectionInit();

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      expect(subscriptionErrorSpy).not.toHaveBeenCalled();

      subscription.unsubscribe();
    });

    it(`shouldn't clean up subscriptions before retrying`, async () => {
      const subscription = fixture.triggerSubscription(gql`
        subscription {
          name
        }
      `);

      await fixture.handleConnectionInit();

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      expect([...fixture.getMessagesSubscribers().keys()]).toEqual(['1']);

      subscription.unsubscribe();
    });

    it(`shouldn't drop socket connection`, async () => {
      const connectionDropSpy = jest.spyOn(
        fixture.graphqlService as any,
        'handleConnectionDrop',
      );

      const subscription = fixture.triggerSubscription(gql`
        subscription {
          name
        }
      `);

      await fixture.handleConnectionInit();

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      expect(connectionDropSpy).not.toHaveBeenCalled();

      subscription.unsubscribe();
    });

    it('should retry errored subscriptions after delay', async () => {
      jest.useFakeTimers();

      const query = gql`
        subscription {
          name
        }
      `;

      const subscription = fixture.triggerSubscription(query);

      const query2 = gql`
        subscription {
          name2
        }
      `;

      const subscription2 = fixture.triggerSubscription(query2);

      // Wait for temporary api key
      await jest.runAllTimersAsync();

      await fixture.handleConnectionInit();

      // Send subscriptions start messages
      await jest.runOnlyPendingTimersAsync();

      await fixture.consumeSubscribeMessage(query, { id: '1' });
      await fixture.consumeSubscribeMessage(query2, { id: '2' });

      // Send ping message
      await jest.advanceTimersToNextTimerAsync();

      await fixture.consumePingMessage();
      fixture.sendMessageToClient({ type: 'pong' });

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      fixture.server.send({
        id: '2',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      // Get latest haveAnySubscriptionsErrored state
      await jest.advanceTimersByTimeAsync(0);

      const haveAnySubscriptionsErroredAfterError = await firstValueFrom(
        fixture.graphqlService.haveAnySubscriptionsErrored(),
      );

      expect(haveAnySubscriptionsErroredAfterError).toBe(true);

      // Wait for retry
      await jest.advanceTimersByTimeAsync(7_000);

      expect(await fixture.getNextMessage()).toEqual(
        expect.objectContaining({
          id: '1',
          type: 'start',
        }),
      );

      expect(await fixture.getNextMessage()).toEqual(
        expect.objectContaining({
          id: '2',
          type: 'start',
        }),
      );

      subscription.unsubscribe();
      subscription2.unsubscribe();

      jest.useRealTimers();
    });

    it('should error subscription after 3 failed retries', async () => {
      jest.useFakeTimers();

      const subscriptionErrorSpy = jest.fn();

      const query = gql`
        subscription {
          name
        }
      `;

      const subscription = fixture.triggerSubscription(query, {
        error: subscriptionErrorSpy,
      });

      const query2 = gql`
        subscription {
          name2
        }
      `;

      const subscription2ErrorSpy = jest.fn();

      const subscription2 = fixture.triggerSubscription(query2, {
        error: subscription2ErrorSpy,
      });

      // Wait for temporary api key
      await jest.runAllTimersAsync();

      await fixture.handleConnectionInit();

      // Send subscriptions start messages
      await jest.runOnlyPendingTimersAsync();

      await fixture.consumeSubscribeMessage(query, { id: '1' });
      await fixture.consumeSubscribeMessage(query2, { id: '2' });

      // Send ping message
      await jest.advanceTimersToNextTimerAsync();

      await fixture.consumePingMessage();
      fixture.sendMessageToClient({ type: 'pong' });

      const sendErrorMessages = (): void => {
        [{ messageId: '1' }, { messageId: '2' }].forEach(({ messageId }) => {
          fixture.server.send({
            id: messageId,
            type: 'error',
            payload: {
              data: null,
              errors: [
                'The maximum subscription limit of 100 has been reached',
              ],
            },
          });
        });
      };

      sendErrorMessages();

      for (let retryCount = 1; retryCount <= 3; retryCount++) {
        // Wait for retry
        await jest.advanceTimersToNextTimerAsync();

        // mock-socket delivers client→server messages via setTimeout(4)
        await jest.advanceTimersByTimeAsync(10);

        expect(await fixture.getNextMessage()).toEqual(
          expect.objectContaining({ id: '1', type: 'start' }),
        );

        expect(await fixture.getNextMessage()).toEqual(
          expect.objectContaining({ id: '2', type: 'start' }),
        );

        sendErrorMessages();
      }

      expect(subscriptionErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Subscription failed after 3 retries',
        }),
      );

      expect(subscription2ErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Subscription failed after 3 retries',
        }),
      );

      subscription.unsubscribe();
      subscription2.unsubscribe();

      jest.useRealTimers();
    });

    it('should clean up errored subscription after 3 failed retries', async () => {
      jest.useFakeTimers();

      const query = gql`
        subscription {
          name
        }
      `;

      const subscription = fixture.triggerSubscription(query, {
        error: () => {},
      });

      const query2 = gql`
        subscription {
          name2
        }
      `;

      const subscription2 = fixture.triggerSubscription(query2, {
        error: () => {},
      });

      // Wait for temporary api key
      await jest.runAllTimersAsync();

      await fixture.handleConnectionInit();

      // Send subscriptions start messages
      await jest.runOnlyPendingTimersAsync();

      await fixture.consumeSubscribeMessage(query, { id: '1' });
      await fixture.consumeSubscribeMessage(query2, { id: '2' });

      // Send ping message
      await jest.advanceTimersToNextTimerAsync();

      await fixture.consumePingMessage();
      fixture.sendMessageToClient({ type: 'pong' });

      const sendErrorMessages = (): void => {
        [{ messageId: '1' }, { messageId: '2' }].forEach(({ messageId }) => {
          fixture.server.send({
            id: messageId,
            type: 'error',
            payload: {
              data: null,
              errors: [
                'The maximum subscription limit of 100 has been reached',
              ],
            },
          });
        });
      };

      sendErrorMessages();

      expect([...fixture.getMessagesSubscribers().keys()]).toEqual(['1', '2']);

      for (let retryCount = 1; retryCount <= 3; retryCount++) {
        // Wait for retry
        await jest.advanceTimersToNextTimerAsync();

        // mock-socket delivers client → server messages via setTimeout(4)
        await jest.advanceTimersByTimeAsync(10);

        expect(await fixture.getNextMessage()).toEqual(
          expect.objectContaining({ id: '1', type: 'start' }),
        );

        expect(await fixture.getNextMessage()).toEqual(
          expect.objectContaining({ id: '2', type: 'start' }),
        );

        sendErrorMessages();
      }

      expect(fixture.getMessagesSubscribers().size).toBe(0);

      subscription.unsubscribe();
      subscription2.unsubscribe();

      jest.useRealTimers();
    });

    it(`should error subscription if server sends unknown message (has data)`, async () => {
      const subscriptionErrorSpy = jest.fn();

      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { error: subscriptionErrorSpy },
      );

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'unknown',
        payload: { data: { unknown: 'unknown' } },
      });

      expect(subscriptionErrorSpy).toHaveBeenCalledWith({ unknown: 'unknown' });

      subscription.unsubscribe();
    });

    it(`should clean up subscription if server sends unknown message (has data)`, async () => {
      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { error: () => {} },
      );

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'unknown',
        payload: { data: { unknown: 'unknown' } },
      });

      expect(fixture.getMessagesSubscribers().size).toBe(0);

      subscription.unsubscribe();
    });

    it(`should error subscription if server sends unknown message (has errors)`, async () => {
      const subscriptionErrorSpy = jest.fn();

      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { error: subscriptionErrorSpy },
      );

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'unknown',
        payload: {
          errors: [{ message: 'Something went wrong' }],
        },
      });

      expect(subscriptionErrorSpy).toHaveBeenCalledWith([
        { message: 'Something went wrong' },
      ]);

      subscription.unsubscribe();
    });

    it(`should clean up subscription if server sends unknown message (has errors)`, async () => {
      const subscription = fixture.triggerSubscription(
        gql`
          subscription {
            name
          }
        `,
        { error: () => {} },
      );

      await fixture.handleConnectionInit();

      fixture.sendMessageToClient({
        id: '1',
        type: 'unknown',
        payload: {
          errors: [{ message: 'Something went wrong' }],
        },
      });

      expect(fixture.getMessagesSubscribers().size).toBe(0);

      subscription.unsubscribe();
    });
  });

  describe('haveAnySubscriptionsErrored', () => {
    it(`should emit 'true' if any subscriptions error`, async () => {
      const subscription = fixture.triggerSubscription(gql`
        subscription {
          name
        }
      `);

      await fixture.handleConnectionInit();

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      const haveAnySubscriptionsErrored = await firstValueFrom(
        fixture.graphqlService.haveAnySubscriptionsErrored(),
      );

      expect(haveAnySubscriptionsErrored).toBe(true);

      subscription.unsubscribe();
    });

    it('should clear errored subscriptions with a delay after successful batch retry', async () => {
      jest.useFakeTimers();

      const query = gql`
        subscription {
          name
        }
      `;

      const subscription = fixture.triggerSubscription(query);

      // Wait for temporary api key
      await jest.runAllTimersAsync();

      await fixture.handleConnectionInit();

      // Send subscriptions start messages
      await jest.runOnlyPendingTimersAsync();

      await fixture.consumeSubscribeMessage(query);

      // Send ping message
      await jest.advanceTimersToNextTimerAsync();

      await fixture.consumePingMessage();
      fixture.sendMessageToClient({ type: 'pong' });

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      // Get latest haveAnySubscriptionsErrored state
      await jest.advanceTimersByTimeAsync(0);

      const haveAnySubscriptionsErroredBeforeRetry = await firstValueFrom(
        fixture.graphqlService.haveAnySubscriptionsErrored(),
      );

      expect(haveAnySubscriptionsErroredBeforeRetry).toBe(true);

      // Wait for retry
      await jest.advanceTimersByTimeAsync(7_000);

      const haveAnySubscriptionsErroredAfterRetry = await firstValueFrom(
        fixture.graphqlService.haveAnySubscriptionsErrored(),
      );

      expect(haveAnySubscriptionsErroredAfterRetry).toBe(false);

      subscription.unsubscribe();

      jest.useRealTimers();
    });

    it(`should emit 'true' if there are errored subscriptions but socket reconnects`, async () => {
      const subscription = fixture.triggerSubscription(gql`
        subscription {
          name
        }
      `);

      await fixture.handleConnectionInit();

      fixture.server.send({
        id: '1',
        type: 'error',
        payload: {
          data: null,
          errors: ['The maximum subscription limit of 100 has been reached'],
        },
      });

      const haveAnySubscriptionsErroredBeforeReconnect = await firstValueFrom(
        fixture.graphqlService.haveAnySubscriptionsErrored(),
      );

      expect(haveAnySubscriptionsErroredBeforeReconnect).toBe(true);

      await fixture.closeWithCode(1001);

      fixture.openServer();
      await fixture.handleConnectionInit();

      const haveAnySubscriptionsErroredAfterReconnect = await firstValueFrom(
        fixture.graphqlService.haveAnySubscriptionsErrored(),
      );

      expect(haveAnySubscriptionsErroredAfterReconnect).toBe(false);

      subscription.unsubscribe();
    });
  });

  describe('WebSocket readyState guards', () => {
    it('triggers reconnection when socket is not in OPEN state during sendMessage', async () => {
      const service = fixture.graphqlService as any;
      const handleDropSpy = jest.spyOn(service, 'handleConnectionDrop');

      const sub = fixture.triggerSubscription();
      await fixture.handleConnectionInit();
      await fixture.consumeSubscribeMessage();

      // mock-socket doesn't support simulating a half-closed socket,
      // so we override readyState directly to test the guard
      Object.defineProperty(service.socket, 'readyState', {
        value: 0,
        writable: true,
      });
      service.connectionStatus = ConnectionStatus.CONNECTED;

      service.sendMessage('99', 'start', { query: 'subscription { test }' });

      expect(handleDropSpy).toHaveBeenCalled();
      expect(fixture.server.messagesToConsume.pendingItems).toHaveLength(0);

      sub.unsubscribe();
    });

    it('sendPing skips sending when socket is not OPEN but still sets pong timeout', () => {
      const service = fixture.graphqlService as any;
      service.socket = { readyState: 0, send: jest.fn() };
      service.pongTimeout = null;

      service.sendPing();

      expect(service.pongTimeout).not.toBeNull();
      expect(service.socket.send).not.toHaveBeenCalled();

      clearTimeout(service.pongTimeout);
    });

    it('triggers reconnection when re-subscription fails during connection_ack', async () => {
      const service = fixture.graphqlService as any;
      const handleDropSpy = jest.spyOn(service, 'handleConnectionDrop');
      const loggerWarnSpy = jest.spyOn(service.logger, 'warn');

      const sub1 = fixture.triggerSubscription('subscription { first }');
      await fixture.handleConnectionInit();
      await fixture.consumeSubscribeMessage('subscription { first }');

      await fixture.closeWithCode(1001);
      fixture.openServer();
      await fixture.waitForConnection();
      await fixture.consumeInitMessage();

      // mock-socket doesn't support simulating a half-closed socket,
      // so we override readyState directly to test the guard
      Object.defineProperty(service.socket, 'readyState', {
        value: 0,
        writable: true,
      });
      fixture.sendMessageToClient({ type: 'connection_ack' });

      // Allow mock-socket message delivery to settle
      await new Promise((r) => setTimeout(r, 10));

      const resubWarnings = loggerWarnSpy.mock.calls.filter((call) =>
        String(call[0]).includes('Failed to re-subscribe'),
      );
      expect(resubWarnings).toHaveLength(1);
      expect(handleDropSpy).toHaveBeenCalled();

      sub1.unsubscribe();
    });
  });

  function useFakeSetInterval() {
    jest.useFakeTimers({
      doNotFake: [
        'Date',
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setTimeout',
        'clearTimeout',
      ],
    });
  }
});
