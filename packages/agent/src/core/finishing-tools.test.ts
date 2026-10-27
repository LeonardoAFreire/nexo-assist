import { describe, expect, it } from 'vitest';
import { InMemoryKnowledgeApi } from '../persistence/scripted/in-memory-knowledge-api.js';
import { InMemoryTicketsApi } from '../persistence/scripted/in-memory-tickets-api.js';
import { FINISHING_TOOLS } from './finishing-tools.js';
import { createToolRegistry } from './tool-registry.js';

describe('tools finalizadoras por intenção', () => {
  it('só cita tools que existem no registro', () => {
    const registry = createToolRegistry({
      tickets: new InMemoryTicketsApi([]),
      knowledge: new InMemoryKnowledgeApi([]),
    });
    const known = registry.map((tool) => tool.name);
    for (const names of Object.values(FINISHING_TOOLS)) {
      expect(names.every((name) => known.includes(name))).toBe(true);
    }
  });

  it('exige uma proposta, pergunta ou transferência antes de encerrar a abertura', () => {
    expect(FINISHING_TOOLS.ticket_open).toEqual(
      expect.arrayContaining(['propor_chamado', 'perguntar_opcoes', 'transferir_para_analista']),
    );
    expect(FINISHING_TOOLS.ticket_complement).toContain('propor_complemento');
  });

  it('exige apresentar o chamado ou a lista na consulta de status, não só buscar', () => {
    expect(FINISHING_TOOLS.ticket_status).toEqual(
      expect.arrayContaining(['mostrar_chamado', 'mostrar_selecao']),
    );
    expect(FINISHING_TOOLS.ticket_status).not.toContain('buscar_chamados');
  });
});
