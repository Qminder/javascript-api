import * as sinon from 'sinon';
import { Ticket } from '../../model/ticket/ticket';
import { TicketCreatedResponse } from '../../model/ticket/ticket-created-response';
import { TicketCreationRequest } from '../../model/ticket/ticket-creation-request';
import { Qminder } from '../../qminder';
import { TicketService } from './ticket.service';
import { ResponseValidationError } from '../../model/errors/response-validation-error';

describe('Ticket service', function () {
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?line=123%2C124%2C125'),
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
      expect(() => TicketService.search(request)).not.toThrow();
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?line=123'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?location=111'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/search?status=NEW%2CCALLED%2CSERVED',
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
      expect(() => TicketService.search(request)).not.toThrow();
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?status=CALLED'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?caller=111'),
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
      const request = { caller: { id: 111 } };
      requestStub.onCall(0).resolves(tickets);
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?caller=111'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/search?minCreated=2017-09-02T12%3A48%3A10Z',
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?minCreated=1507809281'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/search?maxCreated=2017-09-02T12%3A48%3A10Z',
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?maxCreated=1507809281'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/search?minCalled=2017-09-02T12%3A48%3A10Z',
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?minCalled=1507809281'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/search?maxCalled=2017-09-02T12%3A48%3A10Z',
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?maxCalled=1507809281'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?limit=5'),
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

    it('sets the order', function (done) {
      const request = { order: 'id ASC' };
      requestStub.onCall(0).resolves(tickets);
      TicketService.search(request).then(
        () => {
          console.log('search sets the order', requestStub.getCalls());
          expect(
            requestStub.calledWith('v1/tickets/search?order=id+ASC'),
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
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/search?responseScope=MESSAGES'),
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
        caller: { id: 111 },
        limit: 5,
      };
      requestStub.onCall(0).resolves(ticketsWithMessages);
      TicketService.search(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/search?responseScope=MESSAGES&line=123%2C234%2C345&status=NEW%2CCALLED%2CSERVED&caller=111&limit=5',
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?line=123%2C124%2C125'),
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
      expect(() => TicketService.count(request)).not.toThrow();
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?line=123'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?location=111'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/count?status=NEW%2CCALLED%2CSERVED',
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
      expect(() => TicketService.count(request)).not.toThrow();
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?status=CALLED'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?caller=111'),
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
      const request = { caller: { id: 111 } };
      requestStub.onCall(0).resolves(tickets);
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?caller=111'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/count?minCreated=2017-09-02T12%3A48%3A10Z',
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?minCreated=1507809281'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/count?maxCreated=2017-09-02T12%3A48%3A10Z',
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?maxCreated=1507809281'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/count?minCalled=2017-09-02T12%3A48%3A10Z',
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?minCalled=1507809281'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/count?maxCalled=2017-09-02T12%3A48%3A10Z',
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?maxCalled=1507809281'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?line=1234&limit=5'),
          ).toBeFalsy();
          expect(
            requestStub.calledWith('v1/tickets/count?line=1234'),
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
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith('v1/tickets/count?line=1234&order=id%20ASC'),
          ).toBeFalsy();
          expect(
            requestStub.calledWith('v1/tickets/count?line=1234'),
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
        caller: { id: 111 },
      };
      requestStub.onCall(0).resolves({ count: 3 });
      TicketService.count(request).then(
        () => {
          expect(
            requestStub.calledWith(
              'v1/tickets/count?line=123%2C234%2C345&status=NEW%2CCALLED%2CSERVED&caller=111',
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

    it('its return value is a Number', function (done) {
      requestStub.onCall(0).resolves({ count: 3 });
      TicketService.count({ line: [1234] }).then((response) => {
        expect(typeof response).toBe('number');
        done();
      });
    });
  });

  describe('create()', () => {
    let requestStub: jest.SpyInstance;

    const SUCCESSFUL_RESPONSE: TicketCreatedResponse = {
      id: '49199020',
    };

    beforeEach(() => {
      Qminder.setKey('EXAMPLE_API_KEY');
      Qminder.setServer('api.qminder.com');
      requestStub = jest.spyOn(Qminder.ApiBase, 'request');
    });

    it('passes the parameters along to ApiBase.request correctly', async () => {
      requestStub.mockResolvedValue(SUCCESSFUL_RESPONSE);
      const request: TicketCreationRequest = {
        lineId: '41299290',
        firstName: 'James',
        lastName: 'Baxter',
        email: 'foo@bar.com',
      };
      const res = await TicketService.create(request);
      expect(requestStub).toHaveBeenCalledWith('tickets', {
        body: JSON.stringify(request),
        headers: { 'X-Qminder-API-Version': '2020-09-01' },
        method: 'POST',
      });
      expect(res).toEqual(SUCCESSFUL_RESPONSE);
    });

    it('should throw when response does not contain ID', async () => {
      requestStub.mockResolvedValue({});
      const request: TicketCreationRequest = {
        lineId: '41299290',
        firstName: 'James',
        lastName: 'Baxter',
        email: 'foo@bar.com',
      };
      await expect(async () => {
        await TicketService.create(request);
      }).rejects.toThrow(
        new ResponseValidationError('Response does not contain "id"'),
      );
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
      TicketService.details(12345).then(() => {
        expect(requestStub.calledWith('v1/tickets/12345')).toBeTruthy();
        done();
      });
    });

    it('calls the right URL when ticket is passed in as a Ticket', function (done) {
      const ticket = { id: 12345 };
      TicketService.details(ticket).then(() => {
        expect(requestStub.calledWith('v1/tickets/12345')).toBeTruthy();
        done();
      });
    });

    it('resolves to a Ticket object', function (done) {
      TicketService.details(12345).then((response) => {
        expect(response).toEqual(expect.objectContaining(detailsResponseBody));
        done();
      });
    });

    it('throws when ticket is missing', function () {
      expect(() => TicketService.details(undefined as any)).toThrow();
    });

    it('throws when ticket is invalid', function () {
      // eslint-disable-next-line no-empty-function
      expect(() => (TicketService.details as any)(function () {})).toThrow();
    });

    it('throws when ticket is a Ticket object but id is undefined', function () {
      expect(() => TicketService.details({} as any)).toThrow();
    });

    it('does not set the email key when response does not include email', function () {
      const responseBody: Partial<Ticket> = { ...detailsResponseBody };
      delete responseBody.email;

      requestStub.resetBehavior();
      requestStub.resolves(responseBody);

      TicketService.details(12345).then((response) => {
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
      TicketService.edit(12345, editedFields).then((response) => {
        console.log(requestStub.firstCall.args);
        expect(
          requestStub.calledWith('v1/tickets/12345/edit', {
            body: editedFields,
          }),
        ).toBeTruthy();
        expect(response).toBe('success');
        done();
      });
    });

    it('calls the right URL when ticket is passed as a Ticket object', function (done) {
      const ticket = { id: 12345 };
      TicketService.edit(ticket, editedFields).then((response) => {
        console.log(requestStub.firstCall.args);
        expect(
          requestStub.calledWith('v1/tickets/12345/edit', {
            body: editedFields,
          }),
        ).toBeTruthy();
        expect(response).toBe('success');
        done();
      });
    });

    it('throws when ticket is missing', function () {
      expect(function () {
        (TicketService.edit as any)(undefined);
      }).toThrow();
      expect(function () {
        (TicketService.edit as any)(undefined, { lastName: 'wow' });
      }).toThrow();
    });

    it("throws when there's no changes", function () {
      expect(function () {
        TicketService.edit({ id: 12345 }, undefined as any);
      }).toThrow();
    });

    it('throws when ticket is invalid', function () {
      expect(() => (TicketService.edit as any)('wheeee')).toThrow();
    });

    it('throws when ticket is a Ticket object but id is undefined', function () {
      expect(() => (TicketService.edit as any)({} as any)).toThrow();
    });

    it('allows resetting first name to empty with empty string', function () {
      TicketService.edit(12345, { firstName: '' } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { firstName: '' } }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting last name to empty with empty string', function () {
      TicketService.edit(12345, { lastName: '' } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { lastName: '' } }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting email to empty with empty string', function () {
      TicketService.edit(12345, { email: '' } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { email: '' } }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting first name to empty with null', function () {
      TicketService.edit(12345, { firstName: null } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { firstName: null } }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting last name to empty with null', function () {
      TicketService.edit(12345, { lastName: null } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { lastName: null } }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting phone number to empty with null', function () {
      TicketService.edit(12345, { phoneNumber: null } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { phoneNumber: null } }),
        ),
      ).toBeTruthy();
    });

    it('allows resetting email to empty with null', function () {
      TicketService.edit(12345, { email: null } as any);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { email: null } }),
        ),
      ).toBeTruthy();
    });

    it('sends the User ID if provided', function () {
      TicketService.edit(12345, { user: 14141, email: null } as any);

      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({ body: { email: null, user: '14141' } }),
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

      TicketService.edit(12345, changes);
      console.log(requestStub.firstCall.args);
      expect(
        requestStub.calledWith(
          'v1/tickets/12345/edit',
          sinon.match({
            body: {
              extra: JSON.stringify(changes.extra),
            },
          }),
        ),
      ).toBeTruthy();
    });
  });

  describe('call()', function () {
    beforeEach(function () {
      requestStub.resolves(JON_SNOW);
    });

    it('calls the right URL with ticket ID as number', function (done) {
      TicketService.call(12345).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: undefined,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('calls the right URL with a Ticket', function (done) {
      TicketService.call({ id: 12345 }).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: undefined,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('Returns a ticket with all fields present', function (done) {
      TicketService.call(12345).then((ticket) => {
        expect(ticket).toEqual(expect.objectContaining(JON_SNOW));
        done();
      });
    });

    it('throws when the ticket ID is missing', function () {
      expect(() => (TicketService.call as any)()).toThrow();
    });

    it('throws when the Ticket has no ID', function () {
      expect(() => TicketService.call({} as any)).toThrow();
    });

    it('calls the right URL with ticket and user ID as string', function (done) {
      const request = sinon.match({ user: '686' });
      TicketService.call(12345, 686).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('calls the right URL with ticket and User', function (done) {
      const request = sinon.match({ user: '686' });
      TicketService.call(12345, { id: 686 }).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws when the User has no ID', function () {
      expect(() => TicketService.call(12345, {} as any)).toThrow();
    });

    it('calls the right URL with ticket, user and desk ID as number', function (done) {
      const request = sinon.match({ user: '686' });
      TicketService.call(12345, 686).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('calls the right URL with ticket, user and Desk', function (done) {
      const request = sinon.match({ user: '666', desk: '3' });
      const desk = { id: 3 };
      TicketService.call(12345, 666, desk).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws when the Desk has no ID', function () {
      expect(() => TicketService.call(12345, 1234, {} as any)).toThrow();
    });

    it('calls the right URL with ticket, user, desk all numbers', function (done) {
      const request = sinon.match({ user: '2', desk: '3' });
      TicketService.call(1, 2, 3).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/1/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('calls the right URL with ticket, user, desk all objects', function (done) {
      const request = sinon.match({ user: '2', desk: '3' });
      const ticket = { id: 1 };
      const user = { id: 2 };
      const desk = { id: 3 };
      TicketService.call(ticket, user, desk).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/1/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('includes keepActiveTicketsOpen if set to true', function (done) {
      const request = sinon.match({ keepActiveTicketsOpen: true });
      TicketService.call(12345, null as any, null as any, true).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('includes keepActiveTicketsOpen if set to false', function (done) {
      const request = sinon.match({ keepActiveTicketsOpen: false });
      TicketService.call(12345, null as any, null as any, false).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('sends no request body if all params undefined', function (done) {
      TicketService.call(12345, null as any, null as any).then(() => {
        expect(requestStub.firstCall.args[1].body).toBeUndefined();
        done();
      });
    });

    it('does not send keepActiveTicketsOpen if all params undefined', function (done) {
      TicketService.call(12345, 12, 34).then(() => {
        expect(requestStub.firstCall.args[1].body.user).toBe('12');
        expect(requestStub.firstCall.args[1].body.desk).toBe('34');
        expect(
          requestStub.firstCall.args[1].body.keepActiveTicketsOpen,
        ).toBeUndefined();
        done();
      });
    });

    it('includes keepActiveTicketsOpen with other params in request', function (done) {
      const request = sinon.match({
        user: '12',
        desk: '34',
        keepActiveTicketsOpen: false,
      });
      TicketService.call(12345, 12, 34, false).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/call', {
            body: request,
            method: 'POST',
          }),
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
      TicketService.recall(12345).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/recall', { method: 'POST' }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.recall as any)()).toThrow();
    });
  });

  describe('markServed()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });

    it('calls the right URL with GET', function (done) {
      TicketService.markServed(12345).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/markserved', {
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.markServed as any)()).toThrow();
    });
  });

  describe('markNoShow()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });

    it('calls the right URL with GET', function (done) {
      TicketService.markNoShow(12345).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/marknoshow', {
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.markNoShow as any)()).toThrow();
    });
  });

  describe('cancel()', function () {
    beforeEach(function () {
      requestStub.resolves({
        result: 'success',
      });
    });

    it('calls the right URL with GET', function (done) {
      const matcher = sinon.match({ user: '14141' });
      TicketService.cancel(12345, 14141).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/cancel', {
            body: matcher,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.cancel as any)()).toThrow();
    });

    it('throws an error when the ticket parameter is passed a random object', function () {
      expect(() => TicketService.cancel({ test: 5 } as any, 14141)).toThrow();
    });

    it('works when the ticket parameter is a Qminder.Ticket', function () {
      const t = { id: 12345 };
      expect(() => TicketService.cancel(t, 14141)).not.toThrow();
      TicketService.cancel(t, 14141);
      expect(
        requestStub.calledWith('v1/tickets/12345/cancel', {
          body: { user: '14141' },
          method: 'POST',
        }),
      ).toBeTruthy();
    });

    it('works when the user parameter is a Qminder.User', function () {
      const u = { id: 14141 };
      expect(() => TicketService.cancel(12345, u)).not.toThrow();
      TicketService.cancel(12345, u);
      expect(
        requestStub.calledWith('v1/tickets/12345/cancel', {
          body: { user: '14141' },
          method: 'POST',
        }),
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
      TicketService.returnToQueue(12345, 111, 'FIRST').then(() => {
        expect(
          requestStub.calledWith(
            'v1/tickets/12345/returntoqueue?position=FIRST&user=111',
            { method: 'POST' },
          ),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.returnToQueue as any)()).toThrow();
    });

    it('throws an error when the user is missing', function () {
      expect(() => (TicketService.returnToQueue as any)(12345)).toThrow();
    });

    it('does not throw an error when the user is a number', function () {
      expect(() =>
        TicketService.returnToQueue(12345, 1234, 'FIRST'),
      ).not.toThrow();
    });

    it('throws an error when the position is missing', function () {
      expect(() => (TicketService.returnToQueue as any)(12345, 1234)).toThrow();
    });
  });

  describe('addLabel()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });

    it('calls the right URL with POST and parameters', function (done) {
      TicketService.addLabel(12345, 'LABEL', 41414).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/labels/add', {
            body: { value: 'LABEL', user: '41414' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.addLabel as any)()).toThrow();
    });

    it('throws an error when the label text is missing', function () {
      expect(() => (TicketService.addLabel as any)(12345)).toThrow();
    });

    it('does not throw an error when the user is missing (#147)', function () {
      expect(() =>
        (TicketService.addLabel as any)(12345, 'LABEL'),
      ).not.toThrow();
    });

    it('does not throw an error when the user is a Qminder.User', function () {
      expect(() =>
        TicketService.addLabel(12345, 'LABEL', { id: 41414 }),
      ).not.toThrow();
    });

    // Regression tests for #147
    it('calls the right URL with POST and parameters, without user ID (#147)', function (done) {
      TicketService.addLabel(12345, 'LABEL').then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/labels/add', {
            body: { value: 'LABEL' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('does not throw an error when the user is null (#147)', function () {
      expect(() =>
        TicketService.addLabel(12345, 'LABEL', null as any),
      ).not.toThrow();
    });

    it('does not throw an error when the user is a number', function () {
      expect(() => TicketService.addLabel(12345, 'LABEL', 1234)).not.toThrow();
    });
  });

  describe('setLabels()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });

    it('calls the right URL with PUT and parameters', function (done) {
      TicketService.setLabels(12345, ['Label 1', 'Label 2']).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/labels', {
            body: JSON.stringify({ labels: ['Label 1', 'Label 2'] }),
            method: 'PUT',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.setLabels as any)()).toThrow();
    });

    it('throws an error when the labels are missing', function () {
      expect(() => (TicketService.setLabels as any)(12345)).toThrow();
    });
  });

  describe('removeLabel()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });

    it('calls the right URL with POST and parameters', function (done) {
      TicketService.removeLabel(12345, 'LABEL', 41414).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/labels/remove', {
            body: { value: 'LABEL', user: '41414' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.removeLabel as any)()).toThrow();
    });

    it('throws an error when the label text is missing', function () {
      expect(() => (TicketService.removeLabel as any)(12345)).toThrow();
    });

    it('throws an error when the user is missing', function () {
      expect(() =>
        (TicketService.removeLabel as any)(12345, 'LABEL'),
      ).toThrow();
    });

    it('does not throw an error when the user is a number', function () {
      expect(() =>
        (TicketService.removeLabel as any)(12345, 'LABEL', 1234),
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
      TicketService.unassign(63020420, 7500).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/63020420/unassign', {
            body: { user: '7500' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.unassign as any)()).toThrow();
    });

    it('throws an error when the assigner is missing', function () {
      expect(() => (TicketService.unassign as any)(63020424)).toThrow();
    });

    it('works with User object passed as User parameter', function (done) {
      const unassigner = { id: 4100 };
      TicketService.unassign(63020421, unassigner).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/63020421/unassign', {
            body: { user: '4100' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('works with Ticket object passed as ticket parameter', function (done) {
      const ticket = { id: 60403009 };
      TicketService.unassign(ticket, 4142).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/60403009/unassign', {
            body: { user: '4142' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('works with Ticket & User object passed as parameters', function (done) {
      const unassigner = { id: 4100 };
      const ticket = { id: 59430 };
      TicketService.unassign(ticket, unassigner).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/59430/unassign', {
            body: { user: '4100' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the unassigner is invalid', function () {
      expect(() => TicketService.unassign(63020422, {} as any)).toThrow();
    });

    it('throws an error when the response returns an error', function (done) {
      requestStub.resetBehavior();
      requestStub
        .onCall(0)
        .rejects({ status: 400, message: '', developerMessage: '' });
      TicketService.unassign(63020422, 4950).then(
        () =>
          done(
            new Error(
              'TicketService.unassign promise should reject but resolved',
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
      TicketService.assignToUser(12345, 41413, 41414).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/assign', {
            body: { assigner: '41413', assignee: '41414' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws an error when the ticket ID is missing', function () {
      expect(() => (TicketService.assignToUser as any)()).toThrow();
    });

    it('throws an error when the assigner is missing', function () {
      expect(() => (TicketService.assignToUser as any)(12345)).toThrow();
    });
  });

  describe('reorder()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        result: 'success',
      });
    });

    it('calls the right URL for reorder after ticket', function (done) {
      TicketService.reorder(12345, 12346).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/reorder', {
            body: { after: '12346' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('works when the ticket is a Ticket object', function (done) {
      const ticket = { id: 12345 };
      TicketService.reorder(ticket, 12346).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/reorder', {
            body: { after: '12346' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('works when the afterTicket is a Ticket object', function (done) {
      const afterTicket = { id: 12346 };
      TicketService.reorder(12345, afterTicket).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/reorder', {
            body: { after: '12346' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('works when both ticket and afterTicket are Ticket objects', function (done) {
      const ticket = { id: 12345 };
      const afterTicket = { id: 12346 };
      TicketService.reorder(ticket, afterTicket).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/reorder', {
            body: { after: '12346' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('calls the right URL when reordering to be first', function (done) {
      TicketService.reorder(12345, null as any).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/reorder', {
            body: undefined,
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('omits the after key when reordering to be first (#159)', function (done) {
      TicketService.reorder(12345, null).then(() => {
        expect(requestStub.firstCall.args[1].body).toBeUndefined();
        done();
      });
    });

    it('throws when the ticket ID is missing', function () {
      expect(() => (TicketService.reorder as any)()).toThrow();
    });
  });

  describe('getEstimatedTimeOfService()', function () {
    beforeEach(function () {
      requestStub.onCall(0).resolves({
        estimatedTimeOfService: Date.now() / 1000,
      });
    });

    it('calls the right URL for getting estimated time', function (done) {
      TicketService.getEstimatedTimeOfService(12345).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/estimated-time'),
        ).toBeTruthy();
        done();
      });
    });

    it('throws when the ticket ID is missing', function () {
      expect(() =>
        (TicketService.getEstimatedTimeOfService as any)(),
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
      TicketService.getMessages(12345).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/messages'),
        ).toBeTruthy();
        done();
      });
    });

    it('resolves with the messages from response.messages', function (done) {
      TicketService.getMessages(12345).then((data) => {
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
      TicketService.getMessages(12345).then((data) => {
        expect(data instanceof Array).toBeTruthy();
        expect(data.length).toBe(1);
        expect(data[0].body).toBe('Right object!');
        done();
      });
    });

    it('throws when the ticket ID is missing', function () {
      expect(() => (TicketService.getMessages as any)()).toThrow();
    });
  });

  describe('sendMessage()', function () {
    beforeEach(function () {
      requestStub.resolves({
        result: 'success',
      });
    });

    it('calls the right URL for sending a message with User object', function (done) {
      TicketService.sendMessage(12345, 'Hello!', { id: 41414 }).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/messages', {
            body: { message: 'Hello!', user: '41414' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('calls the right URL for sending a message with user ID', function (done) {
      TicketService.sendMessage(12345, 'Hello!', 41414).then(() => {
        expect(
          requestStub.calledWith('v1/tickets/12345/messages', {
            body: { message: 'Hello!', user: '41414' },
            method: 'POST',
          }),
        ).toBeTruthy();
        done();
      });
    });

    it('throws when the ticket ID is not specified', function () {
      expect(() => (TicketService.sendMessage as any)()).toThrow();
    });

    it('throws when the message body is not specified', function () {
      expect(() => (TicketService.sendMessage as any)(12345)).toThrow();
    });

    it('throws when the sending user is not specified', function () {
      expect(() =>
        (TicketService.sendMessage as any)(12345, 'Hello'),
      ).toThrow();
    });

    it('does not throw when the sending user is specified as ID', function () {
      expect(() =>
        TicketService.sendMessage(12345, 'Hello', 41414),
      ).not.toThrow();
    });

    it('throws when the sending user is specified as some random object', function () {
      expect(() =>
        TicketService.sendMessage(12345, 'Hello', { test: 5 } as any),
      ).toThrow();
    });
  });

  afterEach(function () {
    requestStub.restore();
  });
});
