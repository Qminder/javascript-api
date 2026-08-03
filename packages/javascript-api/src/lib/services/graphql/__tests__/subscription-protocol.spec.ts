import { LegacySubscriptionProtocol } from '../subscription-protocol';

describe('LegacySubscriptionProtocol', () => {
  const protocol = new LegacySubscriptionProtocol();

  describe('outgoing frames', () => {
    it('serializes connection_init', () => {
      expect(JSON.parse(protocol.serializeConnectionInit())).toEqual({
        type: 'connection_init',
        payload: null,
      });
    });

    it('serializes subscribe as start', () => {
      expect(
        JSON.parse(protocol.serializeSubscribe('7', 'subscription { baba }')),
      ).toEqual({
        id: '7',
        type: 'start',
        payload: { query: 'subscription { baba }' },
      });
    });

    it('serializes unsubscribe as stop', () => {
      expect(JSON.parse(protocol.serializeUnsubscribe('7'))).toEqual({
        id: '7',
        type: 'stop',
        payload: null,
      });
    });

    it('serializes ping without id and payload', () => {
      expect(JSON.parse(protocol.serializePing())).toEqual({ type: 'ping' });
    });

    it('serializes pong without id and payload', () => {
      expect(JSON.parse(protocol.serializePong())).toEqual({ type: 'pong' });
    });
  });

  describe('incoming frames', () => {
    it('parses ka as keep-alive', () => {
      expect(protocol.parseIncomingMessage('{"type":"ka"}')).toEqual({
        type: 'keep-alive',
      });
    });

    it('parses connection_ack', () => {
      expect(
        protocol.parseIncomingMessage('{"type":"connection_ack"}'),
      ).toEqual({ type: 'connection-ack' });
    });

    it('parses a server-sent ping', () => {
      expect(protocol.parseIncomingMessage('{"type":"ping"}')).toEqual({
        type: 'ping',
      });
    });

    it('parses pong', () => {
      expect(protocol.parseIncomingMessage('{"type":"pong"}')).toEqual({
        type: 'pong',
      });
    });

    it('parses data', () => {
      expect(
        protocol.parseIncomingMessage(
          '{"id":"1","type":"data","payload":{"data":{"baba":9}}}',
        ),
      ).toEqual({ type: 'data', id: '1', data: { baba: 9 } });
    });

    it('parses data without payload', () => {
      expect(protocol.parseIncomingMessage('{"id":"1","type":"data"}')).toEqual(
        { type: 'data', id: '1', data: undefined },
      );
    });

    it('parses complete', () => {
      expect(
        protocol.parseIncomingMessage('{"id":"1","type":"complete"}'),
      ).toEqual({ type: 'complete', id: '1' });
    });

    it('parses error with errors payload', () => {
      expect(
        protocol.parseIncomingMessage(
          '{"id":"1","type":"error","payload":{"errors":[{"message":"boom"}]}}',
        ),
      ).toEqual({
        type: 'subscription-error',
        id: '1',
        errors: [{ message: 'boom' }],
      });
    });

    it('parses error without errors payload as empty error list', () => {
      expect(
        protocol.parseIncomingMessage('{"id":"1","type":"error"}'),
      ).toEqual({ type: 'subscription-error', id: '1', errors: [] });
    });

    it('parses an unknown message type as unrecognized, keeping payload', () => {
      expect(
        protocol.parseIncomingMessage(
          '{"id":"1","type":"surprise","payload":{"data":{"a":1},"errors":[{"message":"boom"}]}}',
        ),
      ).toEqual({
        type: 'unrecognized',
        id: '1',
        data: { a: 1 },
        errors: [{ message: 'boom' }],
      });
    });
  });
});
