# Tarefa 21.0: `web`: componentes compartilhados de chamado e de decisão do agent

## Visão geral

Cria os componentes usados tanto no chat do funcionário quanto no console do analista: o card de chamado com status, prioridade e prazo vencido, e a linha de passos com o detalhe expansível da decisão do agent (a parte mais importante do desafio).

<skills>
### Conformidade com skills

- `react`: componentes de até 30 linhas, props tipadas a partir de `@nexo/contracts`, shadcn/ui, acessibilidade (`aria-expanded`, status com texto além da cor).
- `testes`: Testing Library e `user-event`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `folder-structure.md`: componentes comuns a dois módulos ficam em `components/`, não num módulo.
- `code-standards.md`: rótulos em pt-BR centralizados em `components/tickets/labels.ts`.
</rules>

<requirements>
- RF7, RF30: `StepsLine` com os passos acima da resposta.
- RF10: `TicketCard` com número, status, título, descrição, categoria, prioridade, abertura, última atualização e "prazo vencido" em texto.
- RF31, RF32, RF33: `DecisionDetails` expansível com entendimento, ação, confiança (percentual e rótulo), motivo, regras e o resultado de cada passo, inclusive falhas e novas tentativas.
- Datas em pt-BR e `America/Sao_Paulo`.
</requirements>

## Subtarefas

- [ ] 21.1 `components/tickets/`: `labels.ts`, `TicketStatusBadge`, `PriorityBadge`, `OverdueLabel` e `TicketCard`.
- [ ] 21.2 `components/agent-turn/`: `StepsLine`, `ConfidenceBadge` e `DecisionDetails`.
- [ ] 21.3 Utilitário de formatação de data e hora em `lib/`.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", item `components/` do frontend.
- TechSpec, "TicketSummary e TicketDetail" e "AgentStep e AgentDecision".
- Protótipo `docs/nexo/nexo.pen`: Telas 2, 3 e 5 (cards, passos e detalhe).

## Critérios de aceitação relacionados

- CA-07
- CA-23
- CA-24

## Testes da tarefa

### Testes de integração

- [ ] TI-24 — expande o detalhe da decisão com entendimento, ação, confiança e motivo.
- [ ] `TicketCard` mostra "prazo vencido" em texto quando `overdue`.

## Arquivos relevantes

- `apps/web/src/components/{tickets,agent-turn}/**` (novos)
- `apps/web/src/lib/`
