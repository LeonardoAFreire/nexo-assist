# Tarefa 12.0: `agent/core`: tools de proposta e `DecisionBuilder`

## Visão geral

Implementa as tools que levam a uma escrita, sempre como proposta (o modelo nunca escreve), e o `DecisionBuilder`, que monta a `AgentDecision` exibida no detalhe de cada resposta a partir do entendimento, das tools executadas e das regras devolvidas pelos domínios.

<skills>
### Conformidade com skills

- `agent-llm`: o modelo só propõe; regras no código (prioridade, duplicidade e reabertura vêm de `TicketsApi`); motivo exibido é a regra devolvida pelo código.
- `testes`: fakes de `TicketsApi`; verificar eventos emitidos e não a ordem interna das chamadas.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: escritas só após confirmação, então as tools só emitem `proposal`; autorização validada no código.
- `code-standards.md`: rótulos de confiança (≥ 0,8 alta; ≥ 0,6 média) como constantes nomeadas.
</rules>

<requirements>
- RF21, RF22: `classificar_prioridade` e `propor_chamado` com os seis campos e prioridade calculada por `assessPriority`.
- RF23: `propor_chamado` devolve `duplicate_found` com chamado aberto equivalente não citado em `notDuplicateOf`; `propor_complemento` exige chamado aberto; `propor_reabertura` respeita a janela de 7 dias.
- RF25: `transferir_para_analista` emite `handoff-requested`.
- RF31: `AgentDecision` com entendimento, ação, confiança com rótulo, motivo, regras e transferência.
</requirements>

## Subtarefas

- [ ] 12.1 `classificar_prioridade`.
- [ ] 12.2 `propor_chamado`, com `findDuplicates` e o override `notDuplicateOf` registrado nas regras.
- [ ] 12.3 `propor_complemento` e `propor_reabertura`.
- [ ] 12.4 `transferir_para_analista`.
- [ ] 12.5 `DecisionBuilder`, incluindo `action.kind = degraded` em falha do legado.

## Detalhes de implementação

- TechSpec, "Principais interfaces", tabela de tools (linhas de proposta e transferência).
- TechSpec, "AgentStep e AgentDecision", incluindo a nota de falha do legado.
- TechSpec, "Principais decisões", itens "O modelo só propõe" e "Duplicidade com override explícito".

## Critérios de aceitação relacionados

- CA-09
- CA-11
- CA-15
- CA-16
- CA-24

## Testes da tarefa

### Testes de unidade

- [ ] TU-21 — bloqueia propor chamado quando existe chamado aberto equivalente.
- [ ] TU-22 — propõe reabertura só dentro da janela.
- [ ] TU-25 — monta a decisão com entendimento, ação, confiança rotulada, motivo e regras.

## Arquivos relevantes

- `packages/agent/src/core/tools/*.ts`
- `packages/agent/src/core/decision-builder.ts` (novo)
