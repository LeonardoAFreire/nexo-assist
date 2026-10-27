import { describe, expect, it } from 'vitest';
import { messagePartSchema } from './message-part.js';

describe('messagePartSchema', () => {
  it('discrimina cada variante pelo type', () => {
    const quickOptions = messagePartSchema.parse({
      type: 'quick_options',
      question: 'Quem é afetado?',
      options: [{ id: 'only_me', label: 'Só eu' }],
      answered: false,
    });
    const citation = messagePartSchema.parse({
      type: 'article_citation',
      articleId: 'vpn-erro-809',
      title: 'VPN com erro 809',
      applies: false,
      reason: 'vale só para Windows 10',
    });
    const event = messagePartSchema.parse({
      type: 'event',
      kind: 'claimed',
      label: 'Rafael Lima assumiu',
      actorName: 'Rafael Lima',
    });
    expect([quickOptions.type, citation.type, event.type]).toEqual([
      'quick_options',
      'article_citation',
      'event',
    ]);
  });

  it('recusa type desconhecido', () => {
    expect(messagePartSchema.safeParse({ type: 'video', url: 'x' }).success).toBe(false);
  });

  it('recusa campos de outra variante', () => {
    const result = messagePartSchema.safeParse({
      type: 'ticket_selection',
      question: 'Qual?',
      options: [],
    });
    expect(result.success).toBe(false);
  });
});
