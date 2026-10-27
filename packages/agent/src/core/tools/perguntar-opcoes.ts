import { z } from 'zod';
import type { AgentTool } from '../agent-tool.js';
import type { TurnContext } from '../turn-context.js';

const QUESTION_MAX_LENGTH = 300;
const OPTION_MAX_LENGTH = 80;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;
const AWAITING_ANSWER_NOTE =
  'Aguardando a resposta do funcionário. Encerre o turno sem escrever mais nada.';
const ALREADY_ASKED_NOTE =
  'Já existe uma pergunta com opções neste turno. Não faça outra; encerre o turno sem escrever mais nada.';

const inputSchema = z.strictObject({
  question: z.string().trim().min(1).max(QUESTION_MAX_LENGTH),
  options: z
    .array(z.string().trim().min(1).max(OPTION_MAX_LENGTH))
    .min(MIN_OPTIONS)
    .max(MAX_OPTIONS),
});
const outputSchema = z.object({
  question: z.string(),
  optionCount: z.number().int(),
  note: z.string(),
});

export type PerguntarOpcoesInput = z.infer<typeof inputSchema>;
export type PerguntarOpcoesOutput = z.infer<typeof outputSchema>;

function askQuestion(input: PerguntarOpcoesInput, context: TurnContext): PerguntarOpcoesOutput {
  if (context.questionAsked()) {
    return { question: input.question, optionCount: 0, note: ALREADY_ASKED_NOTE };
  }
  const options = input.options.map((label, index) => ({ id: `option-${index + 1}`, label }));
  context.emit({
    type: 'part',
    part: { type: 'quick_options', question: input.question, options, answered: false },
  });
  return { question: input.question, optionCount: options.length, note: AWAITING_ANSWER_NOTE };
}

export function createPerguntarOpcoesTool(): AgentTool<
  PerguntarOpcoesInput,
  PerguntarOpcoesOutput
> {
  return {
    name: 'perguntar_opcoes',
    description:
      'Faz uma pergunta ao funcionário com 2 a 5 opções de resposta rápida, mostradas como botões. Use para coletar um dado que falta (uma pergunta por vez) ou para oferecer um caminho, como falar com um analista. Não use para pedir permissão antes de propor_chamado, propor_complemento ou propor_reabertura, que já pedem a confirmação. A pergunta aparece sozinha: não a repita no texto.',
    stepKind: 'asked_question',
    failureLabel: 'fez uma pergunta',
    inputSchema,
    outputSchema,
    stepLabel: () => 'fez uma pergunta',
    stepResult: (_input, output) => output.question,
    execute: async (input, context) => askQuestion(input, context),
  };
}
