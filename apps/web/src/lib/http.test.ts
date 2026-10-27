import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '@/test/server';
import { ApiRequestError } from './api-request-error';
import { http } from './http';

const BAD_GATEWAY_STATUS = 502;
const TICKETS_UNAVAILABLE = { code: 'tickets_unavailable', message: 'Chamados fora do ar.' };

describe('http', () => {
  it('converte o corpo de erro da API em ApiRequestError', async () => {
    server.use(
      mswHttp.get(apiUrl('/tickets'), () =>
        HttpResponse.json({ error: TICKETS_UNAVAILABLE }, { status: BAD_GATEWAY_STATUS }),
      ),
    );
    const error = await http.get('/tickets').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ ...TICKETS_UNAVAILABLE, status: BAD_GATEWAY_STATUS });
  });

  it('usa uma mensagem genérica quando a resposta não segue o formato da API', async () => {
    server.use(
      mswHttp.get(
        apiUrl('/tickets'),
        () => new HttpResponse('<html>', { status: BAD_GATEWAY_STATUS }),
      ),
    );
    const error = await http.get('/tickets').catch((reason: unknown) => reason);
    expect(error).toMatchObject({ code: 'internal_error', status: BAD_GATEWAY_STATUS });
    expect((error as ApiRequestError).message).not.toContain('html');
  });
});
