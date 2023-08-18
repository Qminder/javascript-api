import { Qminder } from '../../qminder';

import { TicketCreatedResponse } from '../../model/ticket/ticket-created-response';
import { TicketCreationRequestV2 } from '../../model/ticket/ticket-creation-request-v2';
import { TicketServiceV2 } from './ticket-v2.service.js';

describe('Ticket service (V2)', function () {
  let requestStub: jest.SpyInstance;
  beforeEach(() => {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    requestStub = jest.spyOn(Qminder.ApiBase, 'request');
  });
  describe('create()', () => {
    const SUCCESSFUL_RESPONSE: TicketCreatedResponse = {
      id: '49199020',
    };

    it('passes the parameters along to ApiBase.request correctly', async () => {
      requestStub.mockResolvedValue(SUCCESSFUL_RESPONSE);
      const request: TicketCreationRequestV2 = {
        lineId: '41299290',
        firstName: 'James',
        lastName: 'Baxter',
        email: 'foo@bar.com',
      };
      const res = await TicketServiceV2.create(request);
      expect(requestStub).toHaveBeenCalledWith('ticket', {
        body: JSON.stringify(request),
        headers: { 'X-Qminder-API-Version': '2020-09-01' },
        method: 'POST',
      });
      expect(res).toEqual(SUCCESSFUL_RESPONSE);
    });
  });
});
