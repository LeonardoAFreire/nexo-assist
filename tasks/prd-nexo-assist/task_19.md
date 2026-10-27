# Tarefa 19.0: `chat/http`: transferência, console do analista e SSE de atualização

## Visão geral

Expõe a transferência por botão, o SSE de atualização do funcionário e todo o console do analista: lista com filtros, detalhe da conversa, painel de chamados, assumir, devolver, encerrar, responder, marcar como lida e o SSE do console.

<skills>
### Conformidade com skills

- `nestjs`: `@Sse()` com `Observable` do hub, heartbeat de 25 s, controllers finos por recurso, `@Roles('analyst')`.
- `arquitetura-modular`: integração do evento `chat.conversation.handed-off` com o listener do `tickets`.
- `testes`: integração com Nest real, PGlite e `ScriptedLlmClient`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: analista acessa chamados de outro funcionário só por papel e em conversa transferida a ele; o canal SSE do funcionário só recebe eventos das conversas dele; funcionário recebe 403 em `/api/console/*`.
- `code-standards.md`: um controller por recurso para caber em 100 linhas.
</rules>

<requirements>
- RF15, RF41, RF42, RF44: `POST /api/conversations/current/handoff` com resumo montado pelo código e registro no histórico do chamado.
- RF45, RF46, RF47, RF49: lista com filtros, contadores e busca; detalhe com `turn` completo; painel `fromConversation` e `others`.
- RF48, RF51: `claim`, `release`, `close` e `messages`, com 409 nos casos previstos; `read` zera `unreadCount`.
- RF50: `GET /api/conversations/current/events` e `GET /api/console/events` com `conversation.updated`, `message.created` e `console.item.updated`.
</requirements>

## Subtarefas

- [x] 19.1 Rota `handoff` e SSE do funcionário (`ConversationStreamController`).
- [x] 19.2 `ConsoleController`: lista, detalhe, painel de chamados e `read`.
- [x] 19.3 Ações do analista: `claim`, `release`, `close` e `messages`.
- [x] 19.4 SSE do console.

## Detalhes de implementação

- TechSpec, "Endpoints da API": "`POST /api/conversations/current/handoff`", "`GET /api/conversations/current/events` · `GET /api/console/events`" e todas as rotas `/api/console/*`.
- TechSpec, "ConversationStreamEvent e ConsoleStreamEvent".

## Critérios de aceitação relacionados

- CA-17
- CA-20
- CA-29
- CA-30
- CA-31
- CA-32
- CA-33
- CA-34
- CA-36

## Testes da tarefa

### Testes de integração

- [x] TI-09 — transfere a pedido, publica o evento e registra no histórico do chamado.
- [x] TI-10 — não chama o agent e entrega ao console a mensagem enviada durante a transferência.
- [x] TI-11 — assume, devolve e encerra a conversa e recusa a segunda tentativa de assumir.
- [x] TI-12 — filtra e busca no console com contadores coerentes.
- [x] TI-13 — libera os chamados do funcionário só para conversa transferida e bloqueia funcionário no console.
- [x] TI-17 — publica no SSE do console nova mensagem e mudança de estado.

## Arquivos relevantes

- `packages/chat/src/http/{conversation-stream,console,console-actions}.controller.ts` (novos)
- `packages/chat/src/http/*.integration.test.ts`
