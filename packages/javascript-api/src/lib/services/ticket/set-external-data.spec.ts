import * as sinon from 'sinon';
import { Qminder } from '../../qminder';
import { TicketService } from './ticket.service';

describe('Ticket.setExternalData', () => {
  let requestStub: sinon.SinonStub;

  beforeEach(() => {
    Qminder.setKey('EXAMPLE_API_KEY');
    Qminder.setServer('api.qminder.com');
    requestStub = sinon.stub(Qminder.ApiBase, 'request');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('sends POST to v1/tickets/<id>/external with stringified data and returns success', async () => {
    const ticketId = '123';
    const provider = 'crm';
    const title = 'Case #42';
    const data = { foo: 'bar', num: 5 };

    requestStub.resolves({ result: 'success' });

    const result = await TicketService.setExternalData(ticketId as any, provider, title, data);

    expect(result).toBe('success');

    expect(requestStub.calledOnce).toBeTruthy();
    const [url, options] = requestStub.getCall(0).args as [string, any];
    expect(url).toBe(`v1/tickets/${ticketId}/external`);
    expect(options.method).toBe('POST');
    expect(options.body).toEqual({
      provider,
      title,
      data: JSON.stringify(data),
    });
  });
});
