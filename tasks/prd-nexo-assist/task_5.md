# Tarefa 5.0: Contratos em `@nexo/contracts`: modelos, tokens, eventos e erros

## Visão geral

Define todos os schemas zod e tipos que atravessam fronteiras: modelos de dados, interfaces e tokens das APIs entre domínios, eventos SSE, o evento de transferência, os erros de fronteira e os dados das pessoas de exemplo. É o que permite fazer backend e frontend em paralelo.

<skills>
### Conformidade com skills

- `arquitetura-modular`: interfaces e tokens em `contracts`, nome de evento `<módulo>.<entidade>.<ação>`.
- `agent-llm`: `Understanding`, `AgentStep` e `AgentDecision` como contratos de transparência.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `modular-architecture.md`: `contracts` não depende de domínios.
- `folder-structure.md`: um tipo por arquivo, com o nome do conceito.
- `code-standards.md`: 100 linhas por arquivo; um schema por arquivo.
- `security-privacy.md`: corpos de requisição com `z.strictObject` (rejeitam campos extras como `requesterId`).
</rules>

<requirements>
- Schemas e tipos de todos os modelos da seção "Modelos de dados" da TechSpec. `SessionUser.session` contém só `expiresAt`; o contador vem de `EmployeeConversationView.usage`.
- Schemas dos corpos e parâmetros de cada endpoint, com `z.strictObject`.
- Interfaces e tokens `IDENTITY_API`, `KNOWLEDGE_API`, `TICKETS_API` e `AGENT_API`.
- Evento `chat.conversation.handed-off` (`ChatConversationHandedOff`).
- Erros `TicketsUnavailableError`, `TicketNotFoundError` e `TicketRuleViolationError`.
- `DEMO_PEOPLE` com ids fixos, nomes, e-mails, papéis, setores e níveis.
</requirements>

## Subtarefas

- [x] 5.1 `identity/`: `SessionUser`, `UserProfile`, `LoginRequest`, `IdentityApi` e o token.
- [x] 5.2 `tickets/`: `TicketSummary`, `TicketDetail`, enums, `PriorityFacts`, `PriorityAssessment`, `DuplicateCheck`, `TicketDraft`, `TicketsApi` e o token.
- [x] 5.3 `knowledge/`: `ArticleExcerpt`, `KnowledgeApi` e o token.
- [x] 5.4 `agent/`: `Understanding`, `AgentStep`, `AgentDecision`, `AgentTurnInput`, `AgentTurnEvent`, `AgentApi` e o token.
- [x] 5.5 `chat/`: `ChatMessage`, `MessagePart`, `PendingAction`, `Conversation`, `HandoffInfo`, `EmployeeConversationView`, `ChatStreamEvent`, `ConversationStreamEvent` e os corpos das rotas.
- [x] 5.6 `console/`: `ConsoleConversationItem`, `ConsoleList`, `ConsoleStreamEvent` e as consultas.
- [x] 5.7 `events.ts`, `errors.ts`, `demo-people.ts` e `index.ts`.

## Detalhes de implementação

- TechSpec, "Principais interfaces" (contratos públicos).
- TechSpec, "Modelos de dados", todas as subseções.
- TechSpec, "Endpoints da API", tabelas de corpo e parâmetros.
- TechSpec, "Dados de exemplo (RF40)", para `DEMO_PEOPLE`.

## Critérios de aceitação relacionados

- CA-02

## Testes da tarefa

### Testes de unidade

- [x] Os corpos de requisição recusam campos extras (`requesterId`) e aceitam os exemplos da TechSpec.
- [x] `MessagePart` e `AgentTurnEvent` discriminam corretamente pelo `type`.

## Arquivos relevantes

- `packages/contracts/src/{identity,tickets,knowledge,agent,chat,console}/**` (novo)
- `packages/contracts/src/events.ts`, `errors.ts` (novo), `demo-people.ts` (novo), `index.ts`
