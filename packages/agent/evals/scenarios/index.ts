import type { EvalScenario } from '../types.js';
import { aberturaColetaMinima } from './abertura-coleta-minima.js';
import { chamadoAlheio } from './chamado-alheio.js';
import { chamadoVencido } from './chamado-vencido.js';
import { complementoChamado } from './complemento-chamado.js';
import { criticoEquipe } from './critico-equipe.js';
import { duplicidadeVpn } from './duplicidade-vpn.js';
import { erro809Windows10 } from './erro-809-windows-10.js';
import { erro809Windows11 } from './erro-809-windows-11.js';
import { foraDeEscopoFinanceiro } from './fora-de-escopo-financeiro.js';
import { foraDeEscopoRh } from './fora-de-escopo-rh.js';
import { horarioAtendimento } from './horario-atendimento.js';
import { injecaoInstrucao } from './injecao-instrucao.js';
import { pedidoAmbiguo } from './pedido-ambiguo.js';
import { pedidoAnalista } from './pedido-analista.js';
import { reaberturaForaDoPrazo } from './reabertura-fora-do-prazo.js';
import { reaberturaSap } from './reabertura-sap.js';
import { retomadaVpn } from './retomada-vpn.js';
import { statusSemNumero } from './status-sem-numero.js';

export const evalScenarios: EvalScenario[] = [
  horarioAtendimento,
  erro809Windows10,
  erro809Windows11,
  statusSemNumero,
  chamadoVencido,
  complementoChamado,
  aberturaColetaMinima,
  duplicidadeVpn,
  reaberturaSap,
  reaberturaForaDoPrazo,
  criticoEquipe,
  pedidoAmbiguo,
  pedidoAnalista,
  foraDeEscopoRh,
  foraDeEscopoFinanceiro,
  injecaoInstrucao,
  chamadoAlheio,
  retomadaVpn,
];

export function selectScenarios(ids: string[]): EvalScenario[] {
  if (ids.length === 0) {
    return evalScenarios;
  }
  const unknown = ids.filter((id) => !evalScenarios.some((scenario) => scenario.id === id));
  if (unknown.length > 0) {
    throw new Error(`Cenário desconhecido: ${unknown.join(', ')}`);
  }
  return evalScenarios.filter((scenario) => ids.includes(scenario.id));
}
