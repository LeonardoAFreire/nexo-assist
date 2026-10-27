# Tarefa 18.0: `chat/http` do funcionário: mensagens por SSE, retry e ações pendentes

## Visão geral

Expõe ao funcionário a conversa atual, o envio de mensagem com a resposta em streaming SSE, o retry do turno com falha e as ações sobre o rascunho (editar, confirmar, cancelar), com rate limit por usuário. É a primeira integração ponta a ponta do backend com o modelo falso.

<skills>
### Conformidade com skills

- `nestjs`: controllers finos, `ZodValidationPipe`, `@nestjs/throttler` rastreado pelo `userId` da sessão, `SseResponse` com `@Res()` (desvio documentado), `AbortSignal` ao desconectar.
- `testes`: Nest real com `Test.createTestingModule`, PGlite, `supertest`, cookie real; único dublê é o `LLM_CLIENT` (`ScriptedLlmClient`) e, nos casos de falha, o simulador `forced`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: `requesterId` só da sessão; `z.strictObject` nos corpos; rate limit por usuário nos endpoints de chat; erros sem detalhes do provedor; `OriginGuard` nas rotas que escrevem.
- `folder-structure.md`: sem regra de negócio no `http`.
</rules>

<requirements>
- RF6, RF17: resposta incremental por SSE; erros anteriores ao aceite em JSON; `turn.failed` com `retryable` depois do aceite.
- RF11, RF12, RF24: `PATCH`, `confirm` (`via: button | shortcut`) e `cancel`; confirmar de novo não duplica.
- RF13, RF54: 429 `message_limit_reached` e `rate_limited` sem chamar o modelo; `budget_exhausted` antes do aceite.
- RF29: `tickets_unavailable` na confirmação mantém a ação `pending`; turno degradado com passo `failed`.
- `GET /api/conversations/current`, `POST …/messages`, `POST …/turns/retry`, `PATCH|POST …/pending-actions/:actionId[/confirm|/cancel]`.
</requirements>

## Subtarefas

- [ ] 18.1 `EmployeeConversationController`: `current`, `messages` e `turns/retry`.
- [ ] 18.2 `PendingActionsController`: editar, confirmar e cancelar.
- [ ] 18.3 Throttler por usuário no `monolith.module.ts` e nos endpoints de chat.
- [ ] 18.4 Montar o módulo de teste de integração compartilhado (identity, tickets, agent com fake, chat sobre PGlite).

## Detalhes de implementação

- TechSpec, "Endpoints da API": "`GET /api/conversations/current`", "`POST /api/conversations/current/messages`" (com os exemplos SSE), "`POST /api/conversations/current/turns/retry`" e as três rotas de ações pendentes.
- TechSpec, "Abordagem de testes", testes de integração do backend.

## Critérios de aceitação relacionados

- CA-02
- CA-12
- CA-13
- CA-14
- CA-23
- CA-25
- CA-28
- CA-35
- CA-37
- CA-39

## Testes da tarefa

### Testes de integração

- [ ] TI-04 — rejeita identificador de outro usuário no corpo e mantém os dados da sessão.
- [ ] TI-05 — entrega o turno por SSE na ordem aceite → passos → texto → concluído e grava o turno.
- [ ] TI-06 — cria o chamado na confirmação com os seis campos e número definitivo.
- [ ] TI-07 — confirma por frase afirmativa e não grava com outra resposta ou cancelamento.
- [ ] TI-08 — recalcula a prioridade ao editar o rascunho.
- [ ] TI-15 — recusa a 31ª mensagem e o excesso por minuto sem chamar o modelo.
- [ ] TI-16 — conclui a ação após indisponibilidade curta e degrada quando persiste.

## Arquivos relevantes

- `packages/chat/src/http/{employee-conversation,pending-actions}.controller.ts` (novos)
- `packages/chat/src/http/*.integration.test.ts` e o helper de módulo de teste
- `apps/monolith/src/monolith.module.ts`
