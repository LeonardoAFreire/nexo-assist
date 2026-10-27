import { describe, expect, it } from 'vitest';
import { CONVERSATION_ID, makeDraft } from '../testing/factories.js';
import { makeFixture } from '../testing/pending-action-fixture.js';

const createProposal = {
  kind: 'create_ticket',
  draft: makeDraft(),
  targetNumber: null,
  complement: null,
} as const;

describe('PendingActions.propose', () => {
  it('grava a proposta como pending e recalcula prioridade e prazo pelas regras', async () => {
    const { pendingActions, actions } = makeFixture();
    const record = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: createProposal,
    });
    expect(record.status).toBe('pending');
    expect(record.displayNumber).toBe('D-1');
    expect(record.draft?.priority).toBe('medium');
    expect(record.draft?.rule).toBe('regra-medium');
    expect(await actions.findById(record.id)).toEqual(record);
  });

  it('marca a proposta anterior como superseded e deixa só uma pending', async () => {
    const { pendingActions, actions } = makeFixture();
    const first = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: createProposal,
    });
    const second = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: { ...createProposal, draft: makeDraft({ title: 'Outro problema' }) },
    });
    expect((await actions.findById(first.id))?.status).toBe('superseded');
    expect((await actions.findById(first.id))?.resolvedAt).not.toBeNull();
    expect((await actions.findPendingByConversation(CONVERSATION_ID))?.id).toBe(second.id);
  });

  it('não mexe nas ações pendentes de outra conversa', async () => {
    const { pendingActions, actions } = makeFixture();
    const other = await pendingActions.propose({
      conversationId: 'outra-conversa',
      proposal: createProposal,
    });
    await pendingActions.propose({ conversationId: CONVERSATION_ID, proposal: createProposal });
    expect((await actions.findById(other.id))?.status).toBe('pending');
  });

  it('aceita complemento e reabertura sem rascunho', async () => {
    const { pendingActions } = makeFixture();
    const record = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: {
        kind: 'reopen_ticket',
        draft: null,
        targetNumber: 'INC-20150',
        complement: 'O erro voltou',
      },
    });
    expect(record.draft).toBeNull();
    expect(record.targetNumber).toBe('INC-20150');
  });

  it('recusa proposta incompleta sem substituir a pendente', async () => {
    const { pendingActions, actions } = makeFixture();
    const current = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: createProposal,
    });
    const incomplete = {
      kind: 'complement_ticket',
      draft: null,
      targetNumber: null,
      complement: 'x',
    } as const;
    await expect(
      pendingActions.propose({ conversationId: CONVERSATION_ID, proposal: incomplete }),
    ).rejects.toThrow('Proposta incompleta');
    expect((await actions.findById(current.id))?.status).toBe('pending');
  });
});

describe('PendingActions.cancel', () => {
  it('cancela a ação pendente e registra a data', async () => {
    const { pendingActions, conversation } = makeFixture();
    const record = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: createProposal,
    });
    const cancelled = await pendingActions.cancel({ conversation, actionId: record.id });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.resolvedAt).not.toBeNull();
  });

  it('recusa cancelar ação que já foi cancelada', async () => {
    const { pendingActions, conversation } = makeFixture();
    const record = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: createProposal,
    });
    await pendingActions.cancel({ conversation, actionId: record.id });
    await expect(pendingActions.cancel({ conversation, actionId: record.id })).rejects.toThrow(
      expect.objectContaining({ code: 'pending_action_not_pending' }),
    );
  });

  it('trata ação de outra conversa como não encontrada', async () => {
    const { pendingActions, conversation } = makeFixture();
    const foreign = await pendingActions.propose({
      conversationId: 'outra-conversa',
      proposal: createProposal,
    });
    await expect(pendingActions.cancel({ conversation, actionId: foreign.id })).rejects.toThrow(
      expect.objectContaining({ code: 'not_found' }),
    );
    await expect(pendingActions.cancel({ conversation, actionId: 'inexistente' })).rejects.toThrow(
      expect.objectContaining({ code: 'not_found' }),
    );
  });
});
