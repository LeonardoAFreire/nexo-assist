import type { ConsultarChamadoOutput } from '../../core/tools/consultar-chamado.js';
import type { Scenario } from './scenario.js';
import { understandingOf } from './scenario-understanding.js';

export const ticketLookupScenario: Scenario = {
  name: 'consulta-de-chamado',
  trigger: /\b((?:INC|REQ)-\d{5})\b/i,
  understanding: understandingOf({
    intent: 'ticket_status',
    summary: 'Funcionário pergunta sobre um chamado pelo número',
  }),
  async reply(run) {
    const number = (run.match[1] ?? '').toUpperCase();
    const lookup = (await run.callTool('consultar_chamado', { number })) as ConsultarChamadoOutput;
    if (lookup.status === 'not_found') {
      return `Não encontrei o chamado ${number} entre os seus chamados. Confira o número e tente de novo.`;
    }
    await run.callTool('mostrar_chamado', { number });
    return `Aqui está o chamado ${number}.`;
  },
};
