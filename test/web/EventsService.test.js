describe("Qminder.events", function () {
  // Empty function to pass as callback and check for equality
  const func = () => {
  };

  // An example ticket creation message. Only the 'data' is passed to the callback.
  const TICKET_CREATED_MESSAGE = {
    "subscriptionId": "IdentifierStubbedForTesting",
    "messageId": 1,
    "data": {
      "id": "12345678",
      "status": "NEW",
      "source": "MANUAL",
      "line": 12345,
      "firstName": "Johnny",
      "lastName": "Smithy",
      "phoneNumber": 123456789,
      "created": {
        "date": "2017-10-26T10:30:47.078Z",
        "creator": 10501
      },
      "extra": [
        { "title": "Pay", "value": "Taxes", "color": "#e99695" }
      ]
    }
  };

  // An example line changed message. Only the 'data' is passed to the callback.
  const LINES_CHANGED_MESSAGE = {
    "subscriptionId": "IdentifierStubbedForTesting",
    "messageId": 1,
    "data": [
      {"id": 5, "name": "Main Service" },
      {"id": 6, "name": "Priority Service" }
    ],
  };

  beforeEach(function (done) {
    if (typeof Qminder === 'undefined') {
      Qminder = this.Qminder;
    }
    if (typeof sinon === 'undefined') {
      sinon = this.sinon;
    }
    if (typeof WebSocket === 'undefined') {
      WebSocket = require('ws');
    }
    // Extend the timeouts because weird timing
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

    Qminder.events.reset();
    Qminder.events.setKey('F7arvJSi0ycoT2mDRq63blBofBU3LxrnVVqCLxhn');
    Qminder.events.setServer('ws://localhost:8123');

    // Open client socket - NOTE normally this is done automatically. For testing purposes, this
    // is done before the tests happen.
    Qminder.events.openSocket();

    // Interface the Mock Websocket Server to add stubbing behavior.
    // The stub's return value is sent to the control socket, and data received from the control
    // socket is passed as the first argument into the stub.

    // This means you can do this:
    // this.controlSocketStub.onCall(0).returns({ subscriptionId: 1234, message: "Wow" });
    // and when the Qminder API sends a websocket message, the object is sent back to it over the
    // socket.

    // Create a socket to the control interface of the mock WS server's control pipe
    this.controlSocket = new WebSocket('ws://localhost:8124');
    this.controlSocketStub = sinon.stub();
    this.controlSocket.onmessage = (event) => {
      if (event.data.indexOf('PING') !== -1) {
        this.controlSocket.send('PONG');
        return;
      }

      try {
        const data = JSON.parse(event.data);
        let controlMessage = this.controlSocketStub(data);

        if (typeof controlMessage !== 'string') {
          controlMessage = JSON.stringify(controlMessage);
        }

        console.log(controlMessage);

        if (controlMessage) {
          this.controlSocket.send(controlMessage);
        }
      } catch (e) {
        console.error(e.stack);
      }
    };

    // Handle pings/pongs automatically
    this.controlSocketStub.withArgs('PING').returns('PONG');

    // If both Qminder.events and the controlSocket are open, then continue
    const controlSocketOpen = new Promise(resolve => {
      this.controlSocket.onopen = resolve;
    });
    const clientSocketOpen = new Promise(resolve => {
      if (Qminder.events.socket.readyState === 1) {
        resolve();
      } else {
        Qminder.events.socket.addEventListener('open', resolve);
      }
    });
    Promise.all([controlSocketOpen, clientSocketOpen]).then(done);
  });
  afterEach(function (done) {
    // Reset behavior and history of the socket stub
    this.controlSocketStub.reset();
    this.controlSocketStub.resetBehavior();

    // Close the control socket
    this.controlSocket.close();

    // Close the Qminder events websocket
    Qminder.events.closeSocket();

    // Wait for both client & control socket to close before done
    const clientSocketClosed = new Promise((resolve) => {
      if (Qminder.events.socket.readyState === 3) {
        resolve();
      } else {
        Qminder.events.socket.addEventListener('close', resolve);
      }
    });
    const controlSocketClosed = new Promise((resolve) => {
      this.controlSocket.addEventListener('close', resolve);
    });

    Promise.all([clientSocketClosed, controlSocketClosed]).then(done);
  });


  it('does not duplicate subscribe on createSubscription and onopen', function() {
    Qminder.events.onTicketCreated(func, { location: 1234 });
    expect(Qminder.events.subscriptions.length).toBe(1);
    Qminder.events.socket.onopen();
    expect(Qminder.events.subscriptions.length).toBe(1);
  });

  describe('openSocket()', function () {
    it('Connects to websocket', function () {
      expect(() => Qminder.events.openSocket()).not.toThrow();
    });
    it('Does not allow calling the API when not initialized', function () {
      Qminder.events.apiKey = null;
      Qminder.events.initialized = false;
      expect(() => Qminder.events.openSocket()).toThrow();
    });
    xit('Does not allow double-connecting to the API', function () {
      Qminder.events.openSocket();
    });
  });
  describe('createSubscription()', function () {
    it('Constructs a subscription according to arguments without filters & params', function () {
      Qminder.events.createSubscription('TICKET_CREATED', func);

      expect(Qminder.events.subscriptions.length).toBe(1);
      const sub = Qminder.events.subscriptions[0];

      expect(sub.subscribe).toBe('TICKET_CREATED');
      expect(sub.line).toBeUndefined();
      expect(sub.location).toBeUndefined();
      expect(sub.parameters).toBeUndefined();
    });
    it('Constructs a subscription with location filter', function () {
      Qminder.events.createSubscription('TICKET_CREATED', func, { location: 123 });

      expect(Qminder.events.subscriptions.length).toBe(1);
      const sub = Qminder.events.subscriptions[0];

      expect(sub.subscribe).toBe('TICKET_CREATED');
      expect(sub.line).toBeUndefined();
      expect(sub.location).toBe(123);
      expect(sub.parameters).toBeUndefined();
    });
    it('Constructs a subscription with line filter', function () {
      Qminder.events.createSubscription('TICKET_CREATED', func, { line: 123 });

      expect(Qminder.events.subscriptions.length).toBe(1);
      const sub = Qminder.events.subscriptions[0];

      expect(sub.subscribe).toBe('TICKET_CREATED');
      expect(sub.line).toBe(123);
      expect(sub.location).toBeUndefined();
      expect(sub.parameters).toBeUndefined();
    });
    it('Constructs a subscription with parameters', function () {
      const params = { id: 5 };
      Qminder.events.createSubscription('TICKET_CREATED', func, undefined, params);

      expect(Qminder.events.subscriptions.length).toBe(1);
      const sub = Qminder.events.subscriptions[0];

      expect(sub.subscribe).toBe('TICKET_CREATED');
      expect(sub.line).toBeUndefined();
      expect(sub.location).toBeUndefined();
      expect(sub.parameters).toBe(params);
    });
    it('Constructs a subscription with filter and parameters', function () {

      const params = { id: 141 };
      Qminder.events.createSubscription('TICKET_CREATED', func, { line: 123 }, params);

      expect(Qminder.events.subscriptions.length).toBe(1);
      const sub = Qminder.events.subscriptions[0];

      expect(sub.subscribe).toBe('TICKET_CREATED');
      expect(sub.line).toBe(123);
      expect(sub.location).toBeUndefined();
      expect(sub.parameters).toBe(params);
    });
    it('Sends the subscription and callback to this.subscribe', function () {
      const stub = sinon.stub(Qminder.events, 'subscribe');
      const createIdStub = sinon.stub(Qminder.events, 'createId');
      createIdStub.returns('Test!');
      Qminder.events.createSubscription('TICKET_CREATED', func, { line: 123 });
      expect(Qminder.events.subscriptions.length).toBe(0);

      const matcher = sinon.match({
        id: 'Test!',
        subscribe: 'TICKET_CREATED',
        line: 123
      });

      expect(stub.calledWith(matcher, func)).toBeTruthy();
      stub.restore();
      createIdStub.restore();
    });
    it('Adds the subscription to the subscriptions list', function () {
      Qminder.events.createSubscription('TICKET_CREATED', func, { line: 123 });
      expect(Qminder.events.subscriptions.length).toBe(1);
    });
    it('Automatically generates a subscription ID', function () {
      Qminder.events.createSubscription('TICKET_CREATED', func, { line: 123 });
      expect(Qminder.events.subscriptions.length).toBe(1);
      const sub = Qminder.events.subscriptions[0];
      expect(typeof sub.id).toBe('string');
      expect(sub.id.length).toBe(30);
    });
  });

  describe('subscribe() - connected to API', function () {
    it('pushes a subscription into the subscriptions array', function() {
      const sub = { subscribe: 'TICKET_CREATED', location: 1234, id: 'TEST' };
      Qminder.events.subscribe(sub, func);
      expect(Qminder.events.subscriptions.length).toBe(1);
    });

    it('does not push the same subscription twice into the subscriptions array', function() {
      const sub = { subscribe: 'TICKET_CREATED', location: 1234, id: 'TEST' };
      const sub2 = Object.assign({}, sub);
      Qminder.events.subscribe(sub, func);
      Qminder.events.subscribe(sub2, func);
      expect(Qminder.events.subscriptions.length).toBe(1);
    });

    it('puts the given callback to a subscription callback map by ID', function () {
      Qminder.events.subscribe({ subscribe: 'TICKET_CREATED', location: 1234, id: 'AFAFAF' }, func);
      let map = Qminder.events.subscriptionCallbackMap;
      expect(Object.keys(map).length).toBe(1);
      expect(Object.keys(map)[0]).toBe('AFAFAF');
      expect(map['AFAFAF']).toBe(func);
    });
    it('if the callback isn\'t a function, won\'t assign it the callback map', function () {
      Qminder.events.subscribe({ subscribe: 'TICKET_CREATED', location: 1234, id: 'AFAFAF' }, 'Yo');
      let map = Qminder.events.subscriptionCallbackMap;
      expect(Object.keys(map).length).toBe(0);
    });
    it('sends the JSON stringified subscription object to the websocket', function (done) {
      // Fire a blank event with the subscription ID, to know when the subscription is done
      this.controlSocketStub.onCall(0).returns({ subscriptionId: 'WOWHELLO' });
      const subscription = { id: "WOWHELLO", subscribe: "TICKET_CREATED", line: 12345 };
      const matcher = sinon.match(subscription);

      Qminder.events.subscribe(subscription, () => {
        expect(this.controlSocketStub.calledWith(matcher)).toBeTruthy();
        done();
      });
    });
  });

  describe('onXYZ()', function () {
    const filter = { line: 12345 };
    beforeEach(function () {
      this.createSubscriptionStub = sinon.stub(Qminder.events, 'createSubscription');
    });
    afterEach(function () {
      Qminder.events.createSubscription.restore();
    });

    it('onTicketCreated does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onTicketCreated(func, filter)).not.toThrow();
      expect(this.createSubscriptionStub.calledWith('TICKET_CREATED', func, filter)).toBeTruthy();
    });

    it('onTicketCalled does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onTicketCalled(func, filter)).not.toThrow();
      expect(this.createSubscriptionStub.calledWith('TICKET_CALLED', func, filter)).toBeTruthy();
    });

    it('onTicketRecalled does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onTicketRecalled(func, filter)).not.toThrow();
      expect(this.createSubscriptionStub.calledWith('TICKET_RECALLED', func, filter)).toBeTruthy();
    });

    it('onTicketCancelled does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onTicketCancelled(func, filter)).not.toThrow();
      expect(this.createSubscriptionStub.calledWith('TICKET_CANCELLED', func, filter)).toBeTruthy();
    });

    it('onTicketServed does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onTicketServed(func, filter)).not.toThrow();
      expect(this.createSubscriptionStub.calledWith('TICKET_SERVED', func, filter)).toBeTruthy();
    });

    it('onOverviewMonitorChanged does not error and calls createSubscription correctly',
      function () {
        expect(() => Qminder.events.onOverviewMonitorChanged(func, 14141)).not.toThrow();
        const obj = sinon.match({ id: 14141 });
        expect(
          this.createSubscriptionStub.calledWith('OVERVIEW_MONITOR_CHANGE', func, undefined, obj))
          .toBeTruthy();
      });

    it('onSignInDeviceChanged does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onSignInDeviceChanged(func, 14141)).not.toThrow();
      const obj = sinon.match({ id: 14141 });
      expect(this.createSubscriptionStub.calledWith('SIGN_IN_CHANGE', func, undefined, obj))
        .toBeTruthy();
    });

    it('onLinesChanged does not error and calls createSubscription correctly', function () {
      expect(() => Qminder.events.onLinesChanged(func, 123)).not.toThrow();
      const obj = sinon.match({ id: 123 });
      expect(this.createSubscriptionStub.calledWith('LINES_CHANGED', func, undefined, obj))
        .toBeTruthy();
    });

    it('passes the filter along', function () {
      Qminder.events.onTicketCreated(func, filter);
      expect(this.createSubscriptionStub.calledWith('TICKET_CREATED', func, filter)).toBeTruthy();
    });
  });

  xdescribe('Automatic reconnect', function () {
    it('Tries to open the socket again after a disconnect', function (done) {
      this.controlSocketStub.onCall(0).returns('DROP!');
      this.controlSocketStub.onCall(1).returns({ subscriptionId: 'AAA' });
      var openSocketSpy = sinon.spy(Qminder.events, 'openSocket');
      Qminder.events.subscribe({ id: 'AAA', subscribe: 'TICKET_CREATED' }, function (ticket) {
        expect(openSocketSpy.callCount).toBe(2);
        openSocketSpy.restore();
        done();
      });

      // TODO: wait 5+ seconds for the API to try to reconnect.
    });
  });
  xdescribe('Resubscribe on connect', function () {
  });
  xdescribe('Resubscribe from queue', function () {
  });

  describe('Receiving events', function () {
    beforeEach(function () {
      // Instrument the createId stub so we can assume deterministic ID generation
      this.createIdStub = sinon.stub(Qminder.events, 'createId');
      this.createIdStub.returns('IdentifierStubbedForTesting');
    });
    afterEach(function () {
      // Restore behavior of the createId stub
      this.createIdStub.restore();
    });

    it('Subscribing to TICKET_CREATED will call the callback on a Ticket Created event',
      function (done) {
        this.controlSocketStub.onCall(0).returns(TICKET_CREATED_MESSAGE);

        function onTicketCreated(ticket) {
          // Not the entire WS message, but only the .data key should be passed to callback
          expect(ticket.subscriptionId).toBeUndefined();
          expect(ticket.data).toBeUndefined();

          // In this case, it's the ticket.
          expect(ticket.firstName).toBeDefined();
          done();
        }

        Qminder.events.onTicketCreated(onTicketCreated, { line: 12345 });
      });

    it('Subscribing to LINES_CHANGED will call the callback on a Lines Changed event',
      function(done) {
        this.controlSocketStub.onCall(0).returns(LINES_CHANGED_MESSAGE);
        function onLinesChanged(lines) {
          expect(lines instanceof Array).toBeTruthy();
          expect(lines.length).toBe(LINES_CHANGED_MESSAGE.data.length);
          expect(lines[0].id).toBe(LINES_CHANGED_MESSAGE.data[0].id);
          expect(lines[0].name).toBe(LINES_CHANGED_MESSAGE.data[0].name);
          done();
        }
        Qminder.events.onLinesChanged(onLinesChanged, 12345);
    });

    it('Subscribing to two events will call the corresponding callbacks', function(done) {
      this.createIdStub.resetBehavior();

      // Ticket Created will have the subscription ID of "Alfa"
      this.createIdStub.onCall(0).returns('Alfa');

      // Lines Changed will have the subscription ID of "Beeta"
      this.createIdStub.onCall(1).returns('Beeta');

      function ticketCreated(ticket) {
        console.error('ticketCreated', ticket);
        expect(ticket.firstName).toBe(TICKET_CREATED_MESSAGE.data.firstName);
        expect(ticket.lastName).toBe(TICKET_CREATED_MESSAGE.data.lastName);
        done();
      }

      function linesChanged(lines) {
        console.error('linesChanged', lines);
        expect(lines instanceof Array).toBeTruthy();
        expect(lines.length).toBe(LINES_CHANGED_MESSAGE.data.length);
        expect(lines[0].id).toBe(LINES_CHANGED_MESSAGE.data[0].id);
        expect(lines[0].name).toBe(LINES_CHANGED_MESSAGE.data[0].name);
      }


      Qminder.events.onTicketCreated(ticketCreated, { location: 1234 });
      Qminder.events.onLinesChanged(linesChanged, 1234);

      // Create a ticket created message with the subscription ID of Alfa
      const ticketMessage = Object.assign({}, TICKET_CREATED_MESSAGE, { subscriptionId: 'Alfa' });
      // Create a lines changed message with the subscription ID of Beeta
      const lineMessage = Object.assign({}, LINES_CHANGED_MESSAGE, { subscriptionId: 'Beeta' });
      // Send the messages down the wire
      this.controlSocket.send(JSON.stringify(lineMessage));
      this.controlSocket.send(JSON.stringify(ticketMessage));
    });
  });


  describe('Connect/Disconnect events', function () {
    // TODO: this test needs to disconnect and wait for it to reopen to receive the callback.
    xit('fires the onConnect callback on socket open', function (done) {
      Qminder.events.onConnect(() => done());
      Qminder.events.subscribe({ id: "WOWHELLO", subscribe: "TICKET_CREATED", line: 12345 });
    });
    it('fires the onDisconnect callback on socket close', function (done) {
      this.controlSocketStub.returns('DROP!');
      Qminder.events.onDisconnect(() => done());
      Qminder.events.subscribe({ id: "WOWHELLO", subscribe: "TICKET_CREATED", line: 12345 });
    });
  });

  // TODO: these tests need to close the connection and wait for it to open, which is NYI.
  xdescribe('subscribe() - no connection yet', function () {
    it('puts the message and callback to the message queue', function () {
      const subscription = { subscribe: 'TICKET_CREATED', location: 1234, id: 'AFAFAF' };
      Qminder.events.subscribe(subscription, func);
      const message = Qminder.events.messageQueue[0];
      expect(Qminder.events.messageQueue.length).toBe(1);
      expect(message.message).toBe(subscription);
      expect(message.callback).toBe(func);
    });
    it('if not connecting, tries to open the socket', function () {
      const subscription = { subscribe: 'TICKET_CREATED', location: 1234, id: 'AFAFAF' };
      const stub = sinon.stub(Qminder.events, 'openSocket');
      Qminder.events.subscribe(subscription, func);
      expect(stub.called).toBeTruthy();
      stub.restore();
    });
    it('if connecting, does not try to open the socket again', function () {
      const subscription = { subscribe: 'TICKET_CREATED', location: 1234, id: 'AFAFAF' };
      const stub = sinon.stub(Qminder.events, 'openSocket');
      Qminder.events.subscribe(subscription, func);
      Qminder.events.connecting = true;
      Qminder.events.subscribe(subscription, func);
      expect(stub.callCount).toBe(1);
      stub.restore();
    });
  });

  describe('Defaults', function() {
    beforeEach(function() {
      Qminder.events.reset();
    });

    it('sets the server to wss://api.qminder.com:443 by default', function() {
      expect(Qminder.events.apiServer).toBe('wss://api.qminder.com:443');
    });
  });
});
