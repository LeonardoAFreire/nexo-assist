# Tarefa 7.0: `tickets/core`: regras do Anexo A (prioridade, prazos, vencimento, reabertura, duplicidade)

## Visão geral

Implementa, como funções e classes puras do `core` de `tickets`, as regras do service desk que o sistema garante: a matriz de prioridade, o calendário de horas úteis, o prazo por prioridade, o vencimento, a janela de reabertura de 7 dias e a detecção de duplicidade. É a tarefa com mais testes de unidade.

<skills>
### Conformidade com skills

- `testes`: testes de tabela com `FakeClock` em datas fixas (sexta à tarde, fim de semana, virada de expediente); cobertura de 80% do `core`.
- `arquitetura-modular`: regras do service desk ficam no domínio dono dos dados.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `code-standards.md`: constantes nomeadas para expediente (8h às 18h), fuso `America/Sao_Paulo`, 7 dias de reabertura e prazos; funções de até 30 linhas; guardas em vez de `if` aninhado.
- `security-privacy.md`: `DuplicateFinder` só considera chamados do mesmo solicitante.
</rules>

<requirements>
- RF22: matriz de prioridade (impacto + urgência), com a regra aplicada em linguagem simples.
- RF23: duplicidade (abertos semelhantes) e reabertura (resolvidos há até 7 dias).
- RF38: prazos em horas e dias úteis (segunda a sexta, 8h às 18h); crítica em 1 hora corrida; prazo vale da abertura ou da última atualização; vencido após o prazo.
</requirements>

## Subtarefas

- [x] 7.1 Porta `Clock` e `FakeClock` de teste.
- [x] 7.2 `ServiceDeskCalendar` com `date-fns` e `@date-fns/tz`.
- [x] 7.3 `PriorityMatrix` com as 4 regras em ordem.
- [x] 7.4 `DeadlinePolicy` e `OverduePolicy`.
- [x] 7.5 `ReopenPolicy` e `DuplicateFinder` (semelhança por categoria ou texto, sem acento e sem diferenciar maiúsculas).

## Detalhes de implementação

- TechSpec, "Domínio `tickets`", itens do `core`.
- TechSpec, "PriorityFacts e PriorityAssessment", regras e premissa de 1 dia útil = 10 horas úteis.
- TechSpec, "DuplicateCheck".

## Critérios de aceitação relacionados

- CA-07
- CA-11
- CA-15
- CA-16
- CA-18
- CA-35

## Testes da tarefa

### Testes de unidade

- [x] TU-01 — classifica como alta quando só uma pessoa é afetada e há compromisso no mesmo dia.
- [x] TU-02 — classifica como crítica quando algo está parado para a equipe ou a empresa.
- [x] TU-03 — classifica como média com alternativa e como baixa em pedido sem urgência.
- [x] TU-04 — soma horas úteis atravessando o fim do expediente e o fim de semana.
- [x] TU-05 — conta o prazo crítico em hora corrida fora do expediente.
- [x] TU-06 — marca como vencido um chamado médio sem atualização há mais de 3 dias úteis.
- [x] TU-07 — permite reabrir até 7 dias após a resolução e recusa depois.
- [x] TU-08 — considera duplicado um chamado aberto do mesmo solicitante sobre o mesmo problema.

## Arquivos relevantes

- `packages/tickets/src/core/**` (novo)
- `packages/tickets/package.json` (`date-fns`, `@date-fns/tz`)
