# Tarefa 8.0: `tickets/core`: casos de uso, numeração e `TicketsService`

## Visão geral

Monta os casos de uso de escrita e consulta do `tickets` sobre as regras da tarefa 7 e implementa a `TicketsApi` no `TicketsService`. Define a porta `TicketRepository`, com o `requesterId` obrigatório em toda operação, e um repositório em memória para os testes.

<skills>
### Conformidade com skills

- `arquitetura-modular`: `TicketsService` implementa o contrato de `@nexo/contracts`; erros de fronteira de `contracts`.
- `testes`: repositório em memória e `FakeClock`; testes de privacidade no `core`.
- `nestjs`: provider por token e injeção da porta.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: regra "chamado só para quem o abriu" aplicada no `core` e coberta por testes de listar, consultar, atualizar, reabrir e duplicar; "não encontrado" e "não é seu" indistinguíveis (`TicketNotFoundError`).
- `code-standards.md`: objetos-parâmetro nos casos de uso (no máximo 3 parâmetros).
</rules>

<requirements>
- RF35: consultar por funcionário, número e texto; criar, complementar, reabrir; registrar transferência.
- RF36: toda operação restrita ao solicitante.
- RF37: numeração `INC-xxxxx`/`REQ-xxxxx` (INC a partir de 20520, REQ a partir de 10450), status e datas.
- Escritas idempotentes pela `idempotencyKey`: repetir devolve o mesmo chamado.
- `ReopenTicket` recusa fora da janela com `TicketRuleViolationError`; `ComplementTicket` exige chamado aberto e reinicia o prazo.
</requirements>

## Subtarefas

- [ ] 8.1 Porta `TicketRepository` (todas as consultas recebem `requesterId`) e repositório em memória de teste.
- [ ] 8.2 `TicketNumberGenerator`.
- [ ] 8.3 `CreateTicket`, `ComplementTicket`, `ReopenTicket` e `RecordHandoff`, com eventos de histórico e `idempotencyKey`.
- [ ] 8.4 `TicketsService` implementando todos os métodos de `TicketsApi`, incluindo `assessPriority`, `findDuplicates` e `contactDeadline`, com `overdue`, `dueAt` e `latestEvent` calculados.

## Detalhes de implementação

- TechSpec, "Domínio `tickets`", casos de uso e `TicketsService`.
- TechSpec, "Principais interfaces", `TicketsApi` e o parágrafo sobre `TicketNotFoundError` e `idempotencyKey`.
- TechSpec, "TicketSummary e TicketDetail".

## Critérios de aceitação relacionados

- CA-08
- CA-09
- CA-12
- CA-16
- CA-35

## Testes da tarefa

### Testes de unidade

- [ ] `TicketsService` com chamados de dois solicitantes: listar, consultar, complementar, reabrir e `findDuplicates` nunca devolvem nem alteram chamados do outro; consulta de chamado alheio e inexistente lança o mesmo erro.
- [ ] `CreateTicket` com a mesma `idempotencyKey` duas vezes devolve o mesmo número.
- [ ] `ReopenTicket` fora de 7 dias lança `TicketRuleViolationError`; `ComplementTicket` em chamado resolvido é recusado.

## Arquivos relevantes

- `packages/tickets/src/core/**`
