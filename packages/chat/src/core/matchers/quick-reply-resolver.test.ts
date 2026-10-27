import type { ChatMessage, QuickOption } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { CONVERSATION_ID, NOW_ISO } from '../testing/factories.js';
import { findOpenOptions } from './find-open-options.js';
import { QuickReplyResolver } from './quick-reply-resolver.js';

const OPTIONS: QuickOption[] = [
  { id: 'only_me', label: 'Só eu' },
  { id: 'my_team', label: 'Minha equipe' },
  { id: 'whole_company', label: 'Toda a empresa' },
  { id: 'unknown', label: 'Não sei' },
];

function makeAgentMessage(answered: boolean, author: ChatMessage['author'] = 'agent'): ChatMessage {
  return {
    id: 'm1',
    conversationId: CONVERSATION_ID,
    author,
    authorName: null,
    authorLevel: null,
    text: 'Quem está sendo afetado?',
    parts: [
      { type: 'quick_options', question: 'Quem está sendo afetado?', options: OPTIONS, answered },
    ],
    turn: null,
    status: 'complete',
    createdAt: NOW_ISO,
  };
}

describe('QuickReplyResolver', () => {
  const resolver = new QuickReplyResolver();

  it('converte o dígito 2 no rótulo da segunda opção', () => {
    const result = resolver.resolve({ text: '2', options: OPTIONS });
    expect(result).toEqual({ text: 'Minha equipe', option: OPTIONS[1] });
  });

  it('aceita espaços ao redor do dígito', () => {
    expect(resolver.resolve({ text: ' 4 ', options: OPTIONS }).text).toBe('Não sei');
  });

  it('segue como texto quando não há opções abertas', () => {
    expect(resolver.resolve({ text: '2', options: [] })).toEqual({ text: '2', option: null });
  });

  it('segue como texto quando o dígito não corresponde a nenhuma opção', () => {
    expect(resolver.resolve({ text: '9', options: OPTIONS }).option).toBeNull();
    expect(resolver.resolve({ text: '0', options: OPTIONS }).option).toBeNull();
  });

  it('não converte texto livre que contém dígito', () => {
    const result = resolver.resolve({ text: 'opção 2', options: OPTIONS });
    expect(result).toEqual({ text: 'opção 2', option: null });
  });
});

describe('findOpenOptions', () => {
  it('devolve as opções da última mensagem do agent ainda não respondidas', () => {
    expect(findOpenOptions(makeAgentMessage(false))).toEqual(OPTIONS);
  });

  it('não devolve opções já respondidas, de outro autor ou sem mensagem', () => {
    expect(findOpenOptions(makeAgentMessage(true))).toEqual([]);
    expect(findOpenOptions(makeAgentMessage(false, 'employee'))).toEqual([]);
    expect(findOpenOptions(null)).toEqual([]);
  });

  it('devolve vazio quando a mensagem não tem opções rápidas', () => {
    const message: ChatMessage = { ...makeAgentMessage(false), parts: [] };
    expect(findOpenOptions(message)).toEqual([]);
  });
});
