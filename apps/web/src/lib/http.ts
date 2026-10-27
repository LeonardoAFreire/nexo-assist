import { apiErrorSchema } from '@nexo/contracts';
import axios, { type AxiosError } from 'axios';
import { ApiRequestError } from './api-request-error.js';

const UNAVAILABLE_STATUS = 0;
const UNAVAILABLE_MESSAGE = 'Não foi possível falar com o servidor. Tente de novo em instantes.';
const UNAUTHENTICATED_CODE = 'unauthenticated';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | undefined;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | undefined): void {
  unauthorizedHandler = handler;
}

function toApiRequestError(error: AxiosError): ApiRequestError {
  const parsed = apiErrorSchema.safeParse(error.response?.data);
  const status = error.response?.status ?? UNAVAILABLE_STATUS;
  if (!parsed.success) {
    const fallback = { code: 'internal_error', message: UNAVAILABLE_MESSAGE, status } as const;
    return new ApiRequestError(fallback, { cause: error });
  }
  return new ApiRequestError({ ...parsed.data.error, status }, { cause: error });
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

http.interceptors.response.use(undefined, (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return Promise.reject(error);
  }
  const requestError = toApiRequestError(error);
  if (requestError.code === UNAUTHENTICATED_CODE) {
    unauthorizedHandler?.();
  }
  return Promise.reject(requestError);
});
