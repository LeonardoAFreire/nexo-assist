import { apiErrorSchema, type ChatStreamEvent } from '@nexo/contracts';
import { ApiRequestError } from '@/lib/api-request-error';
import { parseStreamEvent } from './parse-stream-event.js';
import { readEventStream } from './read-event-stream.js';

const UNAVAILABLE_STATUS = 0;
const UNAVAILABLE_MESSAGE = 'Não foi possível falar com o servidor. Tente de novo em instantes.';

export type ChatStreamRequest = {
  path: string;
  body: unknown;
  signal: AbortSignal;
};

async function toRequestError(response: Response): Promise<ApiRequestError> {
  const parsed = apiErrorSchema.safeParse(await response.json().catch(() => null));
  const error = parsed.success
    ? parsed.data.error
    : { code: 'internal_error' as const, message: UNAVAILABLE_MESSAGE };
  return new ApiRequestError({ ...error, status: response.status });
}

function toUnavailableError(cause: unknown): ApiRequestError {
  const unavailable = { code: 'internal_error', message: UNAVAILABLE_MESSAGE } as const;
  return new ApiRequestError({ ...unavailable, status: UNAVAILABLE_STATUS }, { cause });
}

async function openStream(request: ChatStreamRequest): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${request.path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(request.body),
    signal: request.signal,
  }).catch((cause: unknown) => {
    throw toUnavailableError(cause);
  });
  if (!response.ok || !response.body) {
    throw await toRequestError(response);
  }
  return response.body;
}

export async function* streamChatEvents(
  request: ChatStreamRequest,
): AsyncGenerator<ChatStreamEvent> {
  const body = await openStream(request);
  for await (const message of readEventStream(body)) {
    const event = parseStreamEvent(message);
    if (event) {
      yield event;
    }
  }
}
