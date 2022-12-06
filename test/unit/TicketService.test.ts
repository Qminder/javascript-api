import * as sinon from 'sinon';
import * as Qminder from '../../src/qminder-api';

describe('TicketService', function () {
  const JON_SNOW = {
    id: 12345,
    line: 111111,
    firstName: 'Jon',
    lastName: 'Snow',
    email: 'jon.snow@winterfell.is',
  };
  let requestStub: sinon.SinonStub;
  beforeEach(function () {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });
  describe('search()', function () {
    const tickets = {
      data: [
        { id: 1, line: 123 },
        { id: 2, line: 124 },
        { id: 3, line: 125 },
      ],
    };
    const ticketsWithMessages = {
      data: tickets.data.map((each) => ({ ...each, messages: [] })),
    };
    it('searches based on lines', function (done) {
      const request = { line: [123, 124, 125] };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?line=123%2C124%2C125'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('if line is a number, not an array, the call still functions correctly', function (done) {
      const request = { line: 123 };
      requestStub.resolves(tickets);
      expect(() => Qminder.tickets.search(request)).not.toThrow();
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?line=123'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on location', function (done) {
      const request = { location: 111 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?location=111'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on statuses', function (done) {
      const request: any = { status: ['NEW', 'CALLED', 'SERVED'] };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/search?status=NEW%2CCALLED%2CSERVED',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('if status is a string, not an array, the call still functions correctly', function (done) {
      const request = { status: 'CALLED' };
      requestStub.resolves(tickets);
      expect(() => Qminder.tickets.search(request)).not.toThrow();
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?status=CALLED'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on caller (passed as a number)', function (done) {
      const request = { caller: 111 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?caller=111'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on caller (passed as a User)', function (done) {
      const request = { caller: new Qminder.User(111) };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?caller=111'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min created time (ISO8601)', function (done) {
      const request = { minCreated: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/search?minCreated=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min created time (Unix)', function (done) {
      const request = { minCreated: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?minCreated=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max created time (ISO8601)', function (done) {
      const request = { maxCreated: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/search?maxCreated=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max created time (Unix)', function (done) {
      const request = { maxCreated: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?maxCreated=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min called time (ISO8601)', function (done) {
      const request = { minCalled: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/search?minCalled=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min called time (Unix)', function (done) {
      const request = { minCalled: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?minCalled=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max called time (ISO8601)', function (done) {
      const request = { maxCalled: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/search?maxCalled=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max called time (Unix)', function (done) {
      const request = { maxCalled: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?maxCalled=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('sets a limit', function (done) {
      const request = { limit: 5 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          expect(requestStub.calledWith('tickets/search?limit=5')).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('sets the order', function (done) {
      const request = { order: 'id ASC' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.search(request).then(
        () => {
          console.log('search sets the order', requestStub.getCalls());
          expect(
            requestStub.calledWith('tickets/search?order=id+ASC'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('allows setting responseScope to MESSAGES', function (done) {
      const request = { responseScope: 'MESSAGES' };

      requestStub.onCall(0).resolves(ticketsWithMessages);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/search?responseScope=MESSAGES'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('combines multiple searched parameters successfully', function (done) {
      const request: any = {
        responseScope: 'MESSAGES',
        line: [123, 234, 345],
        status: ['NEW', 'CALLED', 'SERVED'],
        caller: new Qminder.User(111),
        limit: 5,
      };
      requestStub.onCall(0).resolves(ticketsWithMessages);
      Qminder.tickets.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/search?responseScope=MESSAGES&line=123%2C234%2C345&status=NEW%2CCALLED%2CSERVED&caller=111&limit=5',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    // ---
    it('transforms its return list into Tickets', function (done) {
      const response: any = {
        data: [
          {
            id: 1,
            line: 1234,
            firstName: 'Jo',
            lastName: 'Smi',
            source: 'NAME',
            extra: [],
          },
        ],
      };
      requestStub.onCall(0).resolves(response);
      Qminder.tickets.search({ line: [1234] }).then((res) => {
        expect(res instanceof Array).toBeTruthy();
        expect(res.length).toBe(1);
        expect(res[0] instanceof Qminder.Ticket).toBeTruthy();
        done();
      });
    });
  });
  describe('count()', function () {
    const tickets = {
      data: [
        { id: 1, line: 123 },
        { id: 2, line: 124 },
        { id: 3, line: 125 },
      ],
    };
    const ticketsWithMessages = {
      data: tickets.data.map((each) => ({ ...each, messages: [] })),
    };
    it('searches based on lines', function (done) {
      const request = { line: [123, 124, 125] };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?line=123%2C124%2C125'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('if line is a number, not an array, the call still functions correctly', function (done) {
      const request = { line: 123 };
      requestStub.resolves(tickets);
      expect(() => Qminder.tickets.count(request)).not.toThrow();
      Qminder.tickets.count(request).then(
        () => {
          expect(requestStub.calledWith('tickets/count?line=123')).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on location', function (done) {
      const request = { location: 111 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?location=111'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on statuses', function (done) {
      const request: any = { status: ['NEW', 'CALLED', 'SERVED'] };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/count?status=NEW%2CCALLED%2CSERVED',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('if status is a string, not an array, the call still functions correctly', function (done) {
      const request = { status: 'CALLED' };
      requestStub.resolves(tickets);
      expect(() => Qminder.tickets.count(request)).not.toThrow();
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?status=CALLED'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on caller (passed as a number)', function (done) {
      const request = { caller: 111 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?caller=111'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on caller (passed as a User)', function (done) {
      const request = { caller: new Qminder.User(111) };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?caller=111'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min created time (ISO8601)', function (done) {
      const request = { minCreated: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/count?minCreated=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min created time (Unix)', function (done) {
      const request = { minCreated: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?minCreated=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max created time (ISO8601)', function (done) {
      const request = { maxCreated: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/count?maxCreated=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max created time (Unix)', function (done) {
      const request = { maxCreated: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?maxCreated=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min called time (ISO8601)', function (done) {
      const request = { minCalled: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/count?minCalled=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on min called time (Unix)', function (done) {
      const request = { minCalled: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?minCalled=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max called time (ISO8601)', function (done) {
      const request = { maxCalled: '2017-09-02T12:48:10Z' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/count?maxCalled=2017-09-02T12%3A48%3A10Z',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('searches based on max called time (Unix)', function (done) {
      const request = { maxCalled: 1507809281 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?maxCalled=1507809281'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('does not allow a limit', function (done) {
      const request = { line: [1234], limit: 5 };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?line=1234&limit=5'),
          ).toBeFalsy();
          expect(
            requestStub.calledWith('tickets/count?line=1234'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('does not allow ordering', function (done) {
      const request = { line: [1234], order: 'id ASC' };
      requestStub.onCall(0).resolves(tickets);
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith('tickets/count?line=1234&order=id%20ASC'),
          ).toBeFalsy();
          expect(
            requestStub.calledWith('tickets/count?line=1234'),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    it('combines multiple searched parameters successfully', function (done) {
      const request: any = {
        line: [123, 234, 345],
        status: ['NEW', 'CALLED', 'SERVED'],
        caller: new Qminder.User(111),
      };
      requestStub.onCall(0).resolves({ count: 3 });
      Qminder.tickets.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'tickets/count?line=123%2C234%2C345&status=NEW%2CCALLED%2CSERVED&caller=111',
            ),
          ).toBeTruthy();
          done();
        },
        (fail) => {
          console.error(fail);
          expect(false).toBe(true);
          done();
        },
      );
    });
    // ---
    it('its return value is a Number', function (done) {
      requestStub.onCall(0).resolves({ count: 3 });
      Qminder.tickets.count({ line: [1234] }).then((response) => {
        expect(typeof response).toBe('number');
        done();
      });
    });
  });
  describe('create()', function () {
    const createRequestBody: any = {
      firstName: 'John',
      lastName: 'Smith',
    };
    const createResponseBody: any = {
      id: '12345',
    };
    beforeEach(function () {
      requestStub.resolves(createResponseBody);
    });
    it('calls the right URL when the line is specified as number', function (done) {
      Qminder.tickets.create(11111, createRequestBody).then(() => {
        expect(requestStub.calledWith('lines/11111/ticket', createRequestBody));
        done();
      });
    });
    it('calls the right URL when the line is specified as Line', function (done) {
      const line = new Qminder.Line({ id: 11111 } as any);
      Qminder.tickets.create(line.id, createRequestBody).then(() => {
        expect(requestStub.calledWith('lines/11111/ticket', createRequestBody));
        done();
      });
    });
    it('resolves to a Ticket object', function (done) {
      Qminder.tickets.create(11111, createRequestBody).then((response) => {
        expect(response instanceof Qminder.Ticket).toBeTruthy();
        expect(response.id).toBe(12345);
        done();
      });
    });
    it('throws when line ID is missing', function () {
      expect(() => (Qminder.tickets.create as any)(undefined, {})).toThrow();
    });
    it('throws when line is a Qminder.Line with undefined ID', function () {
      expect(() =>
        (Qminder.tickets.create as any)(new Qminder.Line({} as any)),
      ).toThrow();
    });
    it('Sends the extras as a JSON array', function () {
      const ticket: any = {
        firstName: 'Jon',
        lastName: 'Snow',
        phoneNumber: 3185551234,
        extra: [
          {
            title: 'Favorite soup',
            value: 'Borscht',
          },
        ],
      };

      Qminder.tickets.create(1, ticket);
      console.log(requestStub.firstCall.args);
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match({
            extra: JSON.stringify(ticket.extra),
          }),
        ),
      ).toBeTruthy();
    });
    it('Does not send undefined keys', function () {
      Qminder.tickets.create(1, {} as any);
      expect(
        requestStub.calledWithExactly(
          'lines/1/ticket',
          sinon.match({
            firstName: undefined,
            lastName: undefined,
            extra: undefined,
            email: undefined,
          }),
        ),
      ).toBeFalsy();
      expect(
        requestStub.calledWith('lines/1/ticket', sinon.match({})),
      ).toBeTruthy();
    });
    it('sends email address if it is defined', function () {
      const ticketWithEmail: any = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jsmith224@example.com',
      };
      Qminder.tickets.create(1, ticketWithEmail);
      expect(
        requestStub.calledWith('lines/1/ticket', sinon.match(ticketWithEmail)),
      ).toBeTruthy();
    });
    it('does not send email address if it is not defined', function () {
      const ticketWithoutEmail: any = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      Qminder.tickets.create(1, ticketWithoutEmail);
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match(ticketWithoutEmail),
        ),
      ).toBeTruthy();
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match({
            email: sinon.match.defined,
          }),
        ),
      ).toBeFalsy();
    });
    it('sends source if it is defined', function () {
      const ticketWithSource: any = {
        firstName: 'Jane',
        lastName: 'Smith',
        source: 'NAME',
      };
      Qminder.tickets.create(1, ticketWithSource);
      expect(
        requestStub.calledWith('lines/1/ticket', sinon.match(ticketWithSource)),
      ).toBeTruthy();
    });
    it('does not send source if it is not defined', function () {
      const ticketWithoutSource: any = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      Qminder.tickets.create(1, ticketWithoutSource);
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match(ticketWithoutSource),
        ),
      ).toBeTruthy();
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match({
            source: sinon.match.defined,
          }),
        ),
      ).toBeFalsy();
    });
    it('does not send Idempotency-Key if not provided', function () {
      const ticket: any = { firstName: 'Joe', lastName: 'Santana' };
      Qminder.tickets.create(1, ticket);
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match(ticket),
          'POST',
          undefined,
        ),
      ).toBeTruthy();
    });
    it('sends Idempotency-Key if provided', function () {
      const ticket: any = { firstName: 'Joe', lastName: 'Santana' };
      Qminder.tickets.create(1, ticket, '9e3a333e');
      expect(
        requestStub.calledWith(
          'lines/1/ticket',
          sinon.match(ticket),
          'POST',
          '9e3a333e',
        ),
      ).toBeTruthy();
    });
  });
  describe('details()', function () {
    const detailsResponseBody = {
      id: '12345',
      line: 11111,
      firstName: 'John',
      lastName: 'Smith',
      email: 'jsmith225@example.com',
    };
    beforeEach(function () {
      requestStub.resolves(detailsResponseBody);
    });
    it('calls the right URL when ticket ID is passed in as number', function (done) {
      Qminder.tickets.details(12345).then(() => {
        expect(requestStub.calledWith('tickets/12345')).toBeTruthy();
        done();
      });
    });
    it('calls the right URL when ticket is passed in as a Ticket', function (done) {
      const ticket = new Qminder.Ticket({ id: 12345 } as any);
      Qminder.tickets.details(ticket).then(() => {
        expect(requestStub.calledWith('tickets/12345')).toBeTruthy();
        done();
      });
    });
    it('resolves to a Ticket object', function (done) {
      Qminder.tickets.details(12345).then((response) => {
        expect(response instanceof Qminder.Ticket).toBeTruthy();
        expect(response).toEqual(expect.objectContaining(detailsResponseBody));
        done();
      });
    });
    it('throws when ticket is missing', function () {
      expect(() => Qminder.tickets.details(undefined)).toThrow();
    });
    it('throws when ticket is invalid', function () {
      // eslint-disable-next-line no-empty-function
      expect(() => (Qminder.tickets.details as any)(function () {})).toThrow();
    });
    it('throws when ticket is a Ticket object but id is undefined', function () {
      expect(() =>
        Qminder.tickets.details(new Qminder.Ticket({} as any)),
      ).toThrow();
    });
    it('does not set the email key when response does not include email', function () {
      const responseBody = { ...detailsResponseBody };
      delete responseBody.email;

      requestStub.resetBehavior();
      requestStub.resolves(responseBody);

      Qminder.tickets.details(12345).then((response) => {
        expect(response).toEqual(expect.objectContaining(responseBody));
        expect(response.email).toBeUndefined();
      });
    });
  });
  describe('edit()', function () {
    const editedFields: any = {
      line: 11111,
      firstName: 'Johnny',
      lastName: 'Smithicus',
      email: 'jsmithicus@example.com',
    };
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL when ticket is passed as ID', function (done) {
      Qminder.tickets.edit(12345, editedFields).then((response) => {
        console.log(requestStub.firstCall.args);
        expect(
          requestStub.calledWith('tickets/12345/edit', editedFields),
        ).toBeTruthy();
        expect(response).toBe('success');
        done();
      });
    });
    it('calls the right URL when ticket is passed as a Ticket object', function (done) {
      const ticket = new Qminder.Ticket({ id: 12345 } as any);
      Qminder.tickets.edit(ticket, editedFields).then((response) => {
        console.log(requestStub.firstCall.args);
        expect(
          requestStub.calledWith('tickets/12345/edit', editedFields),
        ).toBeTruthy();
        expect(response).toBe('success');
        done();
      });
    });
    it('throws when ticket is missing', function () {
      expect(function () {
        (Qminder.tickets.edit as any)(undefined);
      }).toThrow();
      expect(function () {
        (Qminder.tickets.edit as any)(undefined, { lastName: 'wow' });
      }).toThrow();
    });
    it("throws when there's no changes", function () {
      expect(function () {
        Qminder.tickets.edit({ id: 12345 }, undefined);
      }).toThrow();
    });
    it('throws when ticket is invalid', function () {
      expect(() => (Qminder.tickets.edit as any)('wheeee')).toThrow();
    });
    it('throws when ticket is a Ticket object but id is undefined', function () {
      expect(() =>
        (Qminder.tickets.edit as any)(new Qminder.Ticket({} as any)),
      ).toThrow();
    });

    it('allows resetting first name to empty with empty string', function () {
      Qminder.tickets.edit(12345, { firstName: '' } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ firstName: '' }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting last name to empty with empty string', function () {
      Qminder.tickets.edit(12345, { lastName: '' } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ lastName: '' }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting email to empty with empty string', function () {
      Qminder.tickets.edit(12345, { email: '' } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ email: '' }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting first name to empty with null', function () {
      Qminder.tickets.edit(12345, { firstName: null } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ firstName: null }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting last name to empty with null', function () {
      Qminder.tickets.edit(12345, { lastName: null } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ lastName: null }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting phone number to empty with null', function () {
      Qminder.tickets.edit(12345, { phoneNumber: null } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ phoneNumber: null }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting email to empty with null', function () {
      Qminder.tickets.edit(12345, { email: null } as any);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ email: null }),
        ),
      ).toBeTruthy();
    });

    it('sends the User ID if provided', function () {
      Qminder.tickets.edit(12345, { user: 14141, email: null } as any);

      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({ email: null, user: 14141 }),
        ),
      ).toBeTruthy();
    });

    it('Sends the extras as a JSON array', function () {
      const changes: any = {
        phoneNumber: 3185551234,
        extra: [
          {
            title: 'Favorite soup',
            value: 'Borscht',
          },
        ],
      };

      Qminder.tickets.edit(12345, changes);
      console.log(requestStub.firstCall.args);
      expect(
        requestStub.calledWith(
          'tickets/12345/edit',
          sinon.match({
            extra: JSON.stringify(changes.extra),
          }),
        ),
      ).toBeTruthy();
    });
  });
  describe('callNext()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves(JON_SNOW);
    });

    it('calls the API with only one line as ID', function (done) {
      Qminder.tickets.callNext([12345]).then(() => {
        const request = sinon.match({ lines: '12345' });
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the API with only one line as Line', function (done) {
      Qminder.tickets
        .callNext([new Qminder.Line({ id: 12345 } as any)])
        .then(() => {
          const request = sinon.match({ lines: '12345' });
          expect(
            requestStub.calledWith('tickets/call', request, 'POST'),
          ).toBeTruthy();
          done();
        });
    });
    it('calls the API with more than one line as IDs', function (done) {
      Qminder.tickets.callNext([12345, 12346]).then(() => {
        const request = sinon.match({ lines: '12345,12346' });
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the API with more than one line as Lines', function (done) {
      const lineA = new Qminder.Line({ id: 12345 } as any);
      const lineB = new Qminder.Line({ id: 12346 } as any);
      Qminder.tickets.callNext([lineA, lineB]).then(() => {
        const request = sinon.match({ lines: '12345,12346' });
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws when mixing ID and Line in the lines array', function () {
      const lineA = new Qminder.Line({ id: 12345 } as any);
      expect(() => Qminder.tickets.callNext([lineA, 12346])).toThrow();
    });
    it('throws when the lines array has a Line with no ID', function () {
      const lineA = new Qminder.Line({ id: 12345 } as any);
      const lineB = new Qminder.Line({} as any);
      expect(() => Qminder.tickets.callNext([lineA, lineB])).toThrow();
    });
    it('throws when the lines array has an undefined value', function () {
      expect(() => Qminder.tickets.callNext([12345, undefined])).toThrow();
    });

    it('calls the API with one line and caller user as ID', function (done) {
      Qminder.tickets.callNext([12345], 14141).then(() => {
        const request = sinon.match({ lines: '12345', user: 14141 });
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the API with one line and caller user as User', function (done) {
      Qminder.tickets
        .callNext([12345], new Qminder.User({ id: 14141 } as any))
        .then(() => {
          const request = sinon.match({ lines: '12345', user: 14141 });
          expect(
            requestStub.calledWith('tickets/call', request, 'POST'),
          ).toBeTruthy();
          done();
        });
    });
    it('throws when the caller User has no ID', function () {
      expect(() =>
        Qminder.tickets.callNext([12345], new Qminder.User({} as any)),
      ).toThrow();
    });
    it('throws when the caller User is invalid', function () {
      expect(() =>
        Qminder.tickets.callNext([12345], 'Helloooo' as any),
      ).toThrow();
    });

    it('calls the API with one line, caller user, and desk as ID', function (done) {
      Qminder.tickets.callNext([12345], 14141, 3).then(() => {
        const request = sinon.match({ lines: '12345', user: 14141, desk: 3 });
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the API with one line, caller user, and Desk', function (done) {
      Qminder.tickets
        .callNext([12345], 14141, new Qminder.Desk({ id: 3 } as any))
        .then(() => {
          const request = sinon.match({ lines: '12345', user: 14141, desk: 3 });
          expect(
            requestStub.calledWith('tickets/call', request, 'POST'),
          ).toBeTruthy();
          done();
        });
    });
    it('throws when the Desk has no ID', function () {
      expect(() =>
        Qminder.tickets.callNext([12345], 14141, new Qminder.Desk({} as any)),
      ).toThrow();
    });
    it('throws when the Desk is invalid', function () {
      expect(() =>
        Qminder.tickets.callNext([12345], 14141, 'Heyoooo' as any),
      ).toThrow();
    });

    it('calls the API with many lines, caller user, and desk all as IDs', function (done) {
      Qminder.tickets
        .callNext([12345, 67890, 14141, 23, 40, 1], 14141, 3)
        .then(() => {
          const request = sinon.match({
            lines: '12345,67890,14141,23,40,1',
            user: 14141,
            desk: 3,
          });
          expect(
            requestStub.calledWith('tickets/call', request, 'POST'),
          ).toBeTruthy();
          done();
        });
    });
    it('calls the API with many lines, caller user, and desk all as objects', function (done) {
      const lines = [];
      lines.push(new Qminder.Line({ id: 12345 } as any));
      lines.push(new Qminder.Line({ id: 67890 } as any));
      lines.push(new Qminder.Line({ id: 14141 } as any));
      lines.push(new Qminder.Line({ id: 23 } as any));
      const user = new Qminder.User({ id: 14141 } as any);
      const desk = new Qminder.Desk({ id: 5 } as any);
      const request = sinon.match({
        lines: '12345,67890,14141,23',
        user: 14141,
        desk: 5,
      });
      Qminder.tickets.callNext(lines, user, desk).then(() => {
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('resolves to a Ticket', function (done) {
      Qminder.tickets.callNext([111111]).then((response) => {
        expect(response instanceof Qminder.Ticket).toBeTruthy();
        expect(response.id).toBe(12345);
        expect(response.line).toBe(111111);
        done();
      });
    });
    it('if there is no ticket to call, resolves to null', function (done) {
      requestStub.onCall(0).resolves({ statusCode: 200 });
      Qminder.tickets.callNext([11111]).then((response) => {
        expect(response).toBe(null);
        done();
      });
    });

    it('includes keepActiveTicketsOpen if set to true', function (done) {
      const request = sinon.match({
        lines: '12345',
        user: 14141,
        desk: 3,
        keepActiveTicketsOpen: true,
      });
      Qminder.tickets.callNext([12345], 14141, 3, true).then(() => {
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('includes keepActiveTicketsOpen if set to false', function (done) {
      const request = sinon.match({
        lines: '12345',
        user: 14141,
        desk: 3,
        keepActiveTicketsOpen: false,
      });
      Qminder.tickets.callNext([12345], 14141, 3, false).then(() => {
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('excludes keepActiveTicketsOpen if not set', function (done) {
      const request = sinon.match({
        lines: '12345',
        user: 14141,
        desk: 3,
      });
      Qminder.tickets.callNext([12345], 14141, 3).then(() => {
        expect(
          requestStub.calledWith('tickets/call', request, 'POST'),
        ).toBeTruthy();
        expect(
          requestStub.firstCall.args[1].keepActiveTicketsOpen,
        ).toBeUndefined();
        done();
      });
    });
  });
  describe('call()', function () {
    beforeEach(function () {
      requestStub.resolves(JON_SNOW);
    });
    it('calls the right URL with ticket ID as number', function (done) {
      Qminder.tickets.call(12345).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', undefined, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the right URL with a Ticket', function (done) {
      Qminder.tickets
        .call(new Qminder.Ticket({ id: 12345 } as any))
        .then(() => {
          expect(
            requestStub.calledWith('tickets/12345/call', undefined, 'POST'),
          ).toBeTruthy();
          done();
        });
    });
    it('Returns a ticket with all fields present', function (done) {
      Qminder.tickets.call(12345).then((ticket) => {
        expect(ticket).toEqual(expect.objectContaining(JON_SNOW));
        done();
      });
    });
    it('throws when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.call as any)()).toThrow();
    });
    it('throws when the Ticket has no ID', function () {
      expect(() =>
        Qminder.tickets.call(new Qminder.Ticket({} as any)),
      ).toThrow();
    });
    it('throws when the ticket ID is invalid', function () {
      expect(() => Qminder.tickets.call('Heyoooo')).toThrow();
    });

    it('calls the right URL with ticket and user ID as number', function (done) {
      const request = sinon.match({ user: 686 });
      Qminder.tickets.call(12345, 686).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the right URL with ticket and User', function (done) {
      const request = sinon.match({ user: 686 });
      Qminder.tickets
        .call(12345, new Qminder.User({ id: 686 } as any))
        .then(() => {
          expect(
            requestStub.calledWith('tickets/12345/call', request, 'POST'),
          ).toBeTruthy();
          done();
        });
    });
    it('throws when the User has no ID', function () {
      expect(() =>
        Qminder.tickets.call(12345, new Qminder.User({} as any)),
      ).toThrow();
    });
    it('throws when the User is invalid', function () {
      expect(() =>
        Qminder.tickets.call(12345, 'Heyoooooooooooo' as any),
      ).toThrow();
    });

    it('calls the right URL with ticket, user and desk ID as number', function (done) {
      const request = sinon.match({ user: 686 });
      Qminder.tickets.call(12345, 686).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the right URL with ticket, user and Desk', function (done) {
      const request = sinon.match({ user: 666, desk: 3 });
      const desk = new Qminder.Desk({ id: 3 } as any);
      Qminder.tickets.call(12345, 666, desk).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws when the Desk has no ID', function () {
      expect(() =>
        Qminder.tickets.call(12345, 1234, new Qminder.Desk({} as any)),
      ).toThrow();
    });
    it('throws when the Desk is invalid', function () {
      expect(() => Qminder.tickets.call(12345, 1234, 'HEyo' as any)).toThrow();
    });

    it('calls the right URL with ticket, user, desk all numbers', function (done) {
      const request = sinon.match({ user: 2, desk: 3 });
      Qminder.tickets.call(1, 2, 3).then(() => {
        expect(
          requestStub.calledWith('tickets/1/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the right URL with ticket, user, desk all objects', function (done) {
      const request = sinon.match({ user: 2, desk: 3 });
      const ticket = new Qminder.Ticket({ id: 1 } as any);
      const user = new Qminder.User({ id: 2 } as any);
      const desk = new Qminder.Desk({ id: 3 } as any);
      Qminder.tickets.call(ticket, user, desk).then(() => {
        expect(
          requestStub.calledWith('tickets/1/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('includes keepActiveTicketsOpen if set to true', function (done) {
      const request = sinon.match({ keepActiveTicketsOpen: true });
      Qminder.tickets.call(12345, null, null, true).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('includes keepActiveTicketsOpen if set to false', function (done) {
      const request = sinon.match({ keepActiveTicketsOpen: false });
      Qminder.tickets.call(12345, null, null, false).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('sends no request body if all params undefined', function (done) {
      Qminder.tickets.call(12345, null, null).then(() => {
        expect(requestStub.firstCall.args[1]).toBeUndefined();
        done();
      });
    });
    it('does not send keepActiveTicketsOpen if all params undefined', function (done) {
      Qminder.tickets.call(12345, 12, 34).then(() => {
        expect(requestStub.firstCall.args[1].user).toBe(12);
        expect(requestStub.firstCall.args[1].desk).toBe(34);
        expect(
          requestStub.firstCall.args[1].keepActiveTicketsOpen,
        ).toBeUndefined();
        done();
      });
    });
    it('includes keepActiveTicketsOpen with other params in request', function (done) {
      const request = sinon.match({
        user: 12,
        desk: 34,
        keepActiveTicketsOpen: false,
      });
      Qminder.tickets.call(12345, 12, 34, false).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/call', request, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
  });
  describe('recall()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with GET', function (done) {
      Qminder.tickets.recall(12345).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/recall', undefined, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.recall as any)()).toThrow();
    });
  });
  describe('markServed()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with GET', function (done) {
      Qminder.tickets.markServed(12345).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/markserved', undefined, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.markServed as any)()).toThrow();
    });
  });
  describe('markNoShow()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with GET', function (done) {
      Qminder.tickets.markNoShow(12345).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/marknoshow', undefined, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.markNoShow as any)()).toThrow();
    });
  });
  describe('cancel()', function () {
    beforeEach(function () {
      requestStub.resolves({
        result: 'success',
      });
    });
    it('calls the right URL with GET', function (done) {
      const matcher = sinon.match({ user: 14141 });
      Qminder.tickets.cancel(12345, 14141).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/cancel', matcher, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.cancel as any)()).toThrow();
    });
    it('throws an error when the ticket parameter is passed a random object', function () {
      expect(() => Qminder.tickets.cancel({ test: 5 } as any, 14141)).toThrow();
    });
    it('works when the ticket parameter is a Qminder.Ticket', function () {
      const t = new Qminder.Ticket(12345);
      expect(() => Qminder.tickets.cancel(t, 14141)).not.toThrow();
      Qminder.tickets.cancel(t, 14141);
      expect(
        requestStub.calledWith('tickets/12345/cancel', { user: 14141 }, 'POST'),
      ).toBeTruthy();
    });
    it('works when the user parameter is a Qminder.User', function () {
      const u = new Qminder.User(14141);
      expect(() => Qminder.tickets.cancel(12345, u)).not.toThrow();
      Qminder.tickets.cancel(12345, u);
      expect(
        requestStub.calledWith('tickets/12345/cancel', { user: 14141 }, 'POST'),
      ).toBeTruthy();
    });
  });
  describe('returnToQueue()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with GET', function (done) {
      Qminder.tickets.returnToQueue(12345, 111, 'FIRST').then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/returntoqueue',
              { user: 111, position: 'FIRST' },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.returnToQueue as any)()).toThrow();
    });
    it('throws an error when the user is missing', function () {
      expect(() => (Qminder.tickets.returnToQueue as any)(12345)).toThrow();
    });
    it('does not throw an error when the user is a number', function () {
      expect(() =>
        Qminder.tickets.returnToQueue(12345, 1234, 'FIRST'),
      ).not.toThrow();
    });
    it('throws an error when the position is missing', function () {
      expect(() =>
        (Qminder.tickets.returnToQueue as any)(12345, 1234),
      ).toThrow();
    });
  });
  describe('addLabel()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with POST and parameters', function (done) {
      Qminder.tickets.addLabel(12345, 'LABEL', 41414).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/labels/add',
            { value: 'LABEL', user: 41414 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.addLabel as any)()).toThrow();
    });
    it('throws an error when the label text is missing', function () {
      expect(() => (Qminder.tickets.addLabel as any)(12345)).toThrow();
    });
    it('does not throw an error when the user is missing (#147)', function () {
      expect(() =>
        (Qminder.tickets.addLabel as any)(12345, 'LABEL'),
      ).not.toThrow();
    });
    it('does not throw an error when the user is a Qminder.User', function () {
      expect(() =>
        Qminder.tickets.addLabel(12345, 'LABEL', new Qminder.User(41414)),
      ).not.toThrow();
    });

    // Regression tests for #147
    it('calls the right URL with POST and parameters, without user ID (#147)', function (done) {
      Qminder.tickets.addLabel(12345, 'LABEL').then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/labels/add',
            { value: 'LABEL' },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('does not throw an error when the user is null (#147)', function () {
      expect(() =>
        Qminder.tickets.addLabel(12345, 'LABEL', null),
      ).not.toThrow();
    });
    it('does not throw an error when the user is a number', function () {
      expect(() =>
        Qminder.tickets.addLabel(12345, 'LABEL', 1234),
      ).not.toThrow();
    });
  });
  describe('removeLabel()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with POST and parameters', function (done) {
      Qminder.tickets.removeLabel(12345, 'LABEL', 41414).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/labels/remove',
            { value: 'LABEL', user: 41414 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.removeLabel as any)()).toThrow();
    });
    it('throws an error when the label text is missing', function () {
      expect(() => (Qminder.tickets.removeLabel as any)(12345)).toThrow();
    });
    it('throws an error when the user is missing', function () {
      expect(() =>
        (Qminder.tickets.removeLabel as any)(12345, 'LABEL'),
      ).toThrow();
    });
    it('does not throw an error when the user is a number', function () {
      expect(() =>
        (Qminder.tickets.removeLabel as any)(12345, 'LABEL', 1234),
      ).not.toThrow();
    });
  });
  describe('unassign()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with POST and parameters', function (done) {
      Qminder.tickets.unassign(63020420, 7500).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/63020420/unassign',
            { user: 7500 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.unassign as any)()).toThrow();
    });
    it('throws an error when the assigner is missing', function () {
      expect(() => (Qminder.tickets.unassign as any)(63020424)).toThrow();
    });
    it('works with User object passed as User parameter', function (done) {
      const unassigner = new Qminder.User(4100);
      Qminder.tickets.unassign(63020421, unassigner).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/63020421/unassign',
            { user: 4100 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('works with Ticket object passed as ticket parameter', function (done) {
      const ticket = new Qminder.Ticket(60403009);
      Qminder.tickets.unassign(ticket, 4142).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/60403009/unassign',
            { user: 4142 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('works with Ticket & User object passed as parameters', function (done) {
      const unassigner = new Qminder.User(4100);
      const ticket = new Qminder.Ticket(59430);
      Qminder.tickets.unassign(ticket, unassigner).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/59430/unassign',
            { user: 4100 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the unassigner is invalid', function () {
      expect(() => Qminder.tickets.unassign(63020422, {} as any)).toThrow();
    });
    it('throws an error when the response returns an error', function (done) {
      requestStub.resetBehavior();
      requestStub
        .onCall(0)
        .rejects({ status: 400, message: '', developerMessage: '' });
      Qminder.tickets.unassign(63020422, 4950).then(
        () =>
          done(
            new Error(
              'Qminder.tickets.unassign promise should reject but resolved',
            ),
          ),
        () => done(),
      );
    });
  });
  describe('assignToUser()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL with POST and parameters', function (done) {
      Qminder.tickets.assignToUser(12345, 41413, 41414).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/assign',
            { assigner: 41413, assignee: 41414 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('throws an error when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.assignToUser as any)()).toThrow();
    });
    it('throws an error when the assigner is missing', function () {
      expect(() => (Qminder.tickets.assignToUser as any)(12345)).toThrow();
    });
  });
  describe('reorder()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });
    it('calls the right URL for reorder after ticket', function (done) {
      Qminder.tickets.reorder(12345, 12346).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/reorder',
            { after: 12346 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('works when the ticket is a Ticket object', function (done) {
      const ticket = new Qminder.Ticket(12345);
      Qminder.tickets.reorder(ticket, 12346).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/reorder',
            { after: 12346 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('works when the afterTicket is a Ticket object', function (done) {
      const afterTicket = new Qminder.Ticket(12346);
      Qminder.tickets.reorder(12345, afterTicket).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/reorder',
            { after: 12346 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('works when both ticket and afterTicket are Ticket objects', function (done) {
      const ticket = new Qminder.Ticket(12345);
      const afterTicket = new Qminder.Ticket(12346);
      Qminder.tickets.reorder(ticket, afterTicket).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/reorder',
            { after: 12346 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });
    it('calls the right URL when reordering to be first', function (done) {
      Qminder.tickets.reorder(12345, null as any).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/reorder', undefined, 'POST'),
        ).toBeTruthy();
        done();
      });
    });
    it('omits the after key when reordering to be first (#159)', function (done) {
      Qminder.tickets.reorder(12345, null).then(() => {
        expect(requestStub.firstCall.args[1]).toBeUndefined();
        done();
      });
    });
    it('throws when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.reorder as any)()).toThrow();
    });
  });
  describe('getEstimatedTimeOfService()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        estimatedTimeOfService: Date.now() / 1000,
      });
    });
    it('calls the right URL for getting estimated time', function (done) {
      Qminder.tickets.getEstimatedTimeOfService(12345).then(() => {
        expect(
          requestStub.calledWith('tickets/12345/estimated-time'),
        ).toBeTruthy();
        done();
      });
    });
    it('throws when the ticket ID is missing', function () {
      expect(() =>
        (Qminder.tickets.getEstimatedTimeOfService as any)(),
      ).toThrow();
    });
  });
  describe('getMessages()', function () {
    beforeEach(function () {
      requestStub.resolves({
        messages: [
          {
            created: {
              date: '2017-04-12T16:27:57Z',
            },
            body: "It's your turn!",
            type: 'OUTGOING',
            status: 'SENT',
            userId: 15000,
          },
          {
            created: {
              date: '2017-04-17T11:50:13Z',
            },
            body: 'Thank you!',
            type: 'INCOMING',
            status: 'NEW',
          },
        ],
      });
    });
    it('calls the right URL for getting messages', function (done) {
      Qminder.tickets.getMessages(12345).then(() => {
        expect(requestStub.calledWith('tickets/12345/messages')).toBeTruthy();
        done();
      });
    });
    it('resolves with the messages from response.messages', function (done) {
      Qminder.tickets.getMessages(12345).then((data) => {
        expect(data instanceof Array).toBeTruthy();
        expect(data.length).toBe(2);
        expect(data[0].body).toBe("It's your turn!");
        expect(data[0].created.date).toBe('2017-04-12T16:27:57Z');
        expect(data[0].type).toBe('OUTGOING');
        expect(data[0].status).toBe('SENT');
        expect(data[0].userId).toBe(15000);
        done();
      });
    });
    it('does not try to read response.data (#154)', function (done) {
      requestStub.resolves({
        data: [{ body: 'Wrong object!' }],
        messages: [{ body: 'Right object!' }],
      });
      Qminder.tickets.getMessages(12345).then((data) => {
        expect(data instanceof Array).toBeTruthy();
        expect(data.length).toBe(1);
        expect(data[0].body).toBe('Right object!');
        done();
      });
    });
    it('throws when the ticket ID is missing', function () {
      expect(() => (Qminder.tickets.getMessages as any)()).toThrow();
    });
  });
  describe('sendMessage()', function () {
    beforeEach(function () {
      requestStub.resolves({
        result: 'success',
      });
    });

    it('calls the right URL for sending a message with User object', function (done) {
      Qminder.tickets
        .sendMessage(12345, 'Hello!', new Qminder.User({ id: 41414 } as any))
        .then(() => {
          expect(
            requestStub.calledWith(
              'tickets/12345/messages',
              { message: 'Hello!', user: 41414 },
              'POST',
            ),
          ).toBeTruthy();
          done();
        });
    });

    it('calls the right URL for sending a message with user ID', function (done) {
      Qminder.tickets.sendMessage(12345, 'Hello!', 41414).then(() => {
        expect(
          requestStub.calledWith(
            'tickets/12345/messages',
            { message: 'Hello!', user: 41414 },
            'POST',
          ),
        ).toBeTruthy();
        done();
      });
    });

    it('throws when the ticket ID is not specified', function () {
      expect(() => (Qminder.tickets.sendMessage as any)()).toThrow();
    });

    it('throws when the message body is not specified', function () {
      expect(() => (Qminder.tickets.sendMessage as any)(12345)).toThrow();
    });

    it('throws when the sending user is not specified', function () {
      expect(() =>
        (Qminder.tickets.sendMessage as any)(12345, 'Hello'),
      ).toThrow();
    });

    it('does not throw when the sending user is specified as ID', function () {
      expect(() =>
        (Qminder.tickets.sendMessage as any)(12345, 'Hello', 41414),
      ).not.toThrow();
    });

    it('throws when the sending user is specified as some random object', function () {
      expect(() =>
        (Qminder.tickets.sendMessage as any)(12345, 'Hello', { test: 5 }),
      ).toThrow();
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
