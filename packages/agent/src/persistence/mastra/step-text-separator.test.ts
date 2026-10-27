import { describe, expect, it } from 'vitest';
import { readResponseStream, type StreamGuards } from './response-stream.js';
import { StepTextSeparator } from './step-text-separator.js';

const NEVER = new Promise<never>(() => undefined);
const GUARDS = {
  turn: { expired: NEVER, cancel: () => undefined },
  first: { expired: NEVER, cancel: () => undefined },
  bridge: { fatal: null },
  progress: { started: false },
  callerSignal: new AbortController().signal,
} as unknown as StreamGuards;

function textChunk(text: string): unknown {
  return { type: 'text-delta', payload: { text } };
}

async function* chunks(...items: unknown[]): AsyncGenerator<unknown> {
  yield* items;
}

async function deltasOf(...items: unknown[]): Promise<string[]> {
  const deltas: string[] = [];
  for await (const event of readResponseStream(chunks(...items), GUARDS)) {
    if (event.type === 'text-delta') {
      deltas.push(event.delta);
    }
  }
  return deltas;
}

describe('StepTextSeparator', () => {
  it('separa o texto que vem depois de uma tool do texto anterior', () => {
    const separator = new StepTextSeparator();
    expect(separator.apply('Quer falar com um analista?')).toBe('Quer falar com um analista?');
    separator.noteToolCall();
    expect(separator.apply('Aguardo sua resposta.')).toBe('\n\nAguardo sua resposta.');
    expect(separator.apply(' Obrigada.')).toBe(' Obrigada.');
  });

  it('não começa a resposta com quebra quando a tool vem antes de qualquer texto', () => {
    const separator = new StepTextSeparator();
    separator.noteToolCall();
    expect(separator.apply('Seu chamado está vencido.')).toBe('Seu chamado está vencido.');
  });
});

describe('readResponseStream', () => {
  it('emite uma quebra de parágrafo entre o texto de antes e o de depois da tool', async () => {
    const deltas = await deltasOf(
      textChunk('Gostaria de falar com um analista?'),
      { type: 'tool-call', payload: {} },
      textChunk('Aguardo sua resposta.'),
    );
    expect(deltas.join('')).toBe('Gostaria de falar com um analista?\n\nAguardo sua resposta.');
  });

  it('descarta o espaço em branco que o modelo emite sozinho antes e entre as tools', async () => {
    const deltas = await deltasOf(
      textChunk('Vou verificar na central de ajuda.'),
      { type: 'tool-call', payload: {} },
      textChunk('\n\n'),
      { type: 'tool-call', payload: {} },
      textChunk('\n\nO service desk atende'),
      textChunk(' das 8h às 18h.'),
    );
    expect(deltas.join('')).toBe(
      'Vou verificar na central de ajuda.\n\nO service desk atende das 8h às 18h.',
    );
  });

  it('não começa a resposta com espaço em branco emitido antes da primeira tool', async () => {
    const deltas = await deltasOf(
      textChunk('\n\n'),
      { type: 'tool-call', payload: {} },
      textChunk('\n\nO service desk atende'),
    );
    expect(deltas.join('')).toBe('O service desk atende');
  });

  it('não soma a quebra do separador à que o próprio modelo deixou no fim do texto', async () => {
    const deltas = await deltasOf(
      textChunk('Vou verificar se há chamado.\n\n'),
      { type: 'tool-call', payload: {} },
      textChunk('Encontrei seu problema.'),
    );
    expect(deltas.join('')).toBe('Vou verificar se há chamado.\n\nEncontrei seu problema.');
  });

  it('preserva o espaço entre palavras e as quebras do próprio texto', async () => {
    const deltas = await deltasOf(textChunk('Olá'), textChunk(' '), textChunk('Ana.\n\nTudo bem?'));
    expect(deltas.join('')).toBe('Olá Ana.\n\nTudo bem?');
  });
});
