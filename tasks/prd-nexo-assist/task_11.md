# Tarefa 11.0: `agent/core`: fundações (`LlmClient`, fake, `StepRecorder`) e tools de consulta

## Visão geral

Cria a base do agent independente de framework: a porta `LlmClient`, o tipo `AgentTool`, o `TurnContext`, o `ScriptedLlmClient` usado em todos os testes, o `StepRecorder` que gera os passos a partir da execução real das tools e as tools que só leem dados ou mostram componentes.

<skills>
### Conformidade com skills

- `agent-llm`: porta `LlmClient` no `core`; tools com schema zod de entrada e saída no mesmo arquivo; passos gerados pelo código; `requesterId` só no contexto.
- `testes`: `ScriptedLlmClient` falha o teste diante de chamada não roteirizada; fakes em memória de `TicketsApi` e `KnowledgeApi` (ver `references/agent.md`).
- `arquitetura-modular`: o agent consome `TICKETS_API` e `KNOWLEDGE_API` só pelos contratos.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: nenhuma tool tem `requesterId` no schema; argumentos do modelo validados com zod; texto de artigos e chamados é dado; resultado neutro `not_found` para chamado alheio.
- `modular-architecture.md`: o agent nunca importa `tickets` nem `knowledge`.
- `folder-structure.md`: uma tool por arquivo em `agent/core/tools/`.
</rules>

<requirements>
- RF7, RF30, RF32: passos com rótulo, resultado resumido, status, tentativas e duração, a partir das tools executadas.
- RF9, RF10, RF19, RF20: tools `buscar_chamados`, `consultar_chamado`, `buscar_central`, `citar_artigo`, `perguntar_opcoes`, `mostrar_selecao` e `mostrar_chamado`.
- RF27: `citar_artigo` só aceita artigo vindo de uma busca do turno; `mostrar_selecao` só mostra números do funcionário.
- `ScriptedLlmClient` ativado por `LLM_PROVIDER=scripted`.
</requirements>

## Subtarefas

- [ ] 11.1 Portas `LlmClient` e `AgentRunRepository`, tipos `AgentTool`, `TurnContext` e `LlmEvent`.
- [ ] 11.2 `ScriptedLlmClient` em `persistence/scripted/` e fakes de `TicketsApi` e `KnowledgeApi` para testes.
- [ ] 11.3 `StepRecorder`: decora `execute`, grava passos, tentativas (via `onAttemptFailed`) e falhas, e emite `step`.
- [ ] 11.4 Tools de consulta e de exibição, uma por arquivo, com `stepLabel`.

## Detalhes de implementação

- TechSpec, "Principais interfaces", portas internas do `agent/core` e tabela de tools.
- TechSpec, "AgentStep e AgentDecision".
- TechSpec, "Abordagem de testes", estratégia de `agent/core`.

## Critérios de aceitação relacionados

- CA-02
- CA-05
- CA-06
- CA-07
- CA-08
- CA-10
- CA-23
- CA-27

## Testes da tarefa

### Testes de unidade

- [ ] TU-19 — registra exatamente os passos das tools executadas, inclusive falhas e novas tentativas.
- [ ] TU-20 — usa o `requesterId` do contexto e rejeita argumentos extras do modelo.
- [ ] `consultar_chamado` devolve o mesmo `not_found` para chamado alheio e inexistente; `citar_artigo` recusa artigo que não veio da busca do turno.

## Arquivos relevantes

- `packages/agent/src/core/**` (novo): portas, `step-recorder.ts`, `tools/*.ts`
- `packages/agent/src/persistence/scripted/**` (novo)
