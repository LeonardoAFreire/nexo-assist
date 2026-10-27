# Tarefa 13.0: `agent/core`: entendimento, política de turno, contexto, laço e `AgentService`

## Visão geral

Orquestra o turno do agent em duas etapas: o classificador registra o entendimento, a `TurnPolicy` decide no código a rota (transferir, redirecionar ou responder) e o laço de resposta, limitado a 6 passos e com as tools filtradas pela rota, conversa com o funcionário. Inclui o contexto, o orçamento e o catálogo de prompts. O `AgentService` implementa `AgentApi.respond`.

<skills>
### Conformidade com skills

- `agent-llm`: laço limitado, regras no código e não no prompt, modelo por etapa, prefixo estável para prompt caching, orçamento por conversa e teto diário, streaming e transferência com resumo em falhas repetidas.
- `testes`: `ScriptedLlmClient` e fakes; `references/agent.md`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: contexto do modelo só com dados da conversa e da central de ajuda; texto do usuário delimitado como dado; nunca registrar prompts completos em `info`.
- `code-standards.md`: 6 passos, janela de 20 mensagens e 60.000 tokens por conversa como constantes.
</rules>

<requirements>
- RF18: intenção pelo classificador (`Understanding`).
- RF25: `analyst_request` transfere sem chamar o laço; confiança abaixo de `AGENT_CONFIDENCE_THRESHOLD` transfere com `low_confidence`; rascunho crítico transfere no mesmo turno.
- RF26: `out_of_scope` usa o laço sem tools de chamados.
- RF20: chamado vencido mostrado inclui as opções fixas "Falar com um analista", "Adicionar informação" e "Não, obrigado".
- RF28: contexto com 20 mensagens, ação pendente e mensagens do analista rotuladas.
- RF29: limite de passos, orçamento ou falhas repetidas terminam com resposta degradada e opções "Tentar de novo" e "Falar com um analista".
- RF54, RF56: `BudgetGuard` com teto diário (`LLM_DAILY_BUDGET_USD`) e tokens por conversa, sem chamar o modelo quando estourado.
</requirements>

## Subtarefas

- [x] 13.1 `UnderstandingStep` e `ContextBuilder`.
- [x] 13.2 `TurnPolicy` com as rotas e as tools permitidas por rota.
- [x] 13.3 `PromptCatalog` (instruções estáveis no início, conteúdo variável no fim).
- [x] 13.4 `ResponseLoop` e `BudgetGuard`.
- [x] 13.5 `AgentService.respond` emitindo `AgentTurnEvent` e gravando o registro do turno pela porta `AgentRunRepository`.

## Detalhes de implementação

- TechSpec, "Domínio `agent`", itens do `core`.
- TechSpec, "Principais interfaces", lista "O que a `TurnPolicy` decide no código".
- TechSpec, "Understanding" e "AgentTurnInput e AgentTurnEvent".
- TechSpec, "Principais decisões", "Duas etapas no agent".

## Critérios de aceitação relacionados

- CA-07
- CA-17
- CA-18
- CA-19
- CA-22
- CA-26
- CA-27
- CA-39

## Testes da tarefa

### Testes de unidade

- [x] TU-16 — transfere sem chamar o laço quando o funcionário pede analista.
- [x] TU-17 — transfere com motivo de baixa confiança abaixo do limite.
- [x] TU-18 — redireciona assunto fora de TI sem tools de chamados.
- [x] TU-23 — encerra o laço no limite de passos com resposta tratada.
- [x] TU-24 — não chama o modelo quando o teto diário de custo foi atingido.
- [x] TU-27 — monta o contexto só com dados da conversa e marca a ação pendente.

## Arquivos relevantes

- `packages/agent/src/core/{understanding-step,turn-policy,context-builder,prompt-catalog,response-loop,budget-guard,agent.service}.ts` (novos)
