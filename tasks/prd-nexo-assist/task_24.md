# Tarefa 24.0: `web`: console do analista

## Visão geral

Implementa o console em três colunas: a lista de conversas com filtros, contadores e busca, atualizada em tempo real; a conversa com o resumo da transferência, o detalhe das decisões do agent e a barra de atendimento (assumir, devolver, encerrar); e o painel de chamados do funcionário.

<skills>
### Conformidade com skills

- `react`: hooks de dados com React Query e chaves por módulo; mutações com invalidação; SSE em `useEffect` atualizando o cache; navegação por teclado na lista; `role="alert"` nos erros.
- `testes`: MSW com handlers HTTP e `sse`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `folder-structure.md`: o módulo `console` não importa o módulo `chat`; reaproveita `components/agent-turn` e `components/tickets`.
- `security-privacy.md`: campo de resposta só após assumir (a regra também está no backend).
</rules>

<requirements>
- RF33, RF47: histórico com mensagens do funcionário, do agent (com `DecisionDetails`), do analista e eventos com horário.
- RF45, RF46: lista com nome, horário, última mensagem, não lidas e status; filtros Todas, Para você, Com o agent e Minhas, com contadores; busca por nome ou número.
- RF48, RF51: "Assumir atendimento", "Devolver ao agent" e "Encerrar atendimento"; 409 vira mensagem clara.
- RF49: painel "Chamados do funcionário" com os da conversa e os outros (abertos e encerrados) e erro com "Tentar novamente".
- RF50: lista e conversa aberta atualizadas sem recarregar.
- Console otimizado para desktop.
</requirements>

## Subtarefas

- [x] 24.1 `api/` e hooks de consulta: `useConsoleConversations`, `useConsoleConversation` e `useEmployeeTickets`.
- [x] 24.2 `useConsoleEvents` (SSE do console).
- [x] 24.3 Lista: `ConversationFilters`, `ConversationSearch`, `ConversationList` e `ConversationListItem`.
- [x] 24.4 Conversa: `ConsoleThread`, `HandoffSummary`, `AttendanceBar`, `AnalystComposer` e as mutações `useClaim`, `useRelease`, `useClose`, `useAnalystMessage` (e marcar como lida).
- [x] 24.5 `EmployeeTicketsPanel` e `ConsolePage` nas rotas `/console` e `/console/:conversationId`.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", item `modules/console` do frontend.
- TechSpec, "ConsoleConversationItem e ConsoleList", "ConsoleStreamEvent" e as rotas `/api/console/*`.
- Protótipo `docs/nexo/nexo.pen`: Telas 4 e 5.

## Critérios de aceitação relacionados

- CA-19
- CA-29
- CA-31
- CA-32
- CA-33
- CA-34
- CA-36

## Testes da tarefa

### Testes de integração

- [x] TI-28 — filtra o console, assume, responde, devolve e mostra a recusa de assumir.
- [x] TI-29 — atualiza a lista do console ao receber evento SSE.

## Arquivos relevantes

- `apps/web/src/modules/console/**`
