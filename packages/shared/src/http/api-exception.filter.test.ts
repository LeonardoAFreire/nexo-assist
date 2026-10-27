import { type ArgumentsHost, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { ApiError } from '@nexo/contracts';
import type { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { ZodError, z } from 'zod';
import { ApiExceptionFilter } from './api-exception.filter.js';
import { ApiHttpException } from './api-http.exception.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

type Captured = { status: number | undefined; body: ApiError | undefined };

function runFilter(exception: unknown): Captured & { logError: ReturnType<typeof vi.fn> } {
  const captured: Captured = { status: undefined, body: undefined };
  const logError = vi.fn();
  const logger = { setContext: vi.fn(), error: logError } as unknown as PinoLogger;
  const response = {
    status: (code: number) => {
      captured.status = code;
      return { json: (body: ApiError) => (captured.body = body) };
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  new ApiExceptionFilter(logger).catch(exception, host);
  return { ...captured, logError };
}

describe('ApiExceptionFilter', () => {
  it('devolve o code e o status de ApiHttpException, inclusive 503 com código próprio', () => {
    const exception = new ApiHttpException({
      code: 'tickets_unavailable',
      message: 'Sistema de chamados fora do ar',
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
    const { status, body } = runFilter(exception);
    expect(status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(body).toEqual({
      error: { code: 'tickets_unavailable', message: 'Sistema de chamados fora do ar' },
    });
  });

  it('esconde detalhes de erros não tratados atrás de internal_error', () => {
    const { status, body, logError } = runFilter(
      new Error('SELECT * FROM tickets falhou em C:\\app'),
    );
    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body?.error.code).toBe('internal_error');
    expect(JSON.stringify(body)).not.toContain('SELECT');
    expect(logError).toHaveBeenCalledOnce();
  });

  it('não vaza a mensagem de um HttpException 5xx genérico', () => {
    const { body } = runFilter(new HttpException('detalhe do provedor', HttpStatus.BAD_GATEWAY));
    expect(body?.error).toEqual({
      code: 'internal_error',
      message: 'Erro interno. Tente novamente em instantes.',
    });
  });

  it('mapeia exceções 4xx do Nest para o código do status', () => {
    const { status, body } = runFilter(new NotFoundException('Rota inexistente'));
    expect(status).toBe(HttpStatus.NOT_FOUND);
    expect(body?.error.code).toBe('not_found');
  });
});

describe('ZodValidationPipe', () => {
  it('devolve o dado validado', () => {
    const pipe = new ZodValidationPipe(z.strictObject({ name: z.string() }));
    expect(pipe.transform({ name: 'Ana' })).toEqual({ name: 'Ana' });
  });

  it('lança validation_error com status 400 para corpo inválido', () => {
    const pipe = new ZodValidationPipe(z.strictObject({ name: z.string() }));
    const attempt = (): unknown => pipe.transform({ name: 1, extra: true });
    expect(attempt).toThrow(ApiHttpException);
    try {
      attempt();
    } catch (error: unknown) {
      expect(error).toMatchObject({ code: 'validation_error' });
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error).not.toBeInstanceOf(ZodError);
    }
  });
});
