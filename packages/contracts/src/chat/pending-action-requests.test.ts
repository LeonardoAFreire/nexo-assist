import { describe, expect, it } from 'vitest';
import { confirmPendingActionRequestSchema } from './confirm-pending-action-request.js';
import { editPendingActionRequestSchema } from './edit-pending-action-request.js';
import { requestHandoffRequestSchema } from './request-handoff-request.js';

describe('editPendingActionRequestSchema', () => {
  it('aceita edição parcial do rascunho', () => {
    const result = editPendingActionRequestSchema.safeParse({ affected: 'my_team' });
    expect(result.success).toBe(true);
  });

  it('recusa corpo sem nenhum campo', () => {
    expect(editPendingActionRequestSchema.safeParse({}).success).toBe(false);
  });

  it('recusa campos extras como requesterId e priority', () => {
    expect(
      editPendingActionRequestSchema.safeParse({ title: 'Novo título', requesterId: 'x' }).success,
    ).toBe(false);
    expect(
      editPendingActionRequestSchema.safeParse({ title: 'Novo título', priority: 'critical' })
        .success,
    ).toBe(false);
  });

  it('respeita os limites de título e descrição', () => {
    expect(editPendingActionRequestSchema.safeParse({ title: 'abc' }).success).toBe(false);
    expect(editPendingActionRequestSchema.safeParse({ description: 'curta' }).success).toBe(false);
  });
});

describe('confirmPendingActionRequestSchema', () => {
  it('aceita button e shortcut e recusa text e campos extras', () => {
    expect(confirmPendingActionRequestSchema.safeParse({ via: 'button' }).success).toBe(true);
    expect(confirmPendingActionRequestSchema.safeParse({ via: 'shortcut' }).success).toBe(true);
    expect(confirmPendingActionRequestSchema.safeParse({ via: 'text' }).success).toBe(false);
    expect(
      confirmPendingActionRequestSchema.safeParse({ via: 'button', requesterId: 'x' }).success,
    ).toBe(false);
  });
});

describe('requestHandoffRequestSchema', () => {
  it('aceita só o motivo requested', () => {
    expect(requestHandoffRequestSchema.safeParse({ reason: 'requested' }).success).toBe(true);
    expect(requestHandoffRequestSchema.safeParse({ reason: 'critical' }).success).toBe(false);
  });
});
