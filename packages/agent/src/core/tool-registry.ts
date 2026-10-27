import type { KnowledgeApi, TicketsApi } from '@nexo/contracts';
import type { AgentTool } from './agent-tool.js';
import { createBuscarCentralTool } from './tools/buscar-central.js';
import { createBuscarChamadosTool } from './tools/buscar-chamados.js';
import { createCitarArtigoTool } from './tools/citar-artigo.js';
import { createClassificarPrioridadeTool } from './tools/classificar-prioridade.js';
import { createConsultarChamadoTool } from './tools/consultar-chamado.js';
import { createMostrarChamadoTool } from './tools/mostrar-chamado.js';
import { createMostrarSelecaoTool } from './tools/mostrar-selecao.js';
import { createPerguntarOpcoesTool } from './tools/perguntar-opcoes.js';
import { createProporChamadoTool } from './tools/propor-chamado.js';
import { createProporComplementoTool } from './tools/propor-complemento.js';
import { createProporReaberturaTool } from './tools/propor-reabertura.js';
import { createTransferirParaAnalistaTool } from './tools/transferir-para-analista.js';

export type ToolRegistryDeps = {
  tickets: TicketsApi;
  knowledge: KnowledgeApi;
};

export function createToolRegistry(deps: ToolRegistryDeps): AgentTool[] {
  const { tickets, knowledge } = deps;
  return [
    createBuscarChamadosTool({ tickets }),
    createConsultarChamadoTool({ tickets }),
    createBuscarCentralTool({ knowledge }),
    createCitarArtigoTool(),
    createClassificarPrioridadeTool({ tickets }),
    createProporChamadoTool({ tickets }),
    createProporComplementoTool({ tickets }),
    createProporReaberturaTool({ tickets }),
    createPerguntarOpcoesTool(),
    createMostrarSelecaoTool({ tickets }),
    createMostrarChamadoTool({ tickets }),
    createTransferirParaAnalistaTool(),
  ];
}
