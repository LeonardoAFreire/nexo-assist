# Tarefa 9.0: `tickets`: persistência, seed, simulador do legado, leitura HTTP e listener de transferência

## Visão geral

Liga o `core` de `tickets` ao Postgres, carrega os chamados do Anexo B, simula a indisponibilidade do legado, expõe a leitura dos próprios chamados por HTTP e registra a transferência no histórico dos chamados ao receber o evento do `chat`.

<skills>
### Conformidade com skills

- `nestjs`: módulo `@Global()` exportando `TICKETS_API`, migrations em `onModuleInit`, seed em `onApplicationBootstrap`, controller fino.
- `arquitetura-modular`: listener de `chat.conversation.handed-off` que trata o próprio erro; simulador como decorador de persistência, sem tocar nas regras.
- `testes`: integração com PGlite e `supertest`; simulador em modo `forced`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: filtro por `requesterId` no `WHERE` do repositório; 404 idêntico para chamado alheio e inexistente.
- `modular-architecture.md`: schema `tickets` próprio, sem FK para outros schemas.
- `code-standards.md`: datas da seed relativas ao momento da seed, em horário útil.
</rules>

<requirements>
- RF35, RF36, RF37: persistência e filtro por solicitante.
- RF39: `LegacyOutageSimulator` com os modos `off`, `random` e `forced`.
- RF40: seed com os chamados da Ana (INC-20311 vencido, REQ-10442, INC-20150 resolvido há 4 dias, INC-20298, INC-19877, INC-19410) e de outros funcionários (INC-20517, REQ-10448, INC-20402).
- RF44: transferência registrada no histórico dos chamados citados.
- `GET /api/tickets` e `GET /api/tickets/:number`, só `employee`.
</requirements>

## Subtarefas

- [ ] 9.1 Schemas Drizzle `tickets.tickets`, `ticket_events` (`idempotency_key` único parcial) e `ticket_sequences`, com as migrations.
- [ ] 9.2 `DrizzleTicketRepository`, com busca textual em `title || description`.
- [ ] 9.3 `LegacyOutageSimulator` como decorador do repositório, configurado pelo `.env`.
- [ ] 9.4 Seed com datas relativas.
- [ ] 9.5 `TicketsController` e listener do evento de transferência.
- [ ] 9.6 `TicketsModule` `@Global()` com o token `TICKETS_API`.

## Detalhes de implementação

- TechSpec, "Domínio `tickets`", itens de `persistence/` e `http/`.
- TechSpec, "Esquema do banco", linhas de `tickets.*`.
- TechSpec, "Dados de exemplo (RF40)".
- TechSpec, "`GET /api/tickets` · `GET /api/tickets/:number`".
- TechSpec, "Pontos de integração", simulação do legado.

## Critérios de aceitação relacionados

- CA-02
- CA-07
- CA-08
- CA-16
- CA-28

## Testes da tarefa

### Testes de unidade

- [ ] TU-28 — simula indisponibilidade do legado pela duração configurada.

### Testes de integração

- [ ] TI-02 — responde igual para chamado de outro funcionário e chamado inexistente.
- [ ] TI-03 — aplica o filtro por solicitante em listar, consultar, complementar, reabrir e deduplicar.
- [ ] TI-19 — carrega os dados de exemplo com o INC-20311 vencido e o INC-20150 reabrível.
- [ ] Listener: o evento `chat.conversation.handed-off` grava `handed_off` no histórico do chamado citado; falha do legado não propaga.

## Arquivos relevantes

- `packages/tickets/src/{persistence,http}/**`
- `packages/tickets/drizzle/**` (novo)
- `packages/tickets/src/tickets.module.ts`, `index.ts`, `package.json`
