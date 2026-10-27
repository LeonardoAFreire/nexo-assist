import { describe, expect, it } from 'vitest';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createTransferirParaAnalistaTool } from './transferir-para-analista.js';

describe('transferir_para_analista', () => {
  it('emite o pedido de transferência com motivo e resumo', async () => {
    const { context, events } = makeTurnContext();
    const tool = createTransferirParaAnalistaTool();
    const input = { reason: 'requested', summary: 'VPN com erro 809 no Windows 11' } as const;
    const output = await tool.execute(input, context);
    expect(output).toEqual({ reason: 'requested' });
    expect(events).toEqual([
      {
        type: 'handoff-requested',
        reason: 'requested',
        summary: 'VPN com erro 809 no Windows 11',
        confidence: null,
      },
    ]);
    expect(tool.stepResult(input, output)).toBe('motivo: pedido do funcionário');
  });

  it('rejeita motivo desconhecido, resumo vazio e argumentos extras', () => {
    const { inputSchema } = createTransferirParaAnalistaTool();
    expect(inputSchema.safeParse({ reason: 'tedio', summary: 'x' }).success).toBe(false);
    expect(inputSchema.safeParse({ reason: 'requested', summary: ' ' }).success).toBe(false);
    expect(
      inputSchema.safeParse({ reason: 'requested', summary: 'x', requesterId: 'y' }).success,
    ).toBe(false);
  });
});
