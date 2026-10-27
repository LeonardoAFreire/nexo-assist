# Especificação técnica

PRD: [`tasks/prd-nexo-assist/prd.md`](prd.md). Requisitos (`RF*`), critérios de aceitação (`CA-*`) e objetivos estão lá e não se repetem aqui. Os itens marcados com **[premissa]** foram decididos nesta especificação e podem ser revistos.

## Resumo

O Nexo Assist é um monólito modular NestJS com cinco domínios (`identity`, `knowledge`, `tickets`, `chat` e `agent`), um frontend React e um Postgres com um schema por domínio, acessado por Drizzle. O `chat` orquestra a conversa: grava a mensagem do funcionário, decide no código se a mensagem vai para o agent, para o analista ou para uma ação determinística (confirmação de rascunho, opção rápida) e repassa ao cliente, por SSE, os eventos do turno. O `agent` encapsula o Mastra e o OpenRouter atrás da porta `LlmClient` e trabalha em duas etapas: um **classificador** (modelo pequeno, saída estruturada) registra o entendimento (intenção, dados extraídos, confiança e motivo) e uma **política de turno no código** decide a rota (transferir, redirecionar ou responder). Em seguida, um **laço de resposta** limitado a 6 passos, com tools validadas por zod, conversa com o funcionário. O modelo nunca escreve no sistema de chamados. As tools de escrita só produzem **propostas** (rascunho, complemento, reabertura), que o `chat` grava como ação pendente. O chamado é criado ou alterado só quando a confirmação chega pelo botão, pelo atalho ou por uma frase afirmativa reconhecida no código.

As regras do service desk (matriz de prioridade, prazos em horas úteis, vencimento, janela de reabertura de 7 dias, deduplicação, privacidade) ficam no `core` do domínio `tickets` e são cobertas por testes unitários. Os passos exibidos acima de cada resposta são gravados por um decorador que envolve a execução real de cada tool, e não pelo texto do modelo. O sistema de chamados é tratado como legado: tem um injetor de falhas configurável, e quem o consome usa timeout, nova tentativa com espera e uma resposta degradada definida no código. A comunicação entre domínios usa interfaces com token em `@nexo/contracts` e um evento de transferência. Nenhum domínio importa outro.

## Arquitetura do sistema

### Visão dos componentes

```text
apps/web ──HTTP/SSE──▶ apps/monolith (/api)
                          │
   identity ◀── IDENTITY_API ── chat ── AGENT_API ──▶ agent ── TICKETS_API ──▶ tickets
                                  │                     └──── KNOWLEDGE_API ─▶ knowledge
                                  ├── TICKETS_API (confirmação, painel do console)
                                  └── evento chat.conversation.handed-off ──▶ tickets (histórico)
   shared: config · logger · database · events · http · auth · resilience
   contracts: tipos, schemas zod, tokens, eventos, erros
```

**Infraestrutura (`packages/shared`)**, novos subpaths e alterações:

- `database` (modificado): `DatabaseModule` global com o token `DATABASE`, uma instância Drizzle sobre `pg.Pool`, encerrada em `onApplicationShutdown`. `runMigrations({ folder, schema })` aplica as migrations de um domínio. O subpath `database/testing` cria um banco PGlite em memória para os testes de integração.
- `auth` (novo): `SessionTokenService` (assina e verifica JWT com `jose` e `JWT_SECRET`), `SessionGuard` (lê o cookie `nexo_session`), `@CurrentSession()`, `@Roles('employee' | 'analyst')` e `OriginGuard` (confere `Origin` contra `WEB_ORIGIN` nas rotas que escrevem). É infraestrutura: não decide quem pode entrar.
- `resilience` (novo): `withResilience(operation, policy)`, com timeout por tentativa, tentativas limitadas, espera exponencial e a callback `onAttemptFailed` (usada para registrar novas tentativas nos passos).
- `http` (modificado): o `ApiExceptionFilter` passa a respeitar o `code` de `ApiHttpException` (inclusive 503 com código próprio, como `tickets_unavailable`); `ZodValidationPipe` devolve o código `validation_error`; `SseResponse` escreve eventos SSE numa `Response` do Express (cabeçalhos, `event:`/`data:`, heartbeat e fechamento quando o cliente desconecta).

**Contratos (`packages/contracts`)**: schemas zod e tipos de todos os modelos da seção [Modelos de dados](#modelos-de-dados), os tokens `IDENTITY_API`, `KNOWLEDGE_API`, `TICKETS_API` e `AGENT_API` com suas interfaces, o evento `chat.conversation.handed-off`, os erros de fronteira (`TicketsUnavailableError`, `TicketNotFoundError`, `TicketRuleViolationError`) e `DEMO_PEOPLE` (ids, nomes, e-mails e papéis dos dados de exemplo, usados pelas seeds de cada domínio).

**Domínio `identity`**:

- `core/`: `LoginUseCase` (e-mail conhecido e senha não vazia criam uma sessão com `sid` novo; e-mail desconhecido gera um erro genérico), `UserProfile` e `IdentityService` (implementa `IdentityApi.findProfiles`).
- `persistence/`: `identity.users` e a seed dos funcionários e analistas.
- `http/`: `AuthController` (`login`, `logout`, `me`).

**Domínio `knowledge`**:

- `core/`: `SearchArticles` e `KnowledgeService` (`KnowledgeApi`).
- `persistence/`: `knowledge.articles`, com busca textual do Postgres (`to_tsvector('portuguese', …)` e `websearch_to_tsquery`), e a seed de 8 artigos.

**Domínio `tickets`** (o "legado" simulado):

- `core/`:
  - `PriorityMatrix`: impacto + urgência → prioridade e regra aplicada.
  - `ServiceDeskCalendar`: segunda a sexta, 8h às 18h, `America/Sao_Paulo`, com o relógio injetado.
  - `DeadlinePolicy`: prazo por prioridade a partir da abertura ou da última atualização.
  - `OverduePolicy`.
  - `ReopenPolicy`: resolvido há no máximo 7 dias.
  - `DuplicateFinder`: candidatos abertos ou reabríveis do mesmo solicitante.
  - `TicketNumberGenerator`.
  - Casos de uso `CreateTicket`, `ComplementTicket`, `ReopenTicket` e `RecordHandoff`.
  - `TicketsService` (implementa `TicketsApi`).
  - Portas `TicketRepository` e `Clock`.
- `persistence/`:
  - `DrizzleTicketRepository`. Toda consulta recebe o `requesterId` e o aplica no `WHERE`.
  - `LegacyOutageSimulator`, um decorador do repositório que abre janelas de indisponibilidade conforme o `.env`.
  - A seed com os chamados do Anexo B, com datas relativas ao momento da seed.
- `http/`: `TicketsController` (somente leitura, para o próprio funcionário) e o listener de `chat.conversation.handed-off` (RF44).

**Domínio `agent`**:

- `core/`:
  - `AgentService` (implementa `AgentApi.respond`).
  - `UnderstandingStep`: chama `LlmClient.understand` e valida o resultado.
  - `TurnPolicy`: rota do turno a partir do entendimento, do limiar de confiança e do orçamento.
  - `ResponseLoop`: laço limitado, com tools filtradas pela rota.
  - `ToolRegistry`: as tools da seção [Principais interfaces](#principais-interfaces).
  - `StepRecorder`: decora a execução das tools, grava passos, tentativas e falhas.
  - `DecisionBuilder`: monta a `AgentDecision` a partir do entendimento, das tools executadas e das regras devolvidas pelos domínios.
  - `ContextBuilder`: janela de 20 mensagens, ação pendente e chamados citados na conversa, só do funcionário da conversa.
  - `BudgetGuard`: custo diário e tokens por conversa.
  - `PromptCatalog`: instruções estáveis no início, conteúdo variável no fim.
  - Portas `LlmClient` e `AgentRunRepository`.
- `persistence/`:
  - `MastraLlmClient`: único ponto que importa `@mastra/core` e `@openrouter/ai-sdk-provider`. Cria por turno as tools do Mastra a partir das tools do `core`, com o contexto da sessão em closure.
  - `ScriptedLlmClient`: fake roteirizado, para testes e E2E, ativado por `LLM_PROVIDER=scripted`, que é proibido em `production`.
  - `ResilientTicketsApi` e `ResilientKnowledgeApi`: decoradores com `withResilience` sobre os tokens públicos.
  - `DrizzleAgentRunRepository` (`agent.runs`).
- `evals/`: cenários de referência e o runner `pnpm --filter @nexo/agent eval`.

**Domínio `chat`**:

- `core/`:
  - `Conversation`: máquina de estados `agent → waiting_analyst → with_analyst → agent | closed`.
  - `SendEmployeeMessage`: limite de sessão, trava de turno, roteamento.
  - `MessageAllowance`: 30 mensagens por sessão.
  - `ConfirmationMatcher` e `CancellationMatcher`: frases fixas.
  - `QuickReplyResolver`: "2" vira o rótulo da segunda opção.
  - `PendingActions`: proposta, edição, confirmação, cancelamento e substituição.
  - `ConfirmPendingAction`: chama `TicketsApi` com `requesterId` do dono da conversa e `idempotencyKey` igual ao id da ação.
  - `HandoffPolicy`: nível N1/N2 e prazo de contato.
  - `HandOffConversation`.
  - `ConsoleQueries`: lista, filtros, contadores, busca e status derivado.
  - `ClaimConversation`, `ReleaseConversation`, `CloseConversation` e `SendAnalystMessage`.
  - `AnalystTicketAccess`: o painel de chamados só abre para conversa transferida.
  - `ConversationEventsHub`: `Subject` RxJS em memória para o SSE.
  - Portas `ConversationRepository`, `MessageRepository`, `PendingActionRepository` e `SessionUsageRepository`.
- `persistence/`: os repositórios Drizzle do schema `chat`.
- `http/`: `EmployeeConversationController`, `PendingActionsController`, `ConsoleController` e `ConversationStreamController` (os GET SSE).

**Frontend (`apps/web`)**:

- `app/`: rotas `/login`, `/atendimento`, `/perfil`, `/console` e `/console/:conversationId`; `RequireRole`; `AppShell` (sidebar com Atendimento ou Conversas e Meu perfil, barra superior com "Assistente online" e "Sair").
- `modules/identity`:
  - `api/`: `login`, `logout` e `getMe`.
  - `hooks/`: `useSession`, `useLogin` e `useLogout`.
  - `pages/`: `LoginPage` e `ProfilePage`.
  - `components/`: `LoginHero`, `LoginForm` e `ProfileCard`.
- `modules/chat`:
  - `api/`: `getCurrentConversation`; `streamMessage`, com `fetch` e `ReadableStream` lidos por `eventsource-parser`; `confirmAction`, `cancelAction`, `editAction`, `requestHandoff` e `retryTurn`; `subscribeConversation` (`EventSource`).
  - `hooks/`: `useConversation`, `useSendMessage` (reducer do turno em streaming), `usePendingAction`, `useConversationEvents` e `useQuickReplyKeys`.
  - `components/`: `MessageList`, `EmployeeMessage`, `AgentMessage`, `AnalystMessage`, `SystemEvent`, `QuickOptions`, `TicketSelection`, `DraftCard`, `DraftEditForm`, `ComplementCard`, `ReopenCard`, `MessageComposer`, `MessageCounter`, `ConversationStateBanner`, `EmptyConversation`, `TypingIndicator` e `TurnError`.
  - `pages/`: `ChatPage`.
- `modules/console`:
  - `api/` e `hooks/`: `useConsoleConversations`, `useConsoleConversation`, `useEmployeeTickets`, `useClaim`, `useRelease`, `useClose`, `useAnalystMessage` e `useConsoleEvents`.
  - `components/`: `ConversationFilters`, `ConversationSearch`, `ConversationList`, `ConversationListItem`, `ConsoleThread`, `HandoffSummary`, `AttendanceBar`, `AnalystComposer` e `EmployeeTicketsPanel`.
  - `pages/`: `ConsolePage`.
- `components/` (compartilhados entre chat e console): `agent-turn/` (`StepsLine`, `DecisionDetails`, `ConfidenceBadge`) e `tickets/` (`TicketCard`, `TicketStatusBadge`, `PriorityBadge`, `OverdueLabel`). A pasta `modules/tickets` sai do scaffold, porque nenhuma tela própria de chamados está no escopo.

**Fluxo de uma mensagem do funcionário (estado `agent`)**:

1. O `web` faz `POST /api/conversations/current/messages`, e a resposta é um stream SSE.
2. O `chat` valida a sessão, o limite (`MessageAllowance`) e a trava de turno, grava a mensagem e emite `message.accepted`.
3. Se há ação pendente e o texto bate em `ConfirmationMatcher`, o `chat` executa `ConfirmPendingAction`, emite `turn.completed` com a resposta determinística e não chama o modelo. O mesmo vale para `CancellationMatcher`. Um dígito com opções rápidas abertas vira o rótulo da opção (`QuickReplyResolver`).
4. Caso contrário, o `chat` chama `AGENT_API.respond` com o contexto da conversa e repassa os eventos: `turn.step`, `turn.text-delta` e `turn.part`.
5. Os eventos `proposal` viram ações pendentes. `handoff-requested` aciona `HandOffConversation`, que muda o estado, calcula o nível e o prazo e publica `chat.conversation.handed-off`.
6. Ao final, o `chat` grava a mensagem do agent com `turn` (passos e decisão), emite `turn.completed` e notifica o console pelo hub.

Nos estados `waiting_analyst` e `with_analyst`, o passo 3 em diante não acontece: a mensagem é entregue ao console e o stream termina com `turn.skipped`.

### Domínios e fronteiras

| Domínio/app | Dono de | Expõe | Consome |
| --- | --- | --- | --- |
| `identity` | `identity.users` | `IDENTITY_API` (`IdentityApi`) | — |
| `knowledge` | `knowledge.articles` | `KNOWLEDGE_API` (`KnowledgeApi`) | — |
| `tickets` | `tickets.tickets`, `tickets.ticket_events`, `tickets.ticket_sequences` | `TICKETS_API` (`TicketsApi`) | evento `chat.conversation.handed-off` |
| `agent` | `agent.runs` | `AGENT_API` (`AgentApi`) | `TICKETS_API`, `KNOWLEDGE_API` |
| `chat` | `chat.conversations`, `chat.messages`, `chat.pending_actions`, `chat.session_usage` | eventos SSE para o `web`; evento `chat.conversation.handed-off` | `AGENT_API`, `TICKETS_API`, `IDENTITY_API` |
| `apps/monolith` | — | `/api/*`, arquivos estáticos do `web` quando `SERVE_WEB_DIR` está definido | todos os módulos |
| `apps/web` | — | — | HTTP e SSE com os schemas de `@nexo/contracts` |

Cada domínio declara seus módulos provedores como `@Global()` e exporta somente o token. Os `package.json` dos domínios dependem só de `@nexo/contracts` e `@nexo/shared`, e o `pnpm check:boundaries` continua sendo a verificação. Cada domínio usa um `pgSchema` próprio, sem chave estrangeira entre schemas. Referências a outros domínios (`requesterId`, `ticketNumber`, `conversationId`) são valores, não FKs.

A regra de privacidade fica com quem tem os dados. O `tickets` filtra por `requesterId` no repositório. O `chat` decide quando um analista pode ver os chamados de um funcionário (conversa em `waiting_analyst`, ou em `with_analyst` assumida por ele) e só então chama `TicketsApi.listOwn` com o `requesterId` do dono da conversa. O `agent` recebe o `requesterId` no contexto do turno e nenhuma tool tem esse campo no schema de entrada.

O evento `chat.conversation.handed-off` é publicado pelo `chat` e escutado pelo `tickets`, que registra a transferência no histórico dos chamados citados (RF44). O listener trata o próprio erro, porque uma falha do legado não pode desfazer a transferência.

## Design de implementação

### Principais interfaces

Contratos públicos (`@nexo/contracts`):

```text
IdentityApi            (IDENTITY_API)
  findProfiles({ userIds }) -> Promise<UserProfile[]>

KnowledgeApi           (KNOWLEDGE_API)
  search({ query, limit }) -> Promise<ArticleExcerpt[]>
  get({ articleId }) -> Promise<ArticleExcerpt | null>

AgentApi               (AGENT_API)
  respond(input: AgentTurnInput) -> AsyncIterable<AgentTurnEvent>
```

```text
TicketsApi             (TICKETS_API)
  listOwn({ requesterId, scope: 'open' | 'closed' | 'all' }) -> Promise<TicketSummary[]>
  findOwn({ requesterId, number }) -> Promise<TicketDetail | null>
  searchOwn({ requesterId, query }) -> Promise<TicketSummary[]>
  findDuplicates({ requesterId, category, text }) -> Promise<DuplicateCheck>
  assessPriority(facts: PriorityFacts) -> Promise<PriorityAssessment>
  contactDeadline({ from, critical }) -> Promise<string>
  create({ requesterId, draft: TicketDraft, idempotencyKey }) -> Promise<TicketDetail>
  complement({ requesterId, number, text, idempotencyKey }) -> Promise<TicketDetail>
  reopen({ requesterId, number, reason, idempotencyKey }) -> Promise<TicketDetail>
  // rejeita com TicketsUnavailableError | TicketNotFoundError | TicketRuleViolationError
```

`TicketNotFoundError` cobre "não existe" e "não é seu" com a mesma mensagem. `idempotencyKey` é único em `tickets.ticket_events`: repetir a chamada depois de um timeout devolve o mesmo chamado em vez de duplicá-lo.

Portas internas do `agent/core` (não exportadas):

```text
LlmClient
  understand({ instructions, messages }) -> Promise<LlmResult<Understanding>>
  respond({ instructions, messages, tools: AgentTool[], maxSteps, signal })
    -> AsyncIterable<LlmEvent>     // text-delta | finished{ usage }

AgentTool<I, O>
  name, description, inputSchema: ZodType<I>, outputSchema: ZodType<O>
  stepLabel(input, output) -> string      // texto do passo, gerado pelo código
  execute(input: I, context: TurnContext) -> Promise<O>

TurnContext
  conversationId, requesterId, emit(event: AgentTurnEvent), clock
```

Tools do laço de resposta (`agent/core/tools/`, uma por arquivo). Nenhuma recebe `requesterId`:

| Tool | Entrada (zod) | Efeito, sempre validado no código | Passo exibido |
| --- | --- | --- | --- |
| `buscar_chamados` | `query?`, `scope` | `TicketsApi.searchOwn`/`listOwn` | "consultou seus chamados" + "3 chamados encontrados" |
| `consultar_chamado` | `number` (regex `^(INC\|REQ)-\d{5}$`) | `findOwn`; se não achar, devolve o resultado neutro `not_found` | "consultou o INC-20311" |
| `buscar_central` | `query` | `KnowledgeApi.search` (até 3 trechos) | "buscou na central de ajuda" |
| `citar_artigo` | `articleId`, `applies`, `reason` | confere se o artigo veio de uma busca deste turno e emite `turn.part` com a citação | "artigo 'VPN com erro 809' não se aplica: vale só para Windows 10" |
| `classificar_prioridade` | `impact`, `blocksWork`, `sameDayCommitment`, `hasWorkaround`, `kind` | `TicketsApi.assessPriority` | "classificou a prioridade" + "calculou o prazo" |
| `propor_chamado` | `title`, `description`, `type`, `category`, `affected`, `priorityFacts`, `notDuplicateOf?` | `findDuplicates`: com chamado aberto equivalente não listado em `notDuplicateOf`, devolve `duplicate_found` sem propor. Senão, `assessPriority` e emite `proposal` (`create_ticket`) | "montou o rascunho" |
| `propor_complemento` | `number`, `complement` | `findOwn` e o chamado precisa estar aberto; emite `proposal` (`complement_ticket`) | "preparou o complemento do INC-20311" |
| `propor_reabertura` | `number`, `reason` | `findOwn` e `ReopenPolicy` (até 7 dias); emite `proposal` (`reopen_ticket`) | "propôs reabrir o INC-20150" |
| `perguntar_opcoes` | `question`, `options` (2 a 5) | emite `turn.part` (`quick_options`) | "perguntou quem é afetado" (a partir de `question`) |
| `mostrar_selecao` | `numbers` (2 a 6) | `listOwn` e só mostra os números que são do funcionário | "listou seus chamados para escolha" |
| `mostrar_chamado` | `number` | `findOwn` e emite `turn.part` (`ticket_card`, com `overdue`) | "consultou o SLA" quando o chamado está vencido |
| `transferir_para_analista` | `reason`, `summary` | emite `handoff-requested`; o `chat` executa | "transferiu para um analista" |

O que a `TurnPolicy` decide no código, antes ou depois do laço:

- Intenção `analyst_request` transfere sem chamar o laço de resposta.
- Confiança abaixo de `AGENT_CONFIDENCE_THRESHOLD` (padrão 0,6) transfere com o motivo `low_confidence`.
- `out_of_scope` usa o laço sem nenhuma tool de chamados, só para redigir o redirecionamento.
- Rascunho com prioridade crítica gera `handoff-requested` (`critical`) no mesmo turno.
- Chamado vencido mostrado no turno inclui as opções rápidas fixas "Falar com um analista", "Adicionar informação" e "Não, obrigado". A transferência por vencimento acontece quando o funcionário aceita.
- Estourar 6 passos, estourar o orçamento de tokens da conversa ou repetir falhas do legado termina com resposta degradada e as opções "Tentar de novo" e "Falar com um analista".

Casos de uso do `chat` usados pelo HTTP:

```text
SendEmployeeMessage.execute({ session, text, quickReply?, ticketSelection? })
  -> AsyncIterable<ChatStreamEvent>
ConfirmPendingAction.execute({ session, actionId }) -> Promise<ChatTurnOutcome>
EditPendingAction.execute({ session, actionId, changes }) -> Promise<PendingAction>
HandOffConversation.execute({ conversationId, reason, summary, confidence? }) -> Promise<Conversation>
ClaimConversation.execute({ analyst, conversationId }) -> Promise<Conversation>  // 409 se já assumida
```

### Modelos de dados

Convenções: ids `uuid`; datas em ISO 8601 UTC no contrato, formatadas em `pt-BR` e `America/Sao_Paulo` no `web`; campos ausentes normalizados para `null`; enums em inglês no contrato, com rótulos em português no `web` (`components/tickets/labels.ts`). Os schemas zod ficam em `@nexo/contracts`, um arquivo por conceito.

#### `SessionUser` — usuário da sessão (`GET /api/auth/me`)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | sim | Id do usuário |
| `name` | `string` | sim | Nome completo |
| `email` | `string` | sim | E-mail corporativo |
| `role` | `'employee' \| 'analyst'` | sim | Papel vindo dos dados de exemplo |
| `department` | `string \| null` | sim | Ex.: "Financeiro" |
| `supportLevel` | `'N1' \| 'N2' \| null` | sim | Só para analistas |
| `initials` | `string` | sim | Avatar |
| `session` | `{ expiresAt: string }` | sim | Expiração da sessão. O contador de mensagens (RF13) vem de `EmployeeConversationView.usage`, porque é dado do `chat` e o `identity` não o consome |

```text
{
  "id": "6f1c2a8e-3b7d-4e55-9a10-1d2f3c4b5a61",
  "name": "Ana Souza",
  "email": "ana.souza@nexo.com.br",
  "role": "employee",
  "department": "Financeiro",
  "supportLevel": null,
  "initials": "AS",
  "session": { "expiresAt": "2026-10-27T21:00:00.000Z" }
}
```

O JWT do cookie `nexo_session` (httpOnly, `SameSite=Lax`, `Secure` em produção) contém só `sub`, `role`, `sid` e `exp`. A sessão expira em `SESSION_TTL_HOURS` (padrão 8) ou em `SESSION_REMEMBER_DAYS` (padrão 7) quando "Manter conectado" está marcado **[premissa]**.

#### `UserProfile` — perfil público entre domínios (`IdentityApi`)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | sim | Id |
| `name` | `string` | sim | Nome |
| `role` | `'employee' \| 'analyst'` | sim | Papel |
| `department` | `string \| null` | sim | Setor |
| `supportLevel` | `'N1' \| 'N2' \| null` | sim | Nível do analista |
| `initials` | `string` | sim | Iniciais |

```text
{ "id": "b2d4…", "name": "Rafael Lima", "role": "analyst", "department": null, "supportLevel": "N2", "initials": "RL" }
```

#### `TicketSummary` e `TicketDetail` — chamado

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `number` | `string` | sim | `INC-xxxxx` ou `REQ-xxxxx` |
| `type` | `'incident' \| 'request'` | sim | INC ou REQ |
| `title` | `string` | sim | Título |
| `category` | `'access' \| 'network_vpn' \| 'hardware' \| 'software' \| 'email' \| 'other'` | sim | Categoria do Anexo A |
| `priority` | `'critical' \| 'high' \| 'medium' \| 'low'` | sim | Prioridade |
| `status` | `'open' \| 'awaiting_analyst' \| 'in_progress' \| 'in_service' \| 'approved' \| 'resolved'` | sim | Status (RF37) |
| `openedAt` | `string` | sim | Abertura |
| `lastUpdatedAt` | `string` | sim | Última atualização (reinicia o prazo) |
| `resolvedAt` | `string \| null` | sim | Resolução |
| `dueAt` | `string \| null` | sim | Prazo atual; `null` quando resolvido |
| `overdue` | `boolean` | sim | `now > dueAt` e status diferente de `resolved` |
| `latestEvent` | `{ kind: string; at: string; label: string } \| null` | sim | Evento mais recente (RF49) |
| `description` | `string` | só em `TicketDetail` | Descrição |
| `affected` | `'only_me' \| 'my_team' \| 'whole_company' \| 'unknown'` | só em `TicketDetail` | Afetados |

```text
{
  "number": "INC-20311",
  "type": "incident",
  "title": "Notebook lento após atualização do Windows",
  "category": "hardware",
  "priority": "medium",
  "status": "awaiting_analyst",
  "openedAt": "2026-10-14T13:20:00.000Z",
  "lastUpdatedAt": "2026-10-20T13:20:00.000Z",
  "resolvedAt": null,
  "dueAt": "2026-10-23T13:20:00.000Z",
  "overdue": true,
  "latestEvent": { "kind": "status_changed", "at": "2026-10-20T13:20:00.000Z", "label": "Aguardando analista" },
  "description": "Lentidão geral desde a atualização de 15/10. Reiniciar e rodar o diagnóstico da central não resolveu.",
  "affected": "only_me"
}
```

#### `PriorityFacts` e `PriorityAssessment` — matriz do Anexo A

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `facts.impact` | `'only_me' \| 'my_team' \| 'whole_company' \| 'unknown'` | sim | Quantas pessoas |
| `facts.blocksWork` | `boolean` | sim | Algo parado ou impedindo de trabalhar |
| `facts.sameDayCommitment` | `boolean` | sim | Compromisso hoje |
| `facts.hasWorkaround` | `boolean` | sim | Há alternativa |
| `facts.kind` | `'incident' \| 'request'` | sim | Tipo |
| `priority` | `TicketPriority` | sim | Resultado |
| `deadline` | `{ amount: number; unit: 'clock_hours' \| 'business_hours' \| 'business_days' }` | sim | Prazo da prioridade |
| `dueAt` | `string` | sim | Horário-limite a partir de agora |
| `rule` | `string` | sim | Regra aplicada, em linguagem simples |

Regras, em ordem:

1. `blocksWork` e impacto `my_team` ou `whole_company`: crítica, 1 hora corrida.
2. `blocksWork` ou `sameDayCommitment`: alta, 4 horas úteis.
3. Incidente com `hasWorkaround` ou impacto `unknown`: média, 3 dias úteis.
4. Requisição sem urgência: baixa, 5 dias úteis.

Um dia útil equivale a 10 horas úteis, contadas a partir do mesmo horário **[premissa]**.

```text
{
  "priority": "high",
  "deadline": { "amount": 4, "unit": "business_hours" },
  "dueAt": "2026-10-26T16:43:00.000Z",
  "rule": "prioridade alta: impede uma pessoa de trabalhar e há compromisso hoje"
}
```

#### `DuplicateCheck` — deduplicação e reabertura

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `openMatches` | `TicketSummary[]` | sim | Abertos do solicitante, na mesma categoria ou com texto semelhante |
| `reopenable` | `TicketSummary[]` | sim | Resolvidos há até 7 dias e semelhantes |
| `expiredResolved` | `TicketSummary[]` | sim | Resolvidos há mais de 7 dias e semelhantes, para citar no novo chamado |
| `rule` | `string` | sim | Ex.: "já existe chamado aberto sobre o mesmo problema: atualizar em vez de criar" |

```text
{ "openMatches": [], "reopenable": [{ "number": "INC-20150", "…": "…" }], "expiredResolved": [], "rule": "chamado resolvido há 4 dias: pode ser reaberto" }
```

#### `ArticleExcerpt` — central de ajuda

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` | sim | Slug (`vpn-erro-809`) |
| `title` | `string` | sim | Título |
| `excerpt` | `string` | sim | Até 600 caracteres |
| `conditions` | `string \| null` | sim | Condições de aplicação ("Vale apenas para Windows 10") |
| `category` | `TicketCategory` | sim | Categoria |

```text
{ "id": "vpn-erro-809", "title": "VPN com erro 809", "excerpt": "Reinstale o cliente de VPN pelo portal de softwares e reinicie o computador.", "conditions": "Vale apenas para Windows 10; no Windows 11, abra um chamado.", "category": "network_vpn" }
```

#### `Understanding` — saída estruturada do classificador

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `intent` | `'question' \| 'ticket_status' \| 'ticket_complement' \| 'ticket_open' \| 'analyst_request' \| 'out_of_scope' \| 'closing' \| 'other'` | sim | RF18; `closing` = agradecimento ou problema resolvido |
| `summary` | `string` | sim | O que o funcionário quer, em uma frase |
| `entities` | `{ ticketNumber, operatingSystem, symptom, impact, sameDayCommitment, hasWorkaround, blocksWork }` (todos anuláveis) | sim | Dados extraídos |
| `confidence` | `number` (0 a 1) | sim | Grau de segurança |
| `reason` | `string` | sim | Por que entendeu assim |

```text
{
  "intent": "ticket_open",
  "summary": "VPN não conecta com erro 809 no Windows 11; precisa para reunião às 14h",
  "entities": { "ticketNumber": null, "operatingSystem": "Windows 11", "symptom": "erro 809 na VPN", "impact": "only_me", "sameDayCommitment": true, "hasWorkaround": false, "blocksWork": true },
  "confidence": 0.86,
  "reason": "relata falha com código de erro e sistema operacional, sem pedir analista"
}
```

#### `AgentStep` e `AgentDecision` — transparência (RF30 a RF34)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `steps[].id` | `string` | sim | Id do passo |
| `steps[].kind` | `'understood' \| 'searched_tickets' \| 'viewed_ticket' \| 'searched_knowledge' \| 'cited_article' \| 'classified_priority' \| 'computed_deadline' \| 'checked_duplicates' \| 'built_draft' \| 'proposed_update' \| 'proposed_reopen' \| 'asked_question' \| 'handed_off' \| 'executed_action'` | sim | Tipo |
| `steps[].label` | `string` | sim | Texto curto acima da resposta |
| `steps[].result` | `string` | sim | Resultado resumido (RF32) |
| `steps[].status` | `'ok' \| 'failed'` | sim | Falha registrada |
| `steps[].attempts` | `number` | sim | Mais de 1 indica nova tentativa |
| `steps[].durationMs` | `number` | sim | Duração |
| `decision.understood` | `{ intent, intentLabel, summary, entities: { label: string; value: string }[] }` | sim | O que entendeu |
| `decision.action` | `{ kind, label }` | sim | Ação tomada, derivada das tools executadas |
| `decision.confidence` | `{ value: number; label: 'alta' \| 'média' \| 'baixa' }` | sim | ≥ 0,8 alta; ≥ 0,6 média; < 0,6 baixa |
| `decision.reason` | `string` | sim | Motivo |
| `decision.rules` | `string[]` | sim | Regras do service desk aplicadas, vindas dos resultados das tools |
| `decision.handoff` | `HandoffInfo \| null` | sim | Quando o turno transferiu |

```text
{
  "steps": [
    { "id": "s1", "kind": "searched_tickets", "label": "consultou seus chamados", "result": "nenhum chamado aberto sobre VPN", "status": "ok", "attempts": 1, "durationMs": 120 },
    { "id": "s2", "kind": "searched_knowledge", "label": "buscou na central de ajuda", "result": "1 artigo encontrado", "status": "ok", "attempts": 1, "durationMs": 45 },
    { "id": "s3", "kind": "cited_article", "label": "avaliou o artigo", "result": "artigo 'VPN com erro 809' não se aplica: vale só para Windows 10", "status": "ok", "attempts": 1, "durationMs": 1 }
  ],
  "decision": {
    "understood": { "intent": "ticket_open", "intentLabel": "abrir chamado", "summary": "VPN com erro 809 no Windows 11", "entities": [{ "label": "Sistema", "value": "Windows 11" }] },
    "action": { "kind": "asked_question", "label": "perguntou quem é afetado" },
    "confidence": { "value": 0.86, "label": "alta" },
    "reason": "o artigo do erro 809 não se aplica ao Windows 11 e falta saber quem é afetado",
    "rules": ["sem chamado aberto sobre o mesmo problema: segue para abertura"],
    "handoff": null
  }
}
```

> **Falha do legado:** o passo fica com `status: "failed"` e `attempts: 3`, e `decision.action.kind` vira `degraded`. A resposta tem texto fixo do código e as opções "Tentar de novo" e "Falar com um analista".

```text
{ "steps": [{ "id": "s1", "kind": "searched_tickets", "label": "consultou seus chamados", "result": "sistema de chamados indisponível após 3 tentativas", "status": "failed", "attempts": 3, "durationMs": 6100 }], "decision": { "action": { "kind": "degraded", "label": "avisou da indisponibilidade" }, "…": "…" } }
```

#### `ChatMessage` — mensagem da conversa

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | sim | Id |
| `conversationId` | `uuid` | sim | Conversa |
| `author` | `'employee' \| 'agent' \| 'analyst' \| 'system'` | sim | Autor |
| `authorName` | `string \| null` | sim | Nome do analista ou do funcionário |
| `authorLevel` | `'N1' \| 'N2' \| null` | sim | Nível do analista (RF15) |
| `text` | `string` | sim | Texto; vazio quando o conteúdo é só um card |
| `parts` | `MessagePart[]` | sim | Conteúdo rico (abaixo) |
| `turn` | `{ steps: AgentStep[]; decision: AgentDecision } \| null` | sim | Só em mensagens do agent |
| `status` | `'complete' \| 'failed'` | sim | `failed` quando o turno falhou |
| `createdAt` | `string` | sim | Data |

`MessagePart` é uma união discriminada por `type`:

| `type` | Campos |
| --- | --- |
| `quick_options` | `question`, `options: { id: string; label: string }[]`, `answered: boolean` |
| `ticket_selection` | `tickets: TicketSummary[]`, `selectedNumber: string \| null` |
| `ticket_card` | `ticket: TicketDetail` |
| `pending_action` | `action: PendingAction` (estado mais recente, lido na montagem do histórico) |
| `article_citation` | `articleId`, `title`, `applies: boolean`, `reason` |
| `event` | `kind: 'handed_off' \| 'claimed' \| 'released' \| 'closed' \| 'limit_reached'`, `label`, `actorName: string \| null` |

```text
{
  "id": "0b9e…",
  "conversationId": "c71a…",
  "author": "agent",
  "authorName": null,
  "authorLevel": null,
  "text": "Coloquei prioridade alta por causa da reunião — a resposta chega antes das 14h. Confira antes de eu criar:",
  "parts": [{ "type": "pending_action", "action": { "id": "pa-1", "displayNumber": "D-381", "kind": "create_ticket", "status": "pending", "…": "…" } }],
  "turn": { "steps": ["…"], "decision": { "…": "…" } },
  "status": "complete",
  "createdAt": "2026-10-26T12:43:00.000Z"
}
```

#### `PendingAction` — rascunho ou proposta aguardando confirmação

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | sim | Também é a `idempotencyKey` enviada ao `tickets` |
| `displayNumber` | `string` | sim | `D-381` (sequência própria) |
| `kind` | `'create_ticket' \| 'complement_ticket' \| 'reopen_ticket'` | sim | Tipo de escrita |
| `status` | `'pending' \| 'confirmed' \| 'cancelled' \| 'superseded' \| 'failed'` | sim | Só `pending` pode ser confirmada |
| `draft` | `TicketDraft \| null` | sim | Para `create_ticket` |
| `targetNumber` | `string \| null` | sim | Para complemento e reabertura |
| `complement` | `string \| null` | sim | Texto do complemento ou motivo da reabertura |
| `resultTicket` | `TicketDetail \| null` | sim | Preenchido após a confirmação |
| `confirmedVia` | `'button' \| 'shortcut' \| 'text' \| null` | sim | Auditoria da confirmação |
| `createdAt`, `resolvedAt` | `string`, `string \| null` | sim | Datas |

`TicketDraft`: `title`, `description`, `type`, `category`, `affected`, `priorityFacts`, `priority`, `dueAt` e `rule`. Os três últimos são sempre recalculados por `TicketsApi.assessPriority` ao propor e ao editar.

```text
{
  "id": "5d0c…", "displayNumber": "D-381", "kind": "create_ticket", "status": "pending",
  "draft": { "title": "VPN não conecta no notebook — erro 809", "description": "Desde 20/10 o notebook (Windows 11) não conecta na VPN e mostra o erro 809. Precisa dela para a reunião das 14h.", "type": "incident", "category": "network_vpn", "affected": "only_me", "priorityFacts": { "…": "…" }, "priority": "high", "dueAt": "2026-10-26T16:43:00.000Z", "rule": "prioridade alta: impede uma pessoa de trabalhar e há compromisso hoje" },
  "targetNumber": null, "complement": null, "resultTicket": null, "confirmedVia": null,
  "createdAt": "2026-10-26T12:43:00.000Z", "resolvedAt": null
}
```

> **Substituição:** uma nova proposta na mesma conversa marca a anterior como `superseded`. Só uma ação fica `pending` por conversa.

#### `Conversation` e `HandoffInfo` — estado da conversa

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | sim | Id |
| `employee` | `UserProfile` | sim | Dono |
| `state` | `'agent' \| 'waiting_analyst' \| 'with_analyst' \| 'closed'` | sim | Estado (RF52) |
| `resolution` | `'agent' \| 'analyst' \| null` | sim | Quem encerrou |
| `assignedAnalyst` | `UserProfile \| null` | sim | Analista que assumiu |
| `handoff` | `HandoffInfo \| null` | sim | Última transferência |
| `pendingAction` | `PendingAction \| null` | sim | Ação pendente atual |
| `lastMessageAt` | `string` | sim | Ordenação |

`HandoffInfo`: `reason` (`'requested' \| 'critical' \| 'overdue' \| 'low_confidence' \| 'failure'`), `level` (`'N1' \| 'N2'`), `summary` (o que o funcionário quer e o que o agent já fez), `ticketNumbers`, `confidence` (`number \| null`), `contactDueAt` e `handedOffAt`. N2 para `critical` e `overdue`, N1 para os demais. O contato é em até 2 horas úteis, ou em 1 hora corrida quando crítico (RF43).

```text
{
  "id": "c71a…", "employee": { "name": "Ana Souza", "…": "…" }, "state": "waiting_analyst", "resolution": null, "assignedAnalyst": null,
  "handoff": { "reason": "overdue", "level": "N2", "summary": "Ana quer andamento do INC-20311 (notebook lento), sem atualização há 6 dias, acima do prazo de 3 dias úteis. O agent consultou o chamado e ofereceu analista; ela aceitou.", "ticketNumbers": ["INC-20311"], "confidence": 0.9, "contactDueAt": "2026-10-26T15:05:00.000Z", "handedOffAt": "2026-10-26T13:05:00.000Z" },
  "pendingAction": null, "lastMessageAt": "2026-10-26T13:05:00.000Z"
}
```

#### `EmployeeConversationView` — resposta de `GET /api/conversations/current`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `conversation` | `Conversation \| null` | sim | Conversa ativa; `null` antes da primeira mensagem ou depois de encerrada (RF16) |
| `timeline` | `ChatMessage[]` | sim | Últimas 100 mensagens das conversas do funcionário, em ordem, com eventos de encerramento entre conversas |
| `usage` | `{ messagesUsed: number; messagesLimit: number }` | sim | Contador da sessão |
| `turnInProgress` | `boolean` | sim | Turno em andamento (outra aba) |

#### `ConsoleConversationItem` e `ConsoleList` — console

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | sim | Conversa |
| `employee` | `UserProfile` | sim | Nome, setor e iniciais |
| `lastMessage` | `{ preview: string; author: string; at: string }` | sim | Prévia de até 80 caracteres |
| `unreadCount` | `number` | sim | Mensagens do funcionário depois da última leitura de um analista |
| `consoleStatus` | `'transferred' \| 'agent_asked_help' \| 'agent_attending' \| 'you_are_attending' \| 'attended_by_other' \| 'resolved_by_agent' \| 'closed'` | sim | Status derivado (RF45) |
| `statusDetail` | `string \| null` | sim | "INC-20311", "contato em 25 min", "confiança 41%" ou "Rafael Lima" |
| `ticketNumbers` | `string[]` | sim | Para a busca por número |

`ConsoleList` = `{ items: ConsoleConversationItem[]; counters: { all: number; for_you: number; with_agent: number; mine: number } }`.

```text
{
  "items": [{ "id": "c71a…", "employee": { "name": "Ana Souza", "department": "Financeiro", "initials": "AS", "…": "…" }, "lastMessage": { "preview": "Está parado há 5 dias. Quero falar com…", "author": "employee", "at": "2026-10-26T13:04:00.000Z" }, "unreadCount": 2, "consoleStatus": "transferred", "statusDetail": "INC-20311", "ticketNumbers": ["INC-20311"] }],
  "counters": { "all": 9, "for_you": 2, "with_agent": 4, "mine": 1 }
}
```

#### `ChatStreamEvent` — eventos SSE do turno (`POST …/messages`, `POST …/turns/retry`)

| `event` | `data` | Quando |
| --- | --- | --- |
| `message.accepted` | `{ message: ChatMessage; usage }` | Mensagem do funcionário gravada |
| `turn.step` | `{ step: AgentStep }` | Cada passo concluído ou com falha |
| `turn.text-delta` | `{ delta: string }` | Trecho do texto |
| `turn.part` | `{ part: MessagePart }` | Card, opções ou citação |
| `turn.completed` | `{ message: ChatMessage; conversation: Conversation; usage }` | Fim do turno, já gravado |
| `turn.skipped` | `{ reason: 'with_analyst' \| 'waiting_analyst' }` | Agent pausado (RF15) |
| `turn.failed` | `{ error: ApiError; retryable: boolean }` | Falha do modelo após o aceite da mensagem |

```text
event: turn.step
data: {"step":{"id":"s1","kind":"searched_tickets","label":"consultou seus chamados","result":"3 chamados encontrados","status":"ok","attempts":1,"durationMs":98}}

event: turn.text-delta
data: {"delta":"Você tem 3 chamados abertos. "}
```

#### `ConversationStreamEvent` e `ConsoleStreamEvent` — SSE de atualização (GET)

| `event` | `data` | Canal |
| --- | --- | --- |
| `conversation.updated` | `{ conversation: Conversation }` | funcionário e console (conversa aberta) |
| `message.created` | `{ message: ChatMessage }` | funcionário e console (conversa aberta) |
| `console.item.updated` | `{ item: ConsoleConversationItem; counters }` | lista do console |
| `heartbeat` | `{}` | a cada 25 s |

#### `AgentTurnInput` e `AgentTurnEvent` — contrato `AgentApi`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `conversationId` | `uuid` | sim | Conversa |
| `requester` | `{ id: uuid; name: string }` | sim | Do dono da conversa (sessão) |
| `history` | `{ author; authorLabel; text; parts }[]` | sim | Janela já montada pelo `chat` (até 20 mensagens, incluindo as do analista com o rótulo "Analista Rafael Lima (N2)") |
| `pendingAction` | `PendingAction \| null` | sim | Para o agent saber que há rascunho aguardando |
| `userMessage` | `string` | sim | Texto atual (já resolvido de opção rápida ou seleção) |
| `signal` | `AbortSignal` | sim | Cancela se o cliente desconectar |

`AgentTurnEvent` = `step` \| `text-delta` \| `part` \| `proposal` (`{ kind, draft \| targetNumber, complement }`) \| `handoff-requested` (`{ reason, summary, confidence }`) \| `completed` (`{ text, steps, decision, runId }`) \| `failed` (`{ code: 'agent_unavailable' \| 'budget_exhausted'; retryable }`).

#### `ChatConversationHandedOff` — evento `chat.conversation.handed-off`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `conversationId` | `uuid` | sim | Conversa |
| `requesterId` | `uuid` | sim | Dono da conversa |
| `reason` | `HandoffReason` | sim | Motivo |
| `level` | `'N1' \| 'N2'` | sim | Nível |
| `ticketNumbers` | `string[]` | sim | Chamados que recebem o evento no histórico |

```text
{ "name": "chat.conversation.handed-off", "occurredAt": "2026-10-26T13:05:00.000Z", "payload": { "conversationId": "c71a…", "requesterId": "6f1c…", "reason": "overdue", "level": "N2", "ticketNumbers": ["INC-20311"] } }
```

#### `ApiError` — envelope de erro (existente, com códigos novos)

| Código | HTTP | Significado |
| --- | --- | --- |
| `validation_error` | 400 | Corpo ou parâmetro inválido |
| `invalid_credentials` | 401 | E-mail desconhecido ou senha vazia (mensagem genérica) |
| `unauthenticated` | 401 | Sem sessão ou sessão expirada |
| `forbidden` | 403 | Papel sem acesso à rota |
| `not_found` | 404 | Recurso inexistente ou de outra pessoa (indistinguíveis) |
| `conversation_already_claimed` | 409 | Outro analista já assumiu (RF51) |
| `conversation_not_claimed` | 409 | Analista tenta responder sem assumir |
| `invalid_conversation_state` | 409 | Transição de estado não permitida (ex.: transferir conversa já transferida) |
| `pending_action_not_pending` | 409 | Ação já confirmada, cancelada ou substituída |
| `turn_in_progress` | 409 | Já existe um turno em andamento na conversa |
| `ticket_rule_violation` | 422 | Ex.: reabertura fora da janela de 7 dias |
| `message_limit_reached` | 429 | 30 mensagens na sessão |
| `rate_limited` | 429 | Limite por minuto do usuário |
| `tickets_unavailable` | 503 | Legado indisponível após as tentativas |
| `agent_unavailable` | 503 | Modelo indisponível |
| `budget_exhausted` | 503 | Teto de custo diário atingido |
| `internal_error` | 500 | Falha não tratada (mensagem genérica) |

```text
{ "error": { "code": "tickets_unavailable", "message": "O sistema de chamados está fora do ar agora. Tente de novo em instantes ou fale com um analista." } }
```

#### Esquema do banco (Postgres, um schema por domínio)

| Schema.tabela | Colunas principais | Índices e restrições |
| --- | --- | --- |
| `identity.users` | `id`, `email`, `name`, `role`, `department`, `support_level`, `initials` | `email` único |
| `knowledge.articles` | `id` (slug), `title`, `body`, `conditions`, `category`, `search_vector` (gerada) | GIN em `search_vector` |
| `tickets.tickets` | `number`, `type`, `requester_id`, `title`, `description`, `category`, `priority`, `affected`, `status`, `opened_at`, `last_updated_at`, `resolved_at` | PK `number`; índice `(requester_id, status)`; GIN de texto em `title || description` |
| `tickets.ticket_events` | `id`, `ticket_number`, `kind` (`created`, `complemented`, `status_changed`, `reopened`, `handed_off`), `body`, `idempotency_key`, `actor`, `occurred_at` | `idempotency_key` único (parcial, não nulo) |
| `tickets.ticket_sequences` | `type`, `next_value` | INC começa em 20520, REQ em 10450 |
| `chat.conversations` | `id`, `employee_id`, `state`, `resolution`, `assigned_analyst_id`, `handoff` (jsonb), `last_message_at`, `analyst_read_at`, `turn_lock_until`, `closed_at` | índice parcial único `(employee_id)` onde `state <> 'closed'` |
| `chat.messages` | `id`, `conversation_id`, `author`, `author_id`, `text`, `parts` (jsonb), `turn` (jsonb), `status`, `created_at` | índice `(conversation_id, created_at)` |
| `chat.pending_actions` | `id`, `conversation_id`, `display_number`, `kind`, `status`, `payload` (jsonb), `result_ticket_number`, `confirmed_via`, `created_at`, `resolved_at` | índice parcial único `(conversation_id)` onde `status = 'pending'` |
| `chat.session_usage` | `session_id`, `user_id`, `employee_messages` | PK `session_id` |
| `agent.runs` | `id`, `conversation_id`, `intent`, `confidence`, `action`, `handoff_reason`, `steps` (jsonb, sem textos do funcionário), `models`, `input_tokens`, `output_tokens`, `cost_usd`, `first_token_ms`, `duration_ms`, `outcome`, `created_at` | índice `(created_at)` para o teto diário |

Os payloads `jsonb` são validados com os schemas zod de `@nexo/contracts` na leitura (`persistence/` faz `parse`), para que um registro corrompido falhe de forma explícita. As migrations ficam em `packages/<domínio>/drizzle/`, geradas por `drizzle-kit` com `schemaFilter` do domínio. Cada módulo as aplica em `onModuleInit`, com tabela de controle `<schema>.__migrations`. As seeds rodam em `onApplicationBootstrap` quando `SEED_DEMO_DATA=true` e a tabela está vazia.

#### Dados de exemplo (RF40)

| Tipo | Itens |
| --- | --- |
| Funcionários | Ana Souza (Financeiro), Bruno Tavares, Carla Mendes, Diego Ramos, Elisa Prado |
| Analistas | Rafael Lima (N2), Gabriela Rocha (N1), Fábio Nunes (N1) |
| Artigos (8) | VPN com erro 809, Horário do service desk, Troca de senha da rede, Outlook não sincroniza no celular, Acesso a pastas do SharePoint, Impressora não imprime, Wi-Fi de visitantes, Instalar software pelo portal |
| Chamados da Ana | INC-20311 (Hardware, média, aguardando analista, atualizado há 6 dias, vencido), REQ-10442 (Hardware, baixa, aprovado, há 7 dias), INC-20150 (Acesso, média, resolvido há 4 dias), INC-20298 (Software, média, em andamento, há 1 dia), INC-19877 (resolvido há 54 dias), INC-19410 (resolvido há 107 dias) |
| Outros funcionários | INC-20517 (Carla, Rede e VPN, alta), REQ-10448 (Bruno, Acesso, baixa), INC-20402 (Diego, E-mail, resolvido há 9 dias) |
| Conversas do console | 4 conversas em estados variados (agent atendendo, resolvida pelo agent, encerrada, agent pediu ajuda), para a lista não começar vazia |

As datas são relativas ao momento da seed e ajustadas para cair em horário útil. `pnpm --filter @nexo/monolith db:reset` recria os schemas e roda a seed de novo, para a demonstração.

#### Parâmetros fixos (`.env.example`)

| Variável | Padrão | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://nexo:nexo@localhost:5432/nexo` | Substitui o caminho SQLite atual |
| `OPENROUTER_API_KEY` | (vazio) | Obrigatória quando `LLM_PROVIDER=openrouter` |
| `LLM_PROVIDER` | `openrouter` | `scripted` só em `development` e `test` |
| `LLM_MODEL` / `LLM_ROUTER_MODEL` | escolhidos nos evals **[premissa]** | Modelo do laço / do classificador |
| `AGENT_CONFIDENCE_THRESHOLD` | `0.6` | RF25 |
| `LLM_DAILY_BUDGET_USD` | `2` | Teto de custo (RF56) |
| `CHAT_RATE_LIMIT_PER_MINUTE` | `12` | RF54 |
| `SESSION_TTL_HOURS` / `SESSION_REMEMBER_DAYS` | `8` / `7` | Sessão |
| `TICKETS_OUTAGE_MODE` | `off` | `off`, `random` ou `forced` |
| `TICKETS_OUTAGE_PROBABILITY` / `TICKETS_OUTAGE_DURATION_MS` | `0.1` / `4000` | RF39 |
| `SEED_DEMO_DATA` | `true` | Seeds no boot |
| `SERVE_WEB_DIR` | (vazio) | Em produção, o monólito serve o build do `web` |

Constantes no código, e não no `.env`, porque são regra de negócio: 30 mensagens por sessão, 6 passos por turno, janela de 20 mensagens, 7 dias de reabertura, expediente de 8h às 18h, fuso `America/Sao_Paulo`, orçamento de 600.000 tokens de entrada por conversa (cada turno real consome cerca de 13 mil, então 60.000 esgotava a conversa no 5º turno, longe das 30 mensagens do PRD) e política de tentativas do legado (3 tentativas, timeout de 2 s, espera de 300 ms e 900 ms).

### Endpoints da API

Todos sob `/api`. Os erros seguem `ApiError`. Toda rota, exceto `login`, `health` e `logout`, exige o `SessionGuard`. As rotas que escrevem passam também pelo `OriginGuard`. O `requesterId` e o `analystId` vêm sempre da sessão. Campos extras no corpo são rejeitados (`z.strictObject`), o que cobre o CA-02.

#### Visão geral

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Entra e grava o cookie de sessão |
| `POST` | `/api/auth/logout` | Encerra a sessão |
| `GET` | `/api/auth/me` | Usuário e expiração da sessão |
| `GET` | `/api/conversations/current` | Conversa atual e histórico do funcionário |
| `POST` | `/api/conversations/current/messages` | Envia mensagem; resposta em SSE |
| `POST` | `/api/conversations/current/turns/retry` | Refaz o último turno que falhou; SSE |
| `POST` | `/api/conversations/current/handoff` | "Falar com um analista" por botão |
| `GET` | `/api/conversations/current/events` | SSE de atualizações para o funcionário |
| `PATCH` | `/api/conversations/current/pending-actions/:actionId` | Edita o rascunho |
| `POST` | `/api/conversations/current/pending-actions/:actionId/confirm` | Confirma a ação |
| `POST` | `/api/conversations/current/pending-actions/:actionId/cancel` | Cancela a ação |
| `GET` | `/api/tickets` | Chamados do próprio funcionário (leitura) |
| `GET` | `/api/tickets/:number` | Um chamado do próprio funcionário |
| `GET` | `/api/console/conversations` | Lista do console com filtros e contadores |
| `GET` | `/api/console/conversations/:id` | Conversa com histórico, resumo e decisões |
| `GET` | `/api/console/conversations/:id/tickets` | Chamados do funcionário da conversa |
| `POST` | `/api/console/conversations/:id/claim` | Assumir atendimento |
| `POST` | `/api/console/conversations/:id/release` | Devolver ao agent |
| `POST` | `/api/console/conversations/:id/close` | Encerrar atendimento |
| `POST` | `/api/console/conversations/:id/messages` | Mensagem do analista |
| `POST` | `/api/console/conversations/:id/read` | Marca como lida |
| `GET` | `/api/console/events` | SSE de atualizações do console |
| `GET` | `/api/health` | Health check com ping no banco (modificado) |

---

#### `POST /api/auth/login`

Autentica um usuário dos dados de exemplo com qualquer senha não vazia (RF2).

**Corpo**

| Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- |
| `email` | `string` | — | e-mail válido, normalizado para minúsculas |
| `password` | `string` | — | mínimo 1 caractere; nunca registrado em log |
| `remember` | `boolean` | `false` | Sessão longa |

**Respostas**

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `SessionUser` + `Set-Cookie: nexo_session` | Credenciais aceitas |
| `400` | `ApiError` (`validation_error`) | Corpo inválido |
| `401` | `ApiError` (`invalid_credentials`) | E-mail desconhecido ou senha vazia |

**Exemplo — sucesso**

```http
POST /api/auth/login
{ "email": "ana.souza@nexo.com.br", "password": "qualquer", "remember": false }
```

```text
(SessionUser, ver Modelos de dados)
```

**Exemplo — e-mail desconhecido**

```text
{ "error": { "code": "invalid_credentials", "message": "E-mail ou senha incorretos." } }
```

> O `web` redireciona por `role`: `employee` vai para `/atendimento` e `analyst` vai para `/console` (RF3).

---

#### `POST /api/auth/logout` · `GET /api/auth/me`

`logout` limpa o cookie e responde `204`, mesmo sem sessão. `me` responde `200` com `SessionUser`, ou `401 unauthenticated`. O `web` usa `me` como fonte da sessão (`useSession`) e, num `401`, manda para `/login`.

---

#### `GET /api/conversations/current`

Somente `employee`. Devolve `EmployeeConversationView` (RF14, RF16).

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `EmployeeConversationView` | Sempre |
| `200` | `{ "conversation": null, "timeline": [], "usage": { "messagesUsed": 0, "messagesLimit": 30 }, "turnInProgress": false }` | Funcionário sem conversas: o `web` mostra o estado vazio com sugestões |
| `403` | `ApiError` (`forbidden`) | Analista |

---

#### `POST /api/conversations/current/messages`

Somente `employee`. Rate limit por usuário (`@nestjs/throttler`, rastreado pelo `userId` da sessão). Cria a conversa se não houver uma ativa. Erros anteriores ao aceite voltam como JSON. Depois do aceite, a resposta é `text/event-stream` com `ChatStreamEvent`.

**Corpo**

| Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- |
| `text` | `string` | — | 1 a 2.000 caracteres, sem espaços nas pontas |
| `quickReply` | `{ messageId: uuid; optionId: string } \| null` | `null` | A opção precisa existir numa mensagem da conversa ainda não respondida |
| `ticketSelection` | `{ messageId: uuid; number: string } \| null` | `null` | O número precisa estar na seleção mostrada |

**Respostas**

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | stream SSE | Mensagem aceita (inclusive quando o agent está pausado: `turn.skipped`) |
| `400` | `ApiError` (`validation_error`) | Corpo inválido |
| `409` | `ApiError` (`turn_in_progress`) | Turno anterior em andamento |
| `429` | `ApiError` (`message_limit_reached` \| `rate_limited`) | 31ª mensagem na sessão, ou excesso por minuto; o modelo não é chamado |
| `503` | `ApiError` (`budget_exhausted`) | Teto diário atingido antes do aceite; o modelo não é chamado |

**Exemplo — turno com seleção de chamados (CA-06)**

```http
POST /api/conversations/current/messages
{ "text": "Qual o status do meu chamado?" }
```

```text
event: message.accepted
data: {"message":{"author":"employee","text":"Qual o status do meu chamado?","…":"…"},"usage":{"messagesUsed":17,"messagesLimit":30}}

event: turn.step
data: {"step":{"kind":"searched_tickets","label":"consultou seus chamados","result":"3 chamados abertos","status":"ok","attempts":1,"durationMs":88}}

event: turn.text-delta
data: {"delta":"Você tem 3 chamados abertos. Sobre qual deles quer saber?"}

event: turn.part
data: {"part":{"type":"ticket_selection","tickets":[{"number":"INC-20311","…":"…"},{"number":"REQ-10442","…":"…"},{"number":"INC-20298","…":"…"}],"selectedNumber":null}}

event: turn.completed
data: {"message":{"…":"…"},"conversation":{"state":"agent","…":"…"},"usage":{"messagesUsed":17,"messagesLimit":30}}
```

**Exemplo — confirmação por texto com rascunho pendente (sem modelo)**

```text
event: message.accepted
data: {"message":{"text":"sim, pode abrir","…":"…"}}

event: turn.step
data: {"step":{"kind":"executed_action","label":"criou o chamado","result":"INC-20519 criado","status":"ok","attempts":1,"durationMs":140}}

event: turn.completed
data: {"message":{"author":"agent","text":"Pronto: abri o chamado com prioridade alta. Um analista fala com você em até 4 h úteis.","parts":[{"type":"ticket_card","ticket":{"number":"INC-20519","…":"…"}}],"…":"…"}}
```

**Exemplo — agent pausado (CA-20)**

```text
event: message.accepted
data: {"message":{"text":"Posso sim, está ligado.","…":"…"}}

event: turn.skipped
data: {"reason":"with_analyst"}
```

**Exemplo — falha do modelo após o aceite (CA-37)**

```text
event: turn.failed
data: {"error":{"code":"agent_unavailable","message":"Não consegui responder agora. Tente de novo ou fale com um analista."},"retryable":true}
```

> A mensagem do funcionário fica gravada. "Tentar novamente" chama `turns/retry`, que não conta outra mensagem. Se a conexão cair, o `AbortSignal` cancela o modelo e o turno é gravado como `failed`.

---

#### `POST /api/conversations/current/turns/retry`

Refaz o turno da última mensagem do funcionário quando a resposta seguinte é `failed`. Não conta no limite da sessão. Respostas: `200` (SSE, sem `message.accepted`), `409 turn_in_progress` e `404 not_found` (não há turno com falha).

---

#### `POST /api/conversations/current/handoff`

Transfere por botão: oferta de analista, limite atingido ou falha (CA-25, CA-28). O corpo é `{ "reason": "requested" }`. Não conta no limite da sessão.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `Conversation` (`state: "waiting_analyst"`) | Transferida; mensagem de sistema com nível e prazo de contato |
| `409` | `ApiError` (`invalid_conversation_state`) | Já está com analista ou aguardando |
| `404` | `ApiError` (`not_found`) | Sem conversa ativa |

O resumo da transferência por botão é montado pelo código, a partir das decisões (`turn.decision`) das últimas mensagens do agent e dos chamados citados. O modelo não é chamado.

---

#### `GET /api/conversations/current/events` · `GET /api/console/events`

SSE (`@Sse()` com `Observable` do `ConversationEventsHub`), com heartbeat a cada 25 s. O canal do funcionário só recebe eventos das conversas dele. O do console recebe `console.item.updated` de todas as conversas (somente `analyst`) e `message.created`/`conversation.updated` da conversa indicada em `?conversationId=`. O `web` abre com `EventSource(url, { withCredentials: true })`, aplica os eventos ao cache do React Query e, ao reconectar, invalida as queries para recuperar o que perdeu (RF50).

> **[premissa]** O hub fica em memória e supõe uma única instância do monólito, o que basta para a escala de demonstração. Com várias instâncias, ele passaria a usar `LISTEN/NOTIFY` do Postgres sem mudar o contrato.

---

#### `PATCH /api/conversations/current/pending-actions/:actionId`

Edita um rascunho `create_ticket` (RF12, CA-14).

**Corpo** (pelo menos um campo)

| Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- |
| `title` | `string` | — | 5 a 120 caracteres |
| `description` | `string` | — | 10 a 2.000 caracteres |
| `category` | `TicketCategory` | — | enum |
| `affected` | `TicketAffected` | — | enum; muda `priorityFacts.impact` |

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `PendingAction` (`status: "pending"`, prioridade e prazo recalculados) | Editada |
| `404` | `ApiError` (`not_found`) | Ação de outra conversa ou inexistente |
| `409` | `ApiError` (`pending_action_not_pending`) | Já confirmada, cancelada ou substituída |
| `422` | `ApiError` (`validation_error`) | Edição em `complement_ticket` ou `reopen_ticket` |

---

#### `POST /api/conversations/current/pending-actions/:actionId/confirm`

Executa a escrita no `tickets` com `requesterId` da sessão e `idempotencyKey = actionId` (RF24). O corpo é `{ "via": "button" | "shortcut" }`.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `ChatTurnOutcome` = `{ message: ChatMessage; conversation: Conversation }` | Chamado criado, complementado ou reaberto; o card mostra o número definitivo |
| `404` | `ApiError` (`not_found`) | Ação inexistente, de outra pessoa, ou chamado alvo que não é do funcionário |
| `409` | `ApiError` (`pending_action_not_pending`) | Já confirmada (clique duplo devolve o mesmo resultado sem duplicar, pela `idempotencyKey`) |
| `422` | `ApiError` (`ticket_rule_violation`) | Ex.: o chamado foi resolvido há mais de 7 dias entre a proposta e a confirmação |
| `503` | `ApiError` (`tickets_unavailable`) | Legado fora após 3 tentativas; a ação continua `pending` para tentar de novo |

**Exemplo — sucesso**

```text
{ "message": { "author": "agent", "text": "Pronto: abri o chamado com prioridade alta. Um analista fala com você em até 4 h úteis.", "parts": [{ "type": "ticket_card", "ticket": { "number": "INC-20519", "status": "open", "…": "…" } }], "turn": { "steps": [{ "kind": "executed_action", "label": "criou um chamado", "…": "…" }], "…": "…" } }, "conversation": { "state": "agent", "pendingAction": null, "…": "…" } }
```

---

#### `POST /api/conversations/current/pending-actions/:actionId/cancel`

`200` com `PendingAction` (`cancelled`) e uma mensagem de sistema curta. Também responde `404` e `409`, como na confirmação. Nenhuma chamada ao `tickets`.

---

#### `GET /api/tickets` · `GET /api/tickets/:number`

Somente `employee`, leitura dos próprios chamados. `?scope=open|closed|all` (padrão `all`). Usado no "Ver todos os chamados" em modo leitura e nos testes de privacidade.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `TicketSummary[]` / `TicketDetail` | Chamados do solicitante da sessão |
| `200` | `[]` | Sem chamados |
| `404` | `ApiError` (`not_found`) | Número inexistente **ou** de outro funcionário, com o mesmo corpo (CA-08) |
| `503` | `ApiError` (`tickets_unavailable`) | Legado fora após as tentativas |

```text
{ "error": { "code": "not_found", "message": "Chamado não encontrado." } }
```

---

#### `GET /api/console/conversations`

Somente `analyst` (RF45, RF46).

| Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- |
| `filter` | `'all' \| 'for_you' \| 'with_agent' \| 'mine'` | `all` | `for_you` = `waiting_analyst`; `with_agent` = `agent`; `mine` = `with_analyst` assumida pelo analista da sessão |
| `q` | `string` | — | até 60 caracteres; busca no nome do funcionário (sem acento, sem diferenciar maiúsculas) ou no número de chamado citado |

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `ConsoleList` | Sempre; os contadores ignoram `filter` e respeitam `q` |
| `403` | `ApiError` (`forbidden`) | Funcionário |

> Ordenação: `waiting_analyst` primeiro (por `handedOffAt`, mais antiga primeiro), depois por `lastMessageAt` decrescente. Lista sem resultado devolve `items: []`, e o `web` mostra "Nenhuma conversa neste filtro".

---

#### `GET /api/console/conversations/:id`

Somente `analyst`. Devolve `{ conversation: Conversation; timeline: ChatMessage[] }`, com os `turn` completos de cada resposta do agent (RF33, RF47) e os eventos como mensagens `system`. `404` quando não existe.

> **[premissa]** Analistas veem o histórico de qualquer conversa listada, inclusive "Agent atendendo", porque o filtro "Com o agent" faz parte do protótipo. Os chamados do funcionário (painel) só abrem para conversas transferidas (abaixo).

---

#### `GET /api/console/conversations/:id/tickets`

Somente `analyst`. O `AnalystTicketAccess` permite o acesso quando a conversa está em `waiting_analyst`, ou em `with_analyst` assumida pelo analista da sessão (RF36). Depois disso, chama `TicketsApi.listOwn({ requesterId: conversation.employeeId, scope: 'all' })`.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `{ fromConversation: TicketSummary[]; others: { open: TicketSummary[]; closed: TicketSummary[] } }` | Acesso permitido |
| `404` | `ApiError` (`not_found`) | Conversa inexistente ou não transferida a este analista |
| `503` | `ApiError` (`tickets_unavailable`) | Legado fora; o painel mostra o erro com "Tentar novamente" |

---

#### `POST /api/console/conversations/:id/{claim|release|close}`

Somente `analyst`, sem corpo. Respostas `200` com `Conversation`, mensagem de sistema registrada e eventos SSE para os dois lados.

| Ação | Transição | Erros |
| --- | --- | --- |
| `claim` | `waiting_analyst` → `with_analyst` (`assignedAnalyst` = sessão); mensagem "Rafael Lima assumiu · agent pausado · 10:12" | `409 conversation_already_claimed` se outro analista assumiu (a atualização é condicional: `WHERE state = 'waiting_analyst'`); `409 invalid_conversation_state` se a conversa está em `agent` ou `closed` |
| `release` | `with_analyst` → `agent`; a próxima mensagem do funcionário vai para o agent, com as mensagens do analista no contexto | `409 conversation_not_claimed` se não é o analista atribuído |
| `close` | `with_analyst` → `closed` (`resolution: analyst`) | `409 conversation_not_claimed` |

**Exemplo — disputa (CA-32)**

```text
{ "error": { "code": "conversation_already_claimed", "message": "Esta conversa já está sendo atendida por Gabriela Rocha." } }
```

---

#### `POST /api/console/conversations/:id/messages` · `POST /api/console/conversations/:id/read`

`messages`: o corpo é `{ "text": string (1 a 2.000) }`. Responde `201` com `ChatMessage` (`author: analyst`, nome e nível), ou `409 conversation_not_claimed` sem assumir (RF48). `read`: `204`; zera `unreadCount` gravando `analyst_read_at`.

---

## Pontos de integração

**OpenRouter, via Mastra:**

- **Autenticação:** `OPENROUTER_API_KEY` só no backend, validada no boot quando `LLM_PROVIDER=openrouter`. Em produção, a chave tem limite de crédito no próprio OpenRouter, além do `LLM_DAILY_BUDGET_USD`.
- **Classificador:** `agent.generate` com `structuredOutput` (schema `Understanding`), `LLM_ROUTER_MODEL`, temperatura 0, até 300 tokens de saída e timeout de 6 s.
- **Laço de resposta:** `agent.stream` com `maxSteps: 6`, `LLM_MODEL`, até 600 tokens de saída por passo, timeout de 8 s para o primeiro evento e de 25 s para o turno. O adaptador lê `fullStream` (`text-delta`, `tool-call`, `tool-result`, `finish` com `usage`).
- **Custo:** com o usage accounting do OpenRouter, a partir dos metadados do provedor. Sem esse valor, o custo é estimado pelos tokens e por uma tabela de preço por modelo em `persistence/model-prices.ts`.
- **Falhas:**
  - Erro de rede ou 5xx antes do primeiro texto ganha uma nova tentativa.
  - Depois de começar o streaming, não há nova tentativa: o turno termina com `turn.failed` e `retryable: true`.
  - 429 ou 402 do provedor viram `agent_unavailable`.
  - Nunca se repassa a mensagem do provedor ao cliente.
- **Prompt caching:** instruções e definições das tools formam um prefixo fixo e idêntico entre turnos, com a data e o conteúdo variável no fim (cache implícito dos provedores via OpenRouter).

**Sistema de chamados legado (domínio `tickets`):**

- **Simulação:** `LegacyOutageSimulator` com três modos. `random` abre, com probabilidade `p` por chamada, uma janela de `TICKETS_OUTAGE_DURATION_MS`. `forced` mantém o sistema indisponível enquanto o modo estiver ativo, para demonstração e QA. `off` desliga a simulação.
- **Consumidores:** `agent` (`ResilientTicketsApi`) e `chat` (`ConfirmPendingAction` e o painel do console) usam `withResilience`: 3 tentativas, timeout de 2 s por tentativa e espera de 300 ms e 900 ms. Uma janela de 4 s costuma se resolver nas tentativas (CA-28).
- **Escritas:** são idempotentes pela `idempotencyKey`.

**Postgres:**

- **Local:** `docker compose up -d` (imagem `postgres:17`, volume nomeado).
- **Testes:** PGlite em memória, com as mesmas migrations.
- **Pool:** `pg.Pool` com no máximo 10 conexões; health check com `select 1`.

**Deploy [premissa]:**

- **Plataforma:** Railway, com Postgres gerenciado e um serviço único com Dockerfile multi-stage, que faz `pnpm build` e serve o `web` estático pelo monólito (`SERVE_WEB_DIR`). Assim a origem é a mesma e o cookie fica `SameSite=Lax; Secure`.
- **Segredos:** nas variáveis da plataforma.
- **Limites:** rate limit, 30 mensagens por sessão e teto diário de custo.

## Abordagem de testes

A prioridade segue a skill `testes`. As regras de alto risco (prioridade, prazo, vencimento, reabertura, deduplicação, privacidade, confirmação, transferência, limites e decisões do agent) são cobertas por testes unitários do `core`. A integração cobre o contrato HTTP, a autorização, a persistência real (PGlite) e os eventos. O E2E cobre três fluxos críticos com o modelo falso. Os dublês substituem só as bordas: o `LlmClient` (`ScriptedLlmClient`, que falha o teste diante de uma chamada não roteirizada), o relógio (`FakeClock`) e o legado (`FailingTicketsApi` / `LegacyOutageSimulator` em modo `forced`). A cobertura de 80% de linhas e ramos vale só para `packages/*/src/core/**`.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| TU-01 | classifica como alta quando só uma pessoa é afetada e há compromisso no mesmo dia | CA-11 | `high`, 4 horas úteis, regra "compromisso hoje" |
| TU-02 | classifica como crítica quando algo está parado para a equipe ou a empresa | CA-18 | `critical`, 1 hora corrida |
| TU-03 | classifica como média com alternativa e como baixa em pedido sem urgência | CA-35 | `medium` 3 dias úteis; `low` 5 dias úteis |
| TU-04 | soma horas úteis atravessando o fim do expediente e o fim de semana | CA-11 | sexta 16h + 4h úteis = segunda 10h (`America/Sao_Paulo`) |
| TU-05 | conta o prazo crítico em hora corrida fora do expediente | CA-18 | sábado 22h + 1h = sábado 23h |
| TU-06 | marca como vencido um chamado médio sem atualização há mais de 3 dias úteis | CA-07 | INC-20311 com última atualização há 6 dias: `overdue: true`; resolvido nunca vence |
| TU-07 | permite reabrir até 7 dias após a resolução e recusa depois | CA-16 | 4 dias: reabrível; 7 dias exatos: reabrível; 7 dias e 1 minuto: não |
| TU-08 | considera duplicado um chamado aberto do mesmo solicitante sobre o mesmo problema | CA-15 | `openMatches` contém o chamado de VPN; chamado de outro solicitante nunca aparece |
| TU-09 | reconhece frases afirmativas como confirmação e recusa respostas ambíguas | CA-12, CA-13 | "sim", "Pode abrir!", "confirmo" confirmam; "sim, mas troca a categoria", "talvez", "ok?" não |
| TU-10 | só confirma uma ação pendente e substitui a anterior ao propor outra | CA-12, CA-13 | confirmar `cancelled`/`superseded` gera erro; nova proposta marca a anterior `superseded` |
| TU-11 | recalcula prioridade e prazo ao editar afetados ou categoria do rascunho | CA-14 | `affected: my_team` com `blocksWork` vira `critical`; status continua `pending` |
| TU-12 | aplica as transições de estado da conversa | CA-17, CA-29, CA-30, CA-31 | `agent→waiting→with_analyst→agent/closed`; transições inválidas lançam erro |
| TU-13 | recusa assumir conversa já assumida por outro analista | CA-32 | erro `conversation_already_claimed` com o nome de quem assumiu |
| TU-14 | aceita a 30ª mensagem da sessão e recusa a 31ª | CA-25 | 30ª: `remaining = 0`; 31ª: `message_limit_reached`; outra sessão começa do zero |
| TU-15 | define nível e prazo de contato da transferência pelo motivo | CA-17, CA-18 | `requested`/`low_confidence` → N1, 2 h úteis; `critical`/`overdue` → N2; crítico → 1 h |
| TU-16 | transfere sem chamar o laço quando o funcionário pede analista | CA-17 | rota `handoff`; o roteiro do fake não tem chamada ao laço |
| TU-17 | transfere com motivo de baixa confiança abaixo do limite | CA-19 | confiança 0,41 com limite 0,6: `low_confidence`, `confidence: 0.41` no resumo |
| TU-18 | redireciona assunto fora de TI sem tools de chamados | CA-26 | tools disponíveis no laço não incluem `propor_chamado` nem `buscar_chamados` |
| TU-19 | registra exatamente os passos das tools executadas, inclusive falhas e novas tentativas | CA-23, CA-28 | passos = tools executadas, na ordem; falha com `attempts: 3`, `status: failed` |
| TU-20 | usa o requesterId do contexto e rejeita argumentos extras do modelo | CA-02, CA-27 | argumento `requesterId` injetado pelo modelo é rejeitado pelo schema; a consulta usa o id do contexto |
| TU-21 | bloqueia propor chamado quando existe chamado aberto equivalente | CA-15 | resultado `duplicate_found`, sem evento `proposal` |
| TU-22 | propõe reabertura só dentro da janela | CA-16 | INC-20150 (4 dias) emite `proposal reopen`; chamado de 9 dias devolve regra violada |
| TU-23 | encerra o laço no limite de passos com resposta tratada | — (custo) | após 6 passos: `action: degraded`, nenhuma nova chamada ao modelo |
| TU-24 | não chama o modelo quando o teto diário de custo foi atingido | CA-39 | evento `failed` `budget_exhausted`; fake sem chamadas |
| TU-25 | monta a decisão com entendimento, ação, confiança rotulada, motivo e regras | CA-24 | 0,86 → "alta"; `rules` contém a regra de prioridade devolvida pela tool |
| TU-26 | converte dígito em opção rápida quando há opções abertas | CA-10 | "2" com opções [Só eu, Minha equipe…] vira "Minha equipe"; sem opções abertas, segue como texto |
| TU-27 | monta o contexto só com dados da conversa e marca a ação pendente | CA-22, CA-27 | janela ≤ 20 mensagens; mensagens do analista rotuladas; nenhum dado fora da conversa |
| TU-28 | simula indisponibilidade do legado pela duração configurada | CA-28 | modo `forced`/janela ativa lança `TicketsUnavailableError`; após a janela, responde |
| TU-29 | tenta de novo com espera e desiste após o limite | CA-28 | `withResilience` com falha 2× e sucesso na 3ª devolve o valor; 3 falhas propagam o último erro |

Estratégia:

- `tickets/core` concentra a maior parte dos casos (TU-01 a TU-08, TU-28). São testes de tabela com `FakeClock` em datas fixas, incluindo sexta à tarde, fim de semana e virada de expediente.
- `agent/core` (TU-16 a TU-25, TU-27) usa o `ScriptedLlmClient` e fakes em memória de `TicketsApi` e `KnowledgeApi`. Os testes verificam eventos emitidos e estado, não a ordem interna das chamadas.
- `chat/core` (TU-09 a TU-15, TU-26) usa repositórios em memória.
- `shared/resilience` (TU-29) usa timers falsos do Vitest.

### Testes de integração

Backend (`*.integration.test.ts`): Nest real, com `Test.createTestingModule`, PGlite com migrations, `ApiExceptionFilter` registrado no teste, `supertest` e cookie de sessão real. O único dublê é o `LLM_CLIENT` → `ScriptedLlmClient`. Os casos de falha usam também o legado → simulador `forced`.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| TI-01 | autentica funcionário e analista e recusa e-mail desconhecido com mensagem genérica | CA-01 | 200 com `role` correto e cookie httpOnly; 401 `invalid_credentials` |
| TI-02 | responde igual para chamado de outro funcionário e chamado inexistente | CA-08 | `GET /api/tickets/INC-20517` (Carla) e `/INC-99999` com sessão da Ana: mesmo status e corpo |
| TI-03 | aplica o filtro por solicitante em listar, consultar, complementar, reabrir e deduplicar | CA-02, CA-08 | `TicketsApi` com `requesterId` da Ana nunca devolve nem altera chamados de outros |
| TI-04 | rejeita identificador de outro usuário no corpo e mantém os dados da sessão | CA-02 | corpo com `requesterId` → 400; respostas só com dados da sessão |
| TI-05 | entrega o turno por SSE na ordem aceite → passos → texto → concluído e grava o turno | CA-23, CA-37 | eventos na ordem; mensagem do agent persistida com `turn.steps` iguais aos emitidos |
| TI-06 | cria o chamado na confirmação com os seis campos e número definitivo | CA-12, CA-35 | `INC-205xx` com título, descrição, tipo, categoria, prioridade e afetados; confirmar de novo não duplica |
| TI-07 | confirma por frase afirmativa e não grava com outra resposta ou cancelamento | CA-12, CA-13 | "sim" cria sem chamar o modelo; "na verdade é no Wi-Fi" e cancelar não criam |
| TI-08 | recalcula a prioridade ao editar o rascunho | CA-14 | `PATCH` com `affected: my_team` → prioridade nova, `pending` |
| TI-09 | transfere a pedido, publica o evento e registra no histórico do chamado | CA-17 | estado `waiting_analyst`, mensagem com nível e prazo; `ticket_events.handed_off` no INC-20311; item no console com resumo |
| TI-10 | não chama o agent e entrega ao console a mensagem enviada durante a transferência | CA-20 | `turn.skipped`; fake sem chamadas; mensagem no detalhe do console |
| TI-11 | assume, devolve e encerra a conversa e recusa a segunda tentativa de assumir | CA-29, CA-30, CA-31, CA-32 | 200 nas transições; 409 `conversation_already_claimed`; após `release`, o contexto enviado ao agent inclui a mensagem do analista |
| TI-12 | filtra e busca no console com contadores coerentes | CA-33 | `for_you`, `with_agent`, `mine` e `q=INC-20311` devolvem os itens esperados |
| TI-13 | libera os chamados do funcionário só para conversa transferida e bloqueia funcionário no console | CA-34 | 200 em `waiting_analyst`; 404 em conversa `agent`; 403 para `employee` em `/api/console/*` |
| TI-14 | mantém histórico, cards, rascunho pendente e estado após reiniciar a aplicação | CA-21 | fecha e sobe a app sobre o mesmo PGlite (diretório temporário); `GET current` igual ao anterior |
| TI-15 | recusa a 31ª mensagem e o excesso por minuto sem chamar o modelo | CA-25, CA-39 | 429 `message_limit_reached` / `rate_limited`; fake sem chamadas |
| TI-16 | conclui a ação após indisponibilidade curta e degrada quando persiste | CA-28 | janela curta: chamado criado com `attempts > 1`; `forced`: 503 na confirmação e turno degradado com passo `failed` e opções |
| TI-17 | publica no SSE do console nova mensagem e mudança de estado | CA-36 | assinante recebe `console.item.updated` e `message.created` |
| TI-18 | encontra o artigo de horário pela busca em português | CA-04 | "qual o horário do service desk?" → `horario-service-desk` em primeiro |
| TI-19 | carrega os dados de exemplo com o INC-20311 vencido e o INC-20150 reabrível | CA-07, CA-16 | após a seed, `overdue: true` e `reopenable` contém INC-20150 |

Frontend (`*.test.tsx`): Testing Library, `user-event` e MSW 3 (handlers HTTP e `sse`), providers reais e `QueryClient` com `retry: false`.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| TI-20 | mostra o texto do agent chegando aos poucos, os passos e o erro com tentar de novo | CA-23, CA-37 | indicador "digitando…"; texto cresce; `StepsLine` com os rótulos; `role="alert"` e botão "Tentar novamente" |
| TI-21 | confirma o rascunho por clique e por Ctrl/⌘+Enter, cancela e edita | CA-12, CA-13, CA-14 | card passa a mostrar o número definitivo; cancelar mostra estado cancelado; edição mostra prioridade nova |
| TI-22 | responde opções rápidas por clique e pela tecla numérica | CA-10 | tecla "1" envia "Só eu" com `quickReply` |
| TI-23 | escolhe um chamado da lista e mostra o card com prazo vencido | CA-06, CA-07 | seleção vira mensagem do funcionário; card com "prazo vencido" em texto |
| TI-24 | expande o detalhe da decisão com entendimento, ação, confiança e motivo | CA-24 | `aria-expanded` alterna; vê "86% · alta", regra aplicada e resultado de cada passo |
| TI-25 | desabilita o campo em 30/30 com opção de falar com analista | CA-25 | contador "30/30 mensagens nesta sessão"; campo `disabled` com explicação; botão de transferência |
| TI-26 | mostra a conversa transferida e as mensagens do analista com nome e nível | CA-17, CA-20 | faixa "Aguardando atendente"; mensagem de Rafael Lima · Suporte N2 via SSE |
| TI-27 | redireciona por papel após o login e mostra o perfil com redefinir senha desabilitado | CA-01, CA-03 | analista vai para `/console`; "Redefinir senha" `disabled`; erro genérico no login inválido |
| TI-28 | filtra o console, assume, responde, devolve e mostra a recusa de assumir | CA-29, CA-31, CA-32, CA-33 | campo de resposta só após assumir; 409 vira mensagem clara |
| TI-29 | atualiza a lista do console ao receber evento SSE | CA-36 | item muda de status e contador sem recarregar |

### Testes E2E

Playwright em `e2e/`, com o monólito (`LLM_PROVIDER=scripted`, roteiros por cenário em `packages/agent/src/persistence/scripted/scenarios.ts`) e o `web` em portas `30**`/`51**`, banco Postgres de teste recriado por `db:reset` antes da suíte.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| E2E-01 | funcionário entra, relata VPN com erro 809, responde as perguntas e confirma o rascunho | CA-01, CA-05, CA-10, CA-11, CA-12 | passos visíveis; opção "Só eu"; rascunho alta com prazo; Confirmar → card INC definitivo |
| E2E-02 | funcionário pede chamado de outra pessoa e recebe a mesma resposta de inexistente | CA-08, CA-27 | resposta sem dados do INC-20517, igual à de um número inexistente |
| E2E-03 | funcionário pede analista, analista assume, responde, devolve e o agent volta a responder | CA-17, CA-29, CA-30, CA-36 | dois contextos de navegador; estados e eventos aparecem nos dois lados sem recarregar |

### Evals (modelo real, sob demanda)

Não rodam no CI. Comando: `pnpm --filter @nexo/agent eval` (modelo e número de execuções configuráveis). Pontuam por critérios: tool chamada, rota, campos do rascunho em relação ao gabarito, ausência de dado de terceiro, pergunta de esclarecimento. Medem também latência do primeiro trecho e custo, e o resultado vai para o README (CA-40). Cenários:

- dúvida de horário (CA-04);
- erro 809 no Windows 10 e no Windows 11 (CA-05);
- status sem número (CA-06);
- INC-20311 vencido (CA-07);
- complemento (CA-09);
- abertura com coleta mínima (CA-10, CA-11);
- duplicidade de VPN (CA-15);
- reabertura do SAP (CA-16);
- caso crítico de equipe (CA-18);
- pedido ambíguo (CA-19);
- RH e financeiro (CA-26);
- injeção de instrução e chamado alheio (CA-27);
- retomada "e aquele chamado da VPN?" (CA-22).

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Infraestrutura e contratos.** `docker-compose.yml`, `.env.example` e `env.schema.ts`. `shared/database` (Drizzle, `pg`, PGlite de teste, migrations). `shared/auth`, `shared/resilience` e `shared/http` (SSE e códigos de erro). Schemas, tokens e eventos em `@nexo/contracts`. Vem primeiro porque todos os domínios dependem disso, e os contratos deixam o resto ser feito em paralelo.
2. **`identity`** (login, sessão, `me`, seed) e **`tickets/core`** (regras do Anexo A com TU-01 a TU-08). São independentes entre si e podem ser feitos em paralelo.
3. **`tickets/persistence` + HTTP** (repositório com filtro por solicitante, seed, simulador de indisponibilidade, listener de transferência, TI-02, TI-03, TI-19) e **`knowledge`** (busca e seed, TI-18). Em paralelo.
4. **`agent/core`**: `LlmClient`, `ScriptedLlmClient`, tools, `TurnPolicy`, `ResponseLoop`, `StepRecorder`, `DecisionBuilder` e `BudgetGuard` (TU-16 a TU-25). Depende só dos contratos e de fakes de `TicketsApi` e `KnowledgeApi`, então pode começar junto com o passo 3.
5. **`chat/core` + persistence**: estados, ações pendentes, confirmação, transferência, limite e console (TU-09 a TU-15, TU-26). Pode começar após o passo 1, usando fakes de `AgentApi` e `TicketsApi`.
6. **`chat/http` + SSE** e **`agent/persistence`** (`MastraLlmClient`, decoradores resilientes, `agent.runs`). Integração TI-04 a TI-17.
7. **`web` — base**: `AppShell`, login, perfil e cliente SSE (TI-27).
8. **`web` — chat** (TI-20 a TI-26) e **`web` — console** (TI-28, TI-29). Em paralelo, após o passo 7.
9. **Fechamento**: E2E (E2E-01 a E2E-03), evals e escolha do modelo, README (custo medido, decisões), Dockerfile e deploy.

### Dependências técnicas

- Docker local para o Postgres (`docker compose up -d`). Os testes não dependem de Docker (PGlite).
- Chave do OpenRouter só para evals, para uso manual e para o deploy. Testes, E2E e CI usam `LLM_PROVIDER=scripted`.
- Bibliotecas novas:
  - **Backend:**
    - Drizzle e banco: `drizzle-orm`, `drizzle-kit`, `pg`, `@electric-sql/pglite`.
    - Agent: `@mastra/core`, `@openrouter/ai-sdk-provider`.
    - Sessão e HTTP: `jose`, `cookie-parser`, `@nestjs/throttler`, `@nestjs/serve-static`.
    - Datas: `date-fns`, `@date-fns/tz`.
    - Testes: `supertest`.
  - **Frontend:** `eventsource-parser`.
  - Cada dependência é instalada no pacote que a usa, com `pnpm --filter`.
- O `README` precisa caber em 4 comandos: `cp .env.example .env`, `docker compose up -d`, `pnpm install` e `pnpm dev`. As migrations e as seeds rodam no boot.

## Monitoramento e observabilidade

- **Health check:** `GET /api/health` passa a verificar o banco (`select 1`) e responde `503` se ele falhar. O Railway usa essa rota como health check.
- **Logs** (pino, campo `module` com o domínio):
  - `info agent` "turno concluído": `conversationId`, `runId`, `intent`, `confidence`, `action`, `handoffReason`, nomes das tools, `steps`, `models`, `inputTokens`, `outputTokens`, `costUsd`, `firstTokenMs` e `durationMs`. Sem texto do funcionário, do artigo ou do chamado.
  - `warn agent|chat` "nova tentativa no sistema de chamados": `operation`, `attempt`, `elapsedMs`.
  - `warn agent` "orçamento atingido" ou "limite de passos atingido".
  - `info chat`: transferência (`reason`, `level`), assumida, devolvida e encerrada, sempre com ids.
  - `info chat`: confirmação de ação (`kind`, `via`, `ticketNumber`).
  - `error`: falha do modelo ou do legado após as tentativas (`err` sem a resposta do provedor), e erro 5xx não tratado (filtro global).
  - `debug`: prompts e respostas completos só com `LOG_LEVEL=debug` e nunca em produção. O schema de ambiente recusa `debug` quando `NODE_ENV=production`.
- **Registro de decisões (RF34):** a tabela `agent.runs` é a base de análise de custo, de latência (p50/p95 de `first_token_ms`) e dos evals. O script `pnpm --filter @nexo/agent report` resume os últimos N dias para o README.

## Considerações técnicas

### Principais decisões

- **Duas etapas no agent (classificador + laço).** O entendimento estruturado (intenção, confiança e motivo) vem antes de qualquer ação, o que deixa a transferência por baixa confiança, por pedido e por fora de escopo como decisão do código, testável sem modelo. Usa o modelo pequeno onde basta (skill `agent-llm`). O custo é uma chamada a mais por mensagem, de cerca de 300 ms com um modelo pequeno, dentro da meta p50 ≤ 2 s. A alternativa descartada, uma tool obrigatória de "registrar entendimento" no próprio laço, deixa a confiança dependente de o modelo chamar a tool.
- **O modelo só propõe; o código escreve.** Criar, complementar e reabrir são executados por `ConfirmPendingAction` no `chat`, a partir do botão, do atalho ou de `ConfirmationMatcher`, com `idempotencyKey`. Assim a meta "0 escritas sem confirmação" vira uma propriedade do código. A alternativa descartada, uma tool de confirmação chamada pelo modelo, foi rejeitada na fase de esclarecimento.
- **Mastra só em `agent/persistence`.** O `core` define tools neutras e a porta `LlmClient`. O adaptador as converte para `createTool` por turno, com o contexto da sessão em closure, sem precisar de `RequestContext`. Isso atende a preferência do desafio pelo Mastra e mantém o restante do sistema independente do framework. A memória e o storage do Mastra não são usados: o histórico é do `chat`.
- **Postgres + Drizzle com um schema por domínio.** A regra "cada domínio só acessa as próprias tabelas" fica visível no banco, as migrations são por domínio e o deploy fica simples num Postgres gerenciado. Nos testes, PGlite garante persistência real sem Docker. É preciso subir o Postgres localmente (um comando).
- **SSE em vez de WebSocket.** O tráfego é quase todo do servidor para o cliente. O POST com stream entrega o turno, e os GETs entregam atualizações. Funciona com o cookie e com proxies HTTP comuns. No `web`, o POST com stream usa `fetch` (o axios não faz streaming no navegador), dentro de `modules/chat/api`.
- **`tickets` no monólito, como "legado".** O agent o consome só por `TICKETS_API`, com decorador resiliente. O simulador fica num decorador de persistência, sem tocar nas regras. Virar app dedicada exige só trocar o provedor do token por um cliente HTTP (skill `arquitetura-modular`).
- **Prioridade calculada pelo código.** O modelo extrai fatos (impacto, compromisso hoje, alternativa, bloqueio) e `PriorityMatrix` decide. O motivo exibido é a regra devolvida pelo código, não o texto do modelo.
- **Duplicidade com override explícito.** `propor_chamado` recusa quando há chamado aberto equivalente. O modelo só pode seguir citando `notDuplicateOf`, e esse override aparece nas regras da decisão e é contado nos evals.
- **`DEMO_PEOPLE` em `@nexo/contracts`.** As seeds de vários domínios precisam dos mesmos ids. Alternativa descartada: uma seed central na app, que exigiria expor repositórios fora do `index.ts`.

### Riscos conhecidos

- **Latência com duas chamadas e tools.** Mitigação: modelo pequeno no classificador, streaming desde o primeiro trecho, passos emitidos enquanto as tools rodam, prefixo estável para cache e medição de `first_token_ms` nos evals. A meta de latência foi revista na QA (ver o PRD): o que o funcionário percebe é o aceite imediato, o primeiro passo em ~3 s e o texto em ~4,5 s. Se for preciso reduzir mais, o classificador pode ser pulado em mensagens resolvidas por código (confirmação, opção rápida de oferta de analista).
- **Qualidade da extração de fatos de prioridade e do julgamento de aplicabilidade dos artigos.** Mitigação: evals com gabarito, `citar_artigo` obrigando o modelo a declarar `applies` e o motivo, e escolha do modelo pelos resultados.
- **API do Mastra em evolução** (nomes de chunks e opções de `stream`). Mitigação: tudo isolado em `MastraLlmClient`, com um teste de contrato do adaptador contra um modelo fake do AI SDK. Versão fixada no `package.json`.
- **Custo vindo do OpenRouter** (usage accounting) pode não chegar pelos metadados do Mastra. Mitigação: estimativa por tabela de preços, sinalizada como estimativa no registro.
- **PGlite** pode diferir do Postgres em extensões ou na configuração `portuguese` da busca textual. Mitigação: usar só recursos nativos (`to_tsvector` com `portuguese`, sem `unaccent`, normalizando acentos na aplicação). TI-18 roda nos dois bancos no CI, se houver diferença.
- **Hub SSE em memória** só funciona com uma instância. Aceito na escala de demonstração; a evolução é `LISTEN/NOTIFY`.
- **Seeds com datas relativas** mudam com o tempo (por exemplo, o INC-20150 deixa de ser reabrível após 3 dias do boot). Mitigação: `db:reset` documentado e testes com `FakeClock`.
- **Limite de 100 linhas por arquivo** com contratos e controllers extensos. Mitigação: um schema por arquivo em `contracts` e um controller por recurso.

### Conformidade com o CLAUDE.md e as rules

Foram lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`: `modular-architecture.md`, `folder-structure.md`, `code-standards.md`, `javascript-typescript.md`, `security-privacy.md` e `git-commits.md`. Restrições aplicadas:

- **Fronteiras:**
  - Domínios dependem só de `shared` e `contracts`.
  - Comunicação por tokens `@Global()` e pelo evento `chat.conversation.handed-off`.
  - `index.ts` exporta só o módulo.
  - `http → core ← persistence`.
  - `check:boundaries` sem exceções.
  - Os subpaths novos de `shared` (`auth`, `resilience`, `database/testing`) são infraestrutura sem regra de negócio.
- **Privacidade:**
  - `requesterId` só da sessão ou do dono da conversa.
  - Filtro no repositório de `tickets`.
  - 404 indistinguível.
  - Analista só com papel e em conversa transferida.
  - Contexto do modelo só com a conversa e a central de ajuda.
  - Textos tratados como dado, delimitados no prompt.
- **Escritas:** só após confirmação registrada (`pending_actions.confirmed_via`) e verificada no código.
- **Entradas:**
  - zod na borda HTTP, nos argumentos das tools e na leitura de `jsonb`.
  - CORS com `WEB_ORIGIN`.
  - Limite de corpo de 32 kB.
  - Rate limit por usuário no chat.
  - Erros sem stack nem detalhe do provedor.
- **Segredos:** só no `.env` via `@nexo/shared/config` (sem `process.env` fora dele), nada em `VITE_*`, prompts e conteúdo de chamados fora dos logs `info+`.
- **Senhas:** o login aceita qualquer senha não vazia (RF2) e não armazena senha, então não há hash a fazer. A senha nunca vai para o log nem é persistida.
- **Código:** limites de 100 linhas por arquivo, 30 por função e 3 parâmetros (objetos-parâmetro nos casos de uso), sem comentários, constantes nomeadas para as regras e imports relativos com `.js`.
- **Commits:** Conventional Commits por domínio, pequenos, citando `tasks/prd-nexo-assist/task_N.md`.

### Conformidade com skills

- **`arquitetura-modular`:** interfaces e tokens em `contracts`, módulos provedores `@Global()`, evento `<módulo>.<entidade>.<ação>`, listener que trata o próprio erro, `tickets` pronto para virar app pela troca do provedor do token.
- **`nestjs`:** controllers finos com `ZodValidationPipe`, `AppConfig` para o ambiente, `PinoLogger` com contexto por domínio, `APP_FILTER` global, `enableShutdownHooks` com fechamento idempotente do pool, timeouts e tentativas nas chamadas externas. Desvio: o POST com stream escreve direto na `Response` do Express (`@Res()`), porque `@Sse()` só atende GET. Fica encapsulado em `SseResponse` de `shared/http`.
- **`agent-llm`:** porta `LlmClient` no `core` com o provedor em `persistence`, laço limitado (6 passos), tools com schema zod de entrada e saída no mesmo arquivo, regras no código, modelo por etapa, prompt caching por prefixo estável, orçamento por conversa e teto diário, streaming, registro por turno sem conteúdo sensível, passos gerados pelo código e transferência com resumo em falhas repetidas.
- **`testes`:**
  - Casos priorizados por risco: TU no `core`, TI para HTTP, persistência, autorização e eventos, e só 3 E2E com modelo falso.
  - Fakes só nas bordas.
  - Cobertura de 80% restrita a `core/`.
  - `unplugin-swc` nos pacotes Nest.
  - Desvio: a seção "Evals" foi acrescentada às camadas TU/TI/E2E do template, porque a qualidade do modelo só se mede com o modelo real (`references/agent.md`).
- **`react`:**
  - Componentes de até 30 linhas.
  - Hooks de dados com React Query e chaves por módulo.
  - SSE em `useEffect` (sistema externo) atualizando o cache.
  - Sem copiar dados do servidor para `useState`.
  - shadcn/ui e tokens de tema.
  - `aria-live="polite"` para a resposta do chat, com o anúncio só ao concluir o turno para não repetir trechos.
  - `role="alert"` nos erros.
  - Desvios:
    - `fetch` no lugar do axios só para o POST com stream (o axios não faz streaming no navegador).
    - Componentes compartilhados entre chat e console (`components/agent-turn`, `components/tickets`) ficam em `components/`, como pede a regra de módulos.

### Arquivos relevantes e dependentes

Existentes que serão alterados:

- `.env.example`, `packages/shared/src/config/env.schema.ts` (+ teste): novas variáveis, e `DATABASE_URL` para Postgres.
- `packages/shared/src/database/*`: `DatabaseModule` com o token `DATABASE`, migrations e PGlite de teste.
- `packages/shared/src/http/api-exception.filter.ts`, `zod-validation.pipe.ts` e `index.ts`: códigos de erro e `SseResponse`.
- `packages/shared/package.json`: subpaths `auth`, `resilience` e `database/testing`.
- `packages/contracts/src/index.ts`, `events.ts`: novos contratos, tokens e evento.
- `packages/{identity,knowledge,tickets,chat,agent}/src/*.module.ts`, `package.json` e `vitest.config.ts` (`unplugin-swc` e cobertura do `core`).
- `apps/monolith/src/main.ts` (`cookie-parser`, limite de corpo), `monolith.module.ts` (throttler, serve-static), `health.controller.ts` (ping no banco) e `package.json` (`db:reset`).
- `apps/web/src/app/router.tsx`, `providers.tsx`, `lib/http.ts` (interceptor de `ApiError` e redirecionamento em 401); remoção de `status-page.tsx`, `use-api-health.ts` e `modules/tickets/`.
- `.claude/rules/folder-structure.md`: subpaths novos de `shared`, `drizzle/` e `evals/`.
- `turbo.json`: tarefa `eval` sem cache.

Novos:

- `docker-compose.yml`, `Dockerfile`, `README.md`.
- `packages/shared/src/{auth,resilience}/**` e `packages/shared/src/database/testing/**`.
- `packages/contracts/src/{identity,knowledge,tickets,chat,agent,console}/**`, `demo-people.ts` e `errors.ts`.
- `packages/<domínio>/src/{core,persistence,http}/**` e `packages/<domínio>/drizzle/**`.
- `packages/agent/evals/**`.
- `apps/web/src/modules/{identity,chat,console}/**`, `apps/web/src/components/{agent-turn,tickets}/**` e `apps/web/src/test/{server,render}.ts(x)`.
- `e2e/{playwright.config.ts,*.spec.ts}`.
