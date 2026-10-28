import { describe, expect, it } from 'vitest';
import { sendMessageRequestSchema } from './send-message-request.js';

const MESSAGE_ID = '0b9e5a1c-2d3f-4a6b-8c7d-9e0f1a2b3c4d';

describe('sendMessageRequestSchema', () => {
  it('aceita o exemplo da TechSpec e preenche os padrões', () => {
    const result = sendMessageRequestSchema.parse({ text: 'Qual o status do meu chamado?' });
    expect(result).toEqual({
      clientMessageId: null,
      text: 'Qual o status do meu chamado?',
      quickReply: null,
      ticketSelection: null,
    });
  });

  it('aceita o id gerado pelo cliente e recusa id fora do formato uuid', () => {
    const accepted = sendMessageRequestSchema.parse({ clientMessageId: MESSAGE_ID, text: 'oi' });
    expect(accepted.clientMessageId).toBe(MESSAGE_ID);
    const invalid = sendMessageRequestSchema.safeParse({ clientMessageId: 'abc', text: 'oi' });
    expect(invalid.success).toBe(false);
  });

  it('recusa requesterId enviado no corpo', () => {
    const result = sendMessageRequestSchema.safeParse({ text: 'oi', requesterId: 'outro' });
    expect(result.success).toBe(false);
  });

  it('recusa campos extras dentro da opção rápida', () => {
    const quickReply = { messageId: MESSAGE_ID, optionId: '2', requesterId: 'outro' };
    expect(sendMessageRequestSchema.safeParse({ text: 'Só eu', quickReply }).success).toBe(false);
  });

  it('aceita opção rápida e seleção de chamado válidas', () => {
    const result = sendMessageRequestSchema.safeParse({
      text: 'INC-20311',
      quickReply: { messageId: MESSAGE_ID, optionId: '1' },
      ticketSelection: { messageId: MESSAGE_ID, number: 'INC-20311' },
    });
    expect(result.success).toBe(true);
  });

  it('remove espaços das pontas e recusa texto vazio ou acima de 2.000 caracteres', () => {
    expect(sendMessageRequestSchema.parse({ text: '  oi  ' }).text).toBe('oi');
    expect(sendMessageRequestSchema.safeParse({ text: '   ' }).success).toBe(false);
    expect(sendMessageRequestSchema.safeParse({ text: 'a'.repeat(2001) }).success).toBe(false);
    expect(sendMessageRequestSchema.safeParse({ text: 'a'.repeat(2000) }).success).toBe(true);
  });
});
