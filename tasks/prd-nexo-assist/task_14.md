# Tarefa 14.0: `agent/persistence`: `MastraLlmClient`, decoradores resilientes, `agent.runs` e módulo

## Visão geral

Conecta o agent ao mundo real: o adaptador Mastra + OpenRouter (único ponto que importa esses pacotes), os decoradores com nova tentativa sobre `TICKETS_API` e `KNOWLEDGE_API`, o registro de cada turno em `agent.runs` e o `AgentModule`, que escolhe o cliente pelo `LLM_PROVIDER` e exporta `AGENT_API`.

<skills>
### Conformidade com skills

- `agent-llm`: provedor só em `persistence`; timeouts por etapa; nova tentativa só antes do primeiro texto; 429/402 viram `agent_unavailable`; custo pelo usage accounting ou por tabela de preços; log `info` do turno sem conteúdo sensível.
- `nestjs`: provider escolhido por configuração, módulo `@Global()`, migrations no ciclo de vida.
- `arquitetura-modular`: decoradores sobre os tokens públicos, sem importar outros domínios.
- `testes`: teste de contrato do adaptador contra um modelo fake do AI SDK.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: `OPENROUTER_API_KEY` só no backend; nunca repassar a mensagem do provedor ao cliente; `agent.runs` sem textos do funcionário; prompts completos só em `debug`.
- `code-standards.md`: política de tentativas (3, 2 s, 300 ms e 900 ms) como constantes.
</rules>

<requirements>
- `MastraLlmClient.understand` (saída estruturada, temperatura 0, 300 tokens, 6 s) e `respond` (`maxSteps: 6`, 600 tokens por passo, 8 s até o primeiro evento, 25 s por turno), lendo `fullStream`.
- `ResilientTicketsApi` e `ResilientKnowledgeApi` com `withResilience` e `onAttemptFailed` para os passos.
- `DrizzleAgentRunRepository` e a tabela `agent.runs` (RF34).
- `LLM_PROVIDER=scripted` usa o `ScriptedLlmClient`.
</requirements>

## Subtarefas

- [x] 14.1 Instalar `@mastra/core` e `@openrouter/ai-sdk-provider` com versão fixa no pacote `agent`.
- [x] 14.2 `MastraLlmClient`: criação das tools do Mastra por turno com o contexto em closure; tabela `model-prices.ts`.
- [x] 14.3 `ResilientTicketsApi` e `ResilientKnowledgeApi`.
- [x] 14.4 Schema e migration de `agent.runs` e `DrizzleAgentRunRepository`.
- [x] 14.5 `AgentModule` `@Global()` com `AGENT_API` e a escolha do `LlmClient`.

## Detalhes de implementação

- TechSpec, "Domínio `agent`", itens de `persistence/`.
- TechSpec, "Pontos de integração", OpenRouter via Mastra e sistema de chamados legado.
- TechSpec, "Esquema do banco", linha `agent.runs`.
- TechSpec, "Monitoramento e observabilidade", logs do agent.
- Consulte a documentação atual do Mastra (context7) antes de escrever o adaptador.

## Critérios de aceitação relacionados

- CA-28
- CA-40

## Testes da tarefa

### Testes de unidade

- [x] Teste de contrato do `MastraLlmClient` com um modelo fake do AI SDK: `text-delta`, chamada de tool e `finished` com `usage`; erro antes do primeiro texto ganha nova tentativa; erro depois termina sem nova tentativa.
- [x] `ResilientTicketsApi` registra novas tentativas e propaga `TicketsUnavailableError` após 3 falhas.

### Testes de integração

- [x] `DrizzleAgentRunRepository` grava e soma o custo do dia no PGlite.

## Arquivos relevantes

- `packages/agent/src/persistence/**`
- `packages/agent/drizzle/**` (novo)
- `packages/agent/src/agent.module.ts`, `index.ts`, `package.json`
