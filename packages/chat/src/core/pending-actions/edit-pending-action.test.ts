import { describe, expect, it } from 'vitest';
import { CONVERSATION_ID, makeDraft } from '../testing/factories.js';
import { makeFixture } from '../testing/pending-action-fixture.js';
import { EditPendingAction } from './edit-pending-action.js';

const BLOCKING_FACTS = {
  impact: 'only_me',
  blocksWork: true,
  sameDayCommitment: false,
  hasWorkaround: false,
  kind: 'incident',
} as const;

async function setup() {
  const fixture = makeFixture();
  const draft = makeDraft({ priorityFacts: BLOCKING_FACTS, priority: 'high' });
  const record = await fixture.pendingActions.propose({
    conversationId: CONVERSATION_ID,
    proposal: { kind: 'create_ticket', draft, targetNumber: null, complement: null },
  });
  const edit = new EditPendingAction(fixture.actions, fixture.tickets);
  return { ...fixture, record, edit };
}

describe('EditPendingAction', () => {
  it('recalcula para crítica ao mudar afetados para a equipe e mantém pending', async () => {
    const { edit, conversation, record, actions } = await setup();
    expect(record.draft?.priority).toBe('high');
    const edited = await edit.execute({
      conversation,
      actionId: record.id,
      changes: { affected: 'my_team' },
    });
    expect(edited.status).toBe('pending');
    expect(edited.draft?.affected).toBe('my_team');
    expect(edited.draft?.priorityFacts.impact).toBe('my_team');
    expect(edited.draft?.priority).toBe('critical');
    expect(edited.draft?.dueAt).toBe('due-critical');
    expect(await actions.findById(record.id)).toEqual(edited);
  });

  it('atualiza título, descrição e categoria e reavalia prioridade e prazo', async () => {
    const { edit, conversation, record } = await setup();
    const edited = await edit.execute({
      conversation,
      actionId: record.id,
      changes: {
        title: 'Novo título',
        description: 'Descrição ajustada pelo funcionário',
        category: 'access',
      },
    });
    expect(edited.draft?.title).toBe('Novo título');
    expect(edited.draft?.description).toBe('Descrição ajustada pelo funcionário');
    expect(edited.draft?.category).toBe('access');
    expect(edited.draft?.priority).toBe('high');
    expect(edited.status).toBe('pending');
  });

  it('recusa editar ação que não está mais pending', async () => {
    const { edit, conversation, record, pendingActions } = await setup();
    await pendingActions.cancel({ conversation, actionId: record.id });
    await expect(
      edit.execute({ conversation, actionId: record.id, changes: { title: 'Outro título' } }),
    ).rejects.toThrow(expect.objectContaining({ code: 'pending_action_not_pending' }));
  });

  it('recusa editar complemento e reabertura', async () => {
    const { edit, conversation, pendingActions } = await setup();
    const reopen = await pendingActions.propose({
      conversationId: CONVERSATION_ID,
      proposal: {
        kind: 'reopen_ticket',
        draft: null,
        targetNumber: 'INC-20150',
        complement: 'Voltou',
      },
    });
    await expect(
      edit.execute({ conversation, actionId: reopen.id, changes: { title: 'Outro título' } }),
    ).rejects.toThrow(expect.objectContaining({ code: 'validation_error' }));
  });
});
