import type { Understanding } from '@nexo/contracts';

type Intent = Understanding['intent'];

const ASK_OR_HAND_OFF = ['perguntar_opcoes', 'transferir_para_analista'];

export const FINISHING_TOOLS: Partial<Record<Intent, string[]>> = {
  question: ['buscar_central', ...ASK_OR_HAND_OFF],
  ticket_status: ['buscar_chamados', 'consultar_chamado', ...ASK_OR_HAND_OFF],
  ticket_complement: [
    'propor_complemento',
    'propor_reabertura',
    'propor_chamado',
    ...ASK_OR_HAND_OFF,
  ],
  ticket_open: ['propor_chamado', 'propor_complemento', 'propor_reabertura', ...ASK_OR_HAND_OFF],
};
