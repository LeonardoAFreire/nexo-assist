import { describe, expect, it } from 'vitest';
import { chooseToolChoice } from './tool-choice.js';

const FINISHING = ['propor_complemento', 'perguntar_opcoes'];

function stepWith(...names: string[]) {
  return { toolCalls: names.map((toolName) => ({ toolName })) };
}

function completedStep(toolName: string, value: unknown) {
  const output = { type: 'json', value };
  return { toolCalls: [{ toolName }], toolResults: [{ toolName, output }] };
}

describe('chooseToolChoice', () => {
  it('exige tool no primeiro passo', () => {
    expect(chooseToolChoice(FINISHING, [])).toBe('required');
  });

  it('continua exigindo depois de uma tool que só consulta', () => {
    expect(chooseToolChoice(FINISHING, [stepWith('buscar_chamados')])).toBe('required');
  });

  it('libera o texto depois que uma tool finalizadora foi chamada', () => {
    const steps = [stepWith('buscar_chamados'), stepWith('propor_complemento')];
    expect(chooseToolChoice(FINISHING, steps)).toBe('auto');
  });

  it('não exige nada quando a intenção não tem tool finalizadora', () => {
    expect(chooseToolChoice([], [])).toBe('auto');
  });

  it('para de exigir tool depois de alguns passos para não girar até o limite', () => {
    const steps = [
      stepWith('buscar_chamados'),
      stepWith('consultar_chamado'),
      stepWith('consultar_chamado'),
    ];
    expect(chooseToolChoice(FINISHING, steps)).toBe('auto');
  });

  it('libera o texto quando o artigo citado se aplica ao caso', () => {
    const cited = completedStep('citar_artigo', { applies: true });
    expect(chooseToolChoice(FINISHING, [cited])).toBe('auto');
  });

  it('continua exigindo quando o artigo citado não se aplica ao caso', () => {
    const cited = completedStep('citar_artigo', { applies: false });
    expect(chooseToolChoice(FINISHING, [cited])).toBe('required');
  });

  it('continua exigindo quando a proposta foi recusada por uma regra do service desk', () => {
    for (const status of ['rule_violated', 'duplicate_found', 'not_found']) {
      const step = completedStep('propor_complemento', { status });
      expect(chooseToolChoice(FINISHING, [step])).toBe('required');
    }
  });

  it('libera o texto quando a proposta foi aceita', () => {
    const step = completedStep('propor_complemento', { status: 'proposed' });
    expect(chooseToolChoice(FINISHING, [step])).toBe('auto');
  });

  it('aceita passos sem chamadas de tool', () => {
    expect(chooseToolChoice(FINISHING, [{}, stepWith('perguntar_opcoes')])).toBe('auto');
  });
});
