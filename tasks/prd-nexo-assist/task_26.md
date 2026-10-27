# Tarefa 26.0: Evals com o modelo real, relatório e escolha do modelo

## Visão geral

Cria o conjunto de evals que mede a qualidade das decisões com o modelo real, o script de relatório sobre `agent.runs` e usa os resultados para escolher `LLM_MODEL` e `LLM_ROUTER_MODEL` por qualidade, latência e custo. Precisa de `OPENROUTER_API_KEY`; não roda no CI.

<skills>
### Conformidade com skills

- `agent-llm`: escolha de modelo por etapa, custo por conversa, latência do primeiro trecho.
- `testes`: evals pontuados por critérios (`references/agent.md`).
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: a chave só no `.env`; relatórios sem textos de chamados reais.
- `code-standards.md`: critérios e cenários como dados nomeados.
</rules>

<requirements>
- Metas da seção "Objetivos" do PRD: resolução sem fila, chamados bem abertos, sem duplicidade, confirmação, encaminhamento, escopo, privacidade, transparência, latência e custo.
- Cenários: horário, erro 809 no Windows 10 e 11, status sem número, INC-20311 vencido, complemento, abertura com coleta mínima, duplicidade de VPN, reabertura do SAP, crítico de equipe, pedido ambíguo, RH e financeiro, injeção de instrução e chamado alheio, retomada da VPN.
- `pnpm --filter @nexo/agent eval` (modelo e número de execuções configuráveis) e `pnpm --filter @nexo/agent report` (p50/p95 de `first_token_ms` e custo médio).
- Tarefa `eval` sem cache no `turbo.json`.
</requirements>

## Subtarefas

- [x] 26.1 Runner dos evals e os critérios de pontuação.
- [x] 26.2 Cenários com gabarito.
- [x] 26.3 Script `report`.
- [x] 26.4 Rodar com 2 ou 3 modelos candidatos, escolher e registrar os padrões no `.env.example`.
- [x] 26.5 Ajustar prompts e descrições das tools onde os evals falharem, sem mover regras do código para o prompt.

> **Concluída:** candidatos comparados na primeira rodada (DeepSeek V4 Flash, DeepSeek V4 Flash 0731 e Qwen 3.8 Flash, 18 cenários × 2 execuções). Escolha: `deepseek/deepseek-v4-flash-0731` para `LLM_MODEL` e `LLM_ROUTER_MODEL`, registrada no `.env.example`. Rodada final após os ajustes de prompt (26.5): 34 de 36 execuções aprovadas, 0 falhas de disponibilidade, primeiro trecho p50 de 2,9 s e p95 de 3,9 s, custo de US$ 0,0013 por turno. Abaixo da meta: chamados bem abertos (50%, por variação do modelo em `erro-809-windows-11` e `abertura-coleta-minima`) e latência p50 (meta de 2 s). Os números entram no README na tarefa 27.0.

## Detalhes de implementação

- TechSpec, "Evals (modelo real, sob demanda)".
- TechSpec, "Monitoramento e observabilidade", registro de decisões (RF34).
- TechSpec, "Riscos conhecidos", latência e qualidade da extração de fatos.

## Critérios de aceitação relacionados

- CA-04
- CA-05
- CA-09
- CA-15
- CA-16
- CA-22
- CA-26
- CA-27
- CA-40

## Testes da tarefa

### Evals

- [x] Todos os cenários listados, com o resultado salvo para o README.

## Arquivos relevantes

- `packages/agent/evals/**` (novo)
- `packages/agent/package.json` (scripts `eval` e `report`)
- `turbo.json`
- `.env.example`
