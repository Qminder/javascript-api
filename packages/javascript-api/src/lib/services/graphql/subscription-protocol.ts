import { GraphQLErrorExtensions, SourceLocation } from 'graphql';

export interface QminderGraphQLError {
  readonly message: string;
  readonly errorType?: string | null;
  readonly extensions?: GraphQLErrorExtensions | null;
  readonly sourcePreview?: string | null;
  readonly offendingToken?: string | null;
  readonly locations?: SourceLocation[] | null;
  readonly path?: (string | number)[] | null;
}

/**
 * A message received from the subscription server, normalized so that
 * GraphqlService does not depend on the wire format of a concrete protocol.
 */
export type IncomingSubscriptionMessage =
  | { readonly type: 'connection-ack' }
  | { readonly type: 'keep-alive' }
  | { readonly type: 'ping' }
  | { readonly type: 'pong' }
  | {
      readonly type: 'data';
      readonly id?: string;
      readonly data?: Record<string, any> | null;
    }
  | { readonly type: 'complete'; readonly id?: string }
  | {
      readonly type: 'subscription-error';
      readonly id?: string;
      readonly errors: QminderGraphQLError[];
    }
  | {
      readonly type: 'unrecognized';
      readonly id?: string;
      readonly data?: Record<string, any> | null;
      readonly errors?: QminderGraphQLError[];
    };

/**
 * The wire protocol spoken over the subscription WebSocket: serializes
 * outgoing frames and normalizes incoming ones.
 */
export interface SubscriptionProtocol {
  serializeConnectionInit(): string;
  serializeSubscribe(id: string, query: string): string;
  serializeUnsubscribe(id: string): string;
  serializePing(): string;
  /**
   * A `pong` answering a `ping` from the server. The `graphql-transport-ws`
   * protocol requires the receiving party to answer a ping as soon as possible.
   */
  serializePong(): string;
  parseIncomingMessage(data: string): IncomingSubscriptionMessage;
}

enum LegacyMessageType {
  // To Server
  GQL_CONNECTION_INIT = 'connection_init',
  GQL_START = 'start',
  GQL_STOP = 'stop',
  GQL_PING = 'ping',

  // From Server
  GQL_CONNECTION_ACK = 'connection_ack',
  GQL_DATA = 'data',
  GQL_CONNECTION_KEEP_ALIVE = 'ka',
  GQL_COMPLETE = 'complete',
  GQL_PONG = 'pong',
  GQL_ERROR = 'error',
}

interface LegacyMessage {
  readonly id?: string;
  readonly type: LegacyMessageType;
  readonly payload?: {
    readonly data?: Record<string, any> | null;
    readonly errors?: QminderGraphQLError[];
  };
}

/**
 * The protocol of the original Qminder subscription endpoint, a dialect of the
 * deprecated `subscriptions-transport-ws` protocol (with graphql-ws style
 * ping/pong on top).
 */
export class LegacySubscriptionProtocol implements SubscriptionProtocol {
  serializeConnectionInit(): string {
    return JSON.stringify({
      type: LegacyMessageType.GQL_CONNECTION_INIT,
      payload: null,
    });
  }

  serializeSubscribe(id: string, query: string): string {
    return JSON.stringify({
      id,
      type: LegacyMessageType.GQL_START,
      payload: { query },
    });
  }

  serializeUnsubscribe(id: string): string {
    return JSON.stringify({
      id,
      type: LegacyMessageType.GQL_STOP,
      payload: null,
    });
  }

  serializePing(): string {
    return JSON.stringify({ type: LegacyMessageType.GQL_PING });
  }

  serializePong(): string {
    return JSON.stringify({ type: LegacyMessageType.GQL_PONG });
  }

  parseIncomingMessage(data: string): IncomingSubscriptionMessage {
    const message: LegacyMessage = JSON.parse(data);

    switch (message.type) {
      case LegacyMessageType.GQL_CONNECTION_KEEP_ALIVE:
        return { type: 'keep-alive' };

      case LegacyMessageType.GQL_CONNECTION_ACK:
        return { type: 'connection-ack' };

      case LegacyMessageType.GQL_PING:
        return { type: 'ping' };

      case LegacyMessageType.GQL_PONG:
        return { type: 'pong' };

      case LegacyMessageType.GQL_DATA:
        return { type: 'data', id: message.id, data: message.payload?.data };

      case LegacyMessageType.GQL_COMPLETE:
        return { type: 'complete', id: message.id };

      case LegacyMessageType.GQL_ERROR:
        return {
          type: 'subscription-error',
          id: message.id,
          errors: message.payload?.errors ?? [],
        };

      default:
        return {
          type: 'unrecognized',
          id: message.id,
          data: message.payload?.data,
          errors: message.payload?.errors,
        };
    }
  }
}
