# Resumo das tarefas de implementação do Nexo Assist

PRD: [`prd.md`](prd.md) · TechSpec: [`techspec.md`](techspec.md)

## Tarefas

- [x] 1.0 Ambiente local, configuração e base de testes
- [x] 2.0 `shared/database`: Drizzle, migrations, PGlite e health check
- [x] 3.0 `shared/http` e `shared/resilience`: códigos de erro, SSE e novas tentativas
- [x] 4.0 `shared/auth`: sessão JWT, guards e cookie
- [x] 5.0 Contratos em `@nexo/contracts`: modelos, tokens, eventos e erros
- [x] 6.0 Domínio `identity`: login, sessão, perfil e seed
- [x] 7.0 `tickets/core`: regras do Anexo A (prioridade, prazos, vencimento, reabertura, duplicidade)
- [x] 8.0 `tickets/core`: casos de uso, numeração e `TicketsService`
- [x] 9.0 `tickets`: persistência, seed, simulador do legado, leitura HTTP e listener de transferência
- [x] 10.0 Domínio `knowledge`: artigos, busca em português e seed
- [x] 11.0 `agent/core`: fundações (`LlmClient`, fake, `StepRecorder`) e tools de consulta
- [x] 12.0 `agent/core`: tools de proposta e `DecisionBuilder`
- [x] 13.0 `agent/core`: entendimento, política de turno, contexto, laço e `AgentService`
- [x] 14.0 `agent/persistence`: `MastraLlmClient`, decoradores resilientes, `agent.runs` e módulo
- [x] 15.0 `chat/core`: estado da conversa, limite, matchers, opção rápida e ações pendentes
- [x] 16.0 `chat/core`: transferência, console e `SendEmployeeMessage`
- [x] 17.0 `chat/persistence`: schema, repositórios e seed do console
- [x] 18.0 `chat/http` do funcionário: mensagens por SSE, retry e ações pendentes
- [x] 19.0 `chat/http`: transferência, console do analista e SSE de atualização
- [x] 20.0 `web`: base (shell, rotas, cliente HTTP, MSW), login e perfil
- [x] 21.0 `web`: componentes compartilhados de chamado e de decisão do agent
- [x] 22.0 `web`: chat em streaming (mensagens, composer, contador, erros)
- [x] 23.0 `web`: cards interativos do chat e estado transferido
- [x] 24.0 `web`: console do analista
- [x] 25.0 Composição final do monólito e testes E2E
- [x] 26.0 Evals com o modelo real, relatório e escolha do modelo
- [x] 27.0 Deploy e README

## Dependências e paralelismo

Cada tarefa só começa quando as dependências estão concluídas. As tarefas da mesma onda são independentes entre si e podem rodar em paralelo, por exemplo com subagentes em worktrees separadas (portas `30**` no backend e `51**` no frontend).

| Tarefa | Depende de |
| --- | --- |
| 1 | — |
| 2 | 1 |
| 3 | — |
| 4 | 1, 3 |
| 5 | — |
| 6 | 2, 4, 5 |
| 7 | 5 |
| 8 | 7 |
| 9 | 2, 3, 4, 8 |
| 10 | 2, 5 |
| 11 | 5 |
| 12 | 11 |
| 13 | 12 |
| 14 | 2, 3, 13 |
| 15 | 3, 5 |
| 16 | 15 |
| 17 | 2, 16 |
| 18 | 4, 6, 9, 14, 17 |
| 19 | 18 |
| 20 | 5 |
| 21 | 20 |
| 22 | 21 |
| 23 | 22 |
| 24 | 21 |
| 25 | 10, 19, 23, 24 |
| 26 | 9, 10, 14 |
| 27 | 25, 26 |

| Onda | Tarefas em paralelo |
| --- | --- |
| A | 1, 3, 5 |
| B | 2, 4, 7, 11, 15, 20 |
| C | 6, 8, 10, 12, 16, 21 |
| D | 9, 13, 17, 22, 24 |
| E | 14, 23 |
| F | 18, 26 |
| G | 19 |
| H | 25 |
| I | 27 |

Pontos de conflito em paralelo: as tarefas 3 e 5 alteram `packages/contracts/src/index.ts` e `api-error.ts` (a 3 é dona dos códigos de `ApiError`), e as tarefas de domínio registram dependências no próprio `package.json`. Resolva os conflitos no merge e rode `pnpm install` depois.

## Cobertura

| Critérios de aceitação | Tarefas |
| --- | --- |
| CA-01 | 6, 20, 25 |
| CA-02 | 4, 5, 9, 11, 18 |
| CA-03 | 20 |
| CA-04 | 10, 26 |
| CA-05 | 11, 25, 26 |
| CA-06 | 11, 23 |
| CA-07 | 7, 9, 11, 13, 21, 23 |
| CA-08 | 8, 9, 11, 25 |
| CA-09 | 8, 12, 15, 26 |
| CA-10 | 11, 15, 23, 25 |
| CA-11 | 7, 12, 25 |
| CA-12 | 8, 15, 18, 23, 25 |
| CA-13, CA-14 | 15, 18, 23 |
| CA-15 | 7, 12, 26 |
| CA-16 | 7, 8, 9, 12, 26 |
| CA-17 | 13, 15, 16, 19, 23, 25 |
| CA-18 | 7, 13, 15 |
| CA-19 | 13, 16, 24 |
| CA-20 | 16, 19, 23 |
| CA-21 | 2, 17, 25 |
| CA-22 | 13, 26 |
| CA-23 | 11, 18, 21, 22 |
| CA-24 | 12, 21 |
| CA-25 | 15, 18, 22 |
| CA-26 | 13, 26 |
| CA-27 | 11, 13, 25, 26 |
| CA-28 | 3, 9, 14, 18 |
| CA-29 | 15, 16, 19, 24, 25 |
| CA-30 | 15, 19, 25 |
| CA-31 | 15, 19, 24 |
| CA-32 | 16, 17, 19, 24 |
| CA-33, CA-34 | 16, 19, 24 |
| CA-35 | 7, 8, 18 |
| CA-36 | 16, 19, 24, 25 |
| CA-37 | 18, 22 |
| CA-38 | 1, 2, 25, 27 |
| CA-39 | 13, 18, 27 |
| CA-40 | 14, 26, 27 |

| Casos de teste da TechSpec | Tarefa |
| --- | --- |
| TU-01 a TU-08 | 7 |
| TU-09, TU-10, TU-11, TU-12, TU-14, TU-15, TU-26 | 15 |
| TU-13 | 16 |
| TU-16, TU-17, TU-18, TU-23, TU-24, TU-27 | 13 |
| TU-19, TU-20 | 11 |
| TU-21, TU-22, TU-25 | 12 |
| TU-28, TI-02, TI-03, TI-19 | 9 |
| TU-29 | 3 |
| TI-01 | 6 |
| TI-04 a TI-08, TI-15, TI-16 | 18 |
| TI-09 a TI-13, TI-17 | 19 |
| TI-14, E2E-01 a E2E-03 | 25 |
| TI-18 | 10 |
| TI-20, TI-25 | 22 |
| TI-21, TI-22, TI-23, TI-26 | 23 |
| TI-24 | 21 |
| TI-27 | 20 |
| TI-28, TI-29 | 24 |
| Evals | 26 |
