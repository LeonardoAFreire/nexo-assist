import { describe, expect, it } from 'vitest';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createPerguntarOpcoesTool } from './perguntar-opcoes.js';

describe('perguntar_opcoes', () => {
  it('emite as opções rápidas numeradas, ainda sem resposta', async () => {
    const { context, events } = makeTurnContext();
    const input = { question: 'Quem é afetado?', options: ['Só eu', 'Minha equipe'] };
    const output = await createPerguntarOpcoesTool().execute(input, context);
    expect(output).toMatchObject({ question: 'Quem é afetado?', optionCount: 2 });
    expect(output.note).toContain('Aguardando a resposta do funcionário');
    expect(events).toEqual([
      {
        type: 'part',
        part: {
          type: 'quick_options',
          question: 'Quem é afetado?',
          options: [
            { id: 'option-1', label: 'Só eu' },
            { id: 'option-2', label: 'Minha equipe' },
          ],
          answered: false,
        },
      },
    ]);
  });

  it('ignora a segunda pergunta do mesmo turno, sem repetir os botões', async () => {
    const { context, events } = makeTurnContext();
    const tool = createPerguntarOpcoesTool();
    const input = { question: 'Quem é afetado?', options: ['Só eu', 'Minha equipe'] };
    await tool.execute(input, context);
    const repeated = await tool.execute(input, context);
    expect(events).toHaveLength(1);
    expect(repeated).toMatchObject({ optionCount: 0, status: 'refused' });
    expect(repeated.note).toContain('Já existe uma pergunta');
  });

  it('aceita de 2 a 5 opções', () => {
    const { inputSchema } = createPerguntarOpcoesTool();
    const withOptions = (count: number) => ({
      question: 'Qual?',
      options: Array.from({ length: count }, (_, index) => `Opção ${index + 1}`),
    });
    expect(inputSchema.safeParse(withOptions(1)).success).toBe(false);
    expect(inputSchema.safeParse(withOptions(2)).success).toBe(true);
    expect(inputSchema.safeParse(withOptions(5)).success).toBe(true);
    expect(inputSchema.safeParse(withOptions(6)).success).toBe(false);
  });

  it('usa a pergunta como resultado do passo', () => {
    const tool = createPerguntarOpcoesTool();
    const input = { question: 'Quem é afetado?', options: ['a', 'b'] };
    expect(
      tool.stepResult(input, {
        status: 'asked',
        question: input.question,
        optionCount: 2,
        note: '',
      }),
    ).toBe('Quem é afetado?');
  });
});
