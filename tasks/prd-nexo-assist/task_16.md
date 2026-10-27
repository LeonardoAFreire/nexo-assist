# Tarefa 16.0: `chat/core`: transferência, console e `SendEmployeeMessage`

## Visão geral

Completa o `core` do `chat`: a transferência para o analista com publicação do evento, as ações do analista (assumir, devolver, encerrar, responder), o acesso do analista aos chamados do funcionário, as consultas do console, o hub de eventos para o SSE e o caso de uso central, `SendEmployeeMessage`, que roteia cada mensagem do funcionário.

<skills>
### Conformidade com skills

- `arquitetura-modular`: evento `chat.conversation.handed-off` publicado pelo `chat`; `AGENT_API`, `TICKETS_API` e `IDENTITY_API` consumidos pelos contratos.
- `agent-llm`: resumo da transferência por botão montado pelo código a partir das decisões; agent pausado nos estados do analista.
- `testes`: fakes de `AgentApi`, `TicketsApi` e `IdentityApi`; repositórios em memória.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: o analista só vê chamados de outro funcionário com papel explícito e em conversa transferida a ele (`AnalystTicketAccess`).
- `code-standards.md`: funções de até 30 linhas; o roteamento de `SendEmployeeMessage` dividido em funções pequenas.
</rules>

<requirements>
- RF14, RF16: timeline com as últimas 100 mensagens e o estado mais recente das ações pendentes; após encerrada, a próxima mensagem abre uma nova conversa.
- RF15: em `waiting_analyst` e `with_analyst`, a mensagem vai para o console e o turno termina com `turn.skipped`.
- RF41, RF42: transferência com resumo, motivo, chamados e confiança; mensagem de sistema com nível e prazo.
- RF45, RF46: status derivado, filtros, contadores (ignoram `filter`, respeitam `q`), busca por nome sem acento ou por número, ordenação.
- RF48, RF51: assumir condicional (`conversation_already_claimed` com o nome de quem assumiu); responder exige ter assumido.
- `SendEmployeeMessage`: limite, trava de turno (`turn_in_progress`), confirmação e cancelamento por texto sem modelo, opção rápida, seleção de chamado, chamada ao `AgentApi`, `proposal` → ação pendente, `handoff-requested` → transferência, gravação da mensagem do agent com `turn`, retry do turno com falha.
- `ConversationEventsHub` com `Subject` RxJS em memória.
</requirements>

## Subtarefas

- [ ] 16.1 `HandOffConversation` e publicação do evento.
- [ ] 16.2 `ClaimConversation`, `ReleaseConversation`, `CloseConversation` e `SendAnalystMessage`.
- [ ] 16.3 `AnalystTicketAccess` e `ConsoleQueries`.
- [ ] 16.4 `ConversationEventsHub`.
- [ ] 16.5 `SendEmployeeMessage`, retry do turno e montagem de `EmployeeConversationView`.

## Detalhes de implementação

- TechSpec, "Domínio `chat`".
- TechSpec, "Fluxo de uma mensagem do funcionário (estado `agent`)".
- TechSpec, "EmployeeConversationView", "ConsoleConversationItem e ConsoleList" e "ChatStreamEvent".
- TechSpec, "`GET /api/console/conversations`" (ordenação e filtros) e "`POST /api/conversations/current/handoff`" (resumo por botão).

## Critérios de aceitação relacionados

- CA-17
- CA-19
- CA-20
- CA-29
- CA-32
- CA-33
- CA-34
- CA-36

## Testes da tarefa

### Testes de unidade

- [ ] TU-13 — recusa assumir conversa já assumida por outro analista.
- [ ] `SendEmployeeMessage`: "sim" com ação pendente confirma sem chamar o agent; conversa com analista termina em `turn.skipped` sem chamar o agent; `handoff-requested` muda o estado e publica o evento; turno concorrente recebe `turn_in_progress`.
- [ ] `ConsoleQueries`: status derivado ("agent pediu ajuda" com a confiança), filtros e contadores.

## Arquivos relevantes

- `packages/chat/src/core/**`
