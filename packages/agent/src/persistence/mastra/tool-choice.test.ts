import { describe, expect, it } from 'vitest';
import { chooseToolChoice } from './tool-choice.js';

const FINISHING = ['propor_complemento', 'perguntar_opcoes'];

function stepWith(...names: string[]) {
  return { toolCalls: names.map((toolName) => ({ toolName })) };
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
    const cited = { toolResults: [{ toolName: 'citar_artigo', output: { applies: true } }] };
    expect(chooseToolChoice(FINISHING, [cited])).toBe('auto');
  });

  it('continua exigindo quando o artigo citado não se aplica ao caso', () => {
    const cited = { toolResults: [{ toolName: 'citar_artigo', output: { applies: false } }] };
    expect(chooseToolChoice(FINISHING, [cited])).toBe('required');
  });

  it('aceita passos sem chamadas de tool', () => {
    expect(chooseToolChoice(FINISHING, [{}, stepWith('perguntar_opcoes')])).toBe('auto');
  });
});
