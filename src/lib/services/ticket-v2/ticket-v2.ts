import { TicketCreatedResponse } from '../../model/ticket/ticket-created-response';
import { TicketCreationRequestV2 } from '../../model/ticket/ticket-creation-request-v2';
import { ApiBase } from '../api-base/api-base';

export function create(
  request: TicketCreationRequestV2,
): Promise<TicketCreatedResponse> {
  const body = JSON.stringify(request);

  return ApiBase.request(`/ticket`, {
    method: 'POST',
    body,
    headers: {
      'X-Qminder-API-Version': '2020-09-01',
    },
  });
}
