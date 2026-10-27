# Relatório de revisão de código — Nexo Assist

## Resumo

- Data: 2026-10-27
- Branch: main (commit `9fe14f9`, com três ajustes de revisão descritos abaixo)
- Status: APROVADO COM RESSALVAS

Escopo: revisão da solução inteira (tarefas 1.0 a 27.0) contra o `CLAUDE.md`, as rules de `.claude/rules/`, a TechSpec e o `tasks.md`, com foco no que mudou desde a revisão anterior (`2f6287a`): 28 commits, em sua maioria as correções da QA (BUG-01 a BUG-15), a troca do modelo padrão para `openai/gpt-6-luna`, a tool finalizadora obrigatória por intenção e a revisão da meta de latência do PRD. A revisão anterior e as correções que ela originou continuam válidas e estão resumidas em "Problemas encontrados".

Nada bloqueante apareceu. Os pontos abertos são o deploy (tarefa 27.0) e margens estreitas nas metas dos evals.

## Conformidade com regras

| Regra                      | Status      | Observações                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modular-architecture.md`  | OK          | `pnpm check:boundaries`: "Fronteiras OK (9 pacotes verificados)". As mudanças novas em `agent` e `chat` só importam `@nexo/contracts` e `@nexo/shared`                                                                                                                                                                                            |
| `folder-structure.md`      | OK          | Arquivos novos nos lugares certos (`agent/core`, `agent/persistence/mastra`, `chat/persistence`, `web/modules/chat/hooks`); nenhum módulo do web importa outro                                                                                                                                                                                    |
| `code-standards.md`        | OK          | Nenhum arquivo `.ts` de produção acima de 100 linhas, nenhum comentário, funções e parâmetros dentro do limite (oxlint, 0 avisos). Varredura própria de linhas em branco dentro de funções: só `components/ui/button.tsx` (gerado pelo shadcn, fora da regra) e uma ocorrência em `app-config.service.ts` que é separação entre membros da classe |
| `javascript-typescript.md` | OK          | Sem `any`, sem `==`, imports relativos com `.js`, `catch` com `unknown`. Corrigidos nesta revisão: variável `input` que escondia o parâmetro em `turn-runner.ts` e `import { type ... }` só de tipo em `conversation-column-updates.ts`                                                                                                           |
| `security-privacy.md`      | OK com nota | `process.env` só em `@nexo/shared/config`; nenhum segredo, `.env` ou resultado de eval versionado (busca por `sk-` sem ocorrências); `requesterId` da sessão; tools validam argumentos com zod. Nota: problema 3 (mensagem do provedor no log)                                                                                                    |
| `evals.md`                 | OK          | Evals fora de `pnpm test`; preços dos candidatos em `model-prices.ts`; `reasoning.enabled=false`; rodada completa de 90 turnos registrada no README com modelo, latência e custo; resultados fora do Git                                                                                                                                          |
| `git-commits.md`           | OK com nota | Conventional Commits, escopos válidos, corpo com a causa. Quatro assuntos passam de 72 caracteres (problema 8)                                                                                                                                                                                                                                    |

## Aderência à TechSpec

| Decisão Técnica                                                                             | Implementado | Observações                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Monólito modular; apps só compõem; domínios falam por tokens e eventos de `@nexo/contracts` | SIM          | Confirmado por `check:boundaries`                                                                                                                                                                      |
| Roteador `understand`, política de turno no código e laço limitado de tools                 | SIM          | `TurnRunner` → `TurnPolicy` → `ResponseLoop`; `TurnFinisher` aplica as pós-regras (transferência crítica, oferta de vencido, pergunta de impacto) em código                                            |
| O modelo só propõe; o código escreve após confirmação                                       | SIM          | Tools `propor_*`; BUG-03 fechou a brecha de o modelo escrever o "rascunho" em texto: `tool-choice.ts` exige a finalizadora (`FINISHING_TOOLS`) por intenção, com corte em 3 passos e com ação pendente |
| Chamado vencido oferece o analista e só transfere se o funcionário aceitar                  | SIM          | `transferir_para_analista` não aceita `overdue` (BUG-13); `offerOverdueOptions` no `TurnFinisher`                                                                                                      |
| Relato crítico propõe o chamado e transfere                                                 | SIM          | `isCriticalReport` (código) faz `perguntar_opcoes` recusar a pergunta; `TurnFinisher` solicita a transferência `critical`                                                                              |
| Orçamento por conversa e teto diário de custo                                               | SIM          | Orçamento de 600.000 tokens (BUG-06); TechSpec e README atualizados                                                                                                                                    |
| Persistência e concorrência do turno                                                        | SIM          | `markAnalystRead` atualiza só a coluna (BUG-08); `RecoverInterruptedTurns` no boot (vale para uma instância, registrado no README)                                                                     |
| SSE para turno e console; resiliência com o legado                                          | SIM          | Sem mudança; E2E e QA cobrem                                                                                                                                                                           |
| Interface: passos, detalhe da decisão, teclado e contraste                                  | SIM          | Foco e Esc na edição (BUG-11), contraste AA (BUG-10), layout de 375 px (BUG-09)                                                                                                                        |
| Deploy como serviço único com Postgres gerenciado                                           | PARCIAL      | `serve-static` e `Dockerfile` prontos; publicação (27.3) e verificação (27.4) pendentes                                                                                                                |

## Tarefas verificadas

| Tarefa               | Status     | Observações                                                                                                                                                                                       |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0 a 26.0           | COMPLETA   | Código e testes presentes; as correções da QA vieram com teste de regressão cada                                                                                                                  |
| 27.0 Deploy e README | INCOMPLETA | 27.1, 27.2 e 27.5 concluídas; 27.3 (Railway) e 27.4 (limite no ambiente publicado) pendentes por serem ações externas que exigem a confirmação do usuário. É o que mantém o CA-39 bloqueado na QA |

## Testes

Comandos executados na raiz: `pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries`, `pnpm test` e `pnpm e2e`. Todos terminaram com sucesso. Depois dos três ajustes desta revisão, repeti typecheck, lint, fronteiras e os testes de `@nexo/agent` e `@nexo/chat`.

- Total de testes: 751 (unidade e integração) mais 4 E2E
- Passando: 751 e 4 E2E
- Falhando: 0
- Cobertura: NÃO APLICÁVEL (o projeto não define meta numérica; a regra é testar por risco)

| Pacote            | Testes |
| ----------------- | ------ |
| `@nexo/contracts` | 24     |
| `@nexo/shared`    | 47     |
| `@nexo/identity`  | 19     |
| `@nexo/tickets`   | 95     |
| `@nexo/knowledge` | 22     |
| `@nexo/agent`     | 235    |
| `@nexo/chat`      | 231    |
| `@nexo/monolith`  | 11     |
| `@nexo/web`       | 67     |

`pnpm e2e` (Playwright): 4 de 4 (E2E-01 a E2E-04), contra um Postgres 17 descartável na porta 5433, com o backend na 3090 e o web na 5190.

Não executei `pnpm eval`: gasta dinheiro e a regra do projeto o mantém fora da revisão. Usei os números da rodada de 90 turnos registrada no README e no `qa.md`.

`pnpm format:check` falha em 871 arquivos neste computador porque o Git está com `core.autocrlf=true` e o working tree está em CRLF (o índice está em LF). Conferi a versão do `HEAD` em LF: o código `.ts`/`.tsx` está formatado; sobraram o `README.md` (corrigido, problema 6), os `.md` de `tasks/` e os metadados gerados do drizzle-kit (problema 9).

Ambiente: o container `nexo-review-pg` foi removido e as portas 5433, 3090 e 5190 não têm mais ouvintes (só conexões em `TIME_WAIT`). O `pnpm dev` (3000 e 5173) e o `nexo-postgres-1` (5432) do usuário ficaram intocados.

## Problemas encontrados

| Severidade        | Arquivo                                                        | Linha     | Descrição                                                                                                                                                                                                                                                                                | Sugestão                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Média             | `tasks/prd-nexo-assist/tasks.md`, `task_27.md`                 | 33; 35-36 | A tarefa 27.0 segue aberta: sem publicação, o CA-39 fica BLOQUEADO na QA e não há link de deploy. O PDF trata o deploy como diferencial                                                                                                                                                  | Publicar no Railway após a confirmação do usuário, verificar o limite de uso (27.4) e marcar a tarefa                                                                                      |
| Baixa             | `README.md` (evals)                                            | —         | Margens estreitas nas metas: resolução sem fila em 90% (18/20), exatamente a meta; primeiro texto em p95 de 9,9 s contra 10 s. A meta de latência foi revista depois da medição, com a aprovação do usuário e registro no PRD. Com 5 execuções por cenário, uma falha a mais tira a meta | Manter a decisão documentada; se houver tempo, reduzir chamadas em sequência (fundir o roteador ao laço) e atacar `erro-809-windows-10` e `status-sem-numero`, que são os dois que oscilam |
| Baixa             | `packages/agent/src/core/failure-log-fields.ts`                | 12        | O aviso de turno que falha registra `errorMessage` (até 200 caracteres) da exceção do provedor. `security-privacy.md` proíbe o conteúdo de prompts em logs `info` ou acima; mensagens de provedor normalmente não trazem o prompt, mas não há garantia                                   | Registrar só `errorName` e `statusCode`, ou passar a mensagem por uma lista de códigos conhecidos                                                                                          |
| Baixa (CORRIGIDO) | `packages/agent/src/core/turn-runner.ts`                       | 45        | `const input` dentro de `run` escondia o parâmetro `input` do método                                                                                                                                                                                                                     | Renomeado para `exhausted`                                                                                                                                                                 |
| Baixa (CORRIGIDO) | `packages/chat/src/persistence/conversation-column-updates.ts` | 4         | `import { type ConversationRow }` só de tipo, fora do padrão `import type` do restante do código                                                                                                                                                                                         | Trocado por `import type`                                                                                                                                                                  |
| Baixa (CORRIGIDO) | `README.md`                                                    | 168-173   | A tabela de comparação de modelos e a linha em branco antes de `<!-- evals:end -->` fugiam do `oxfmt`                                                                                                                                                                                    | Reformatado com `oxfmt`                                                                                                                                                                    |
| Baixa (CORRIGIDO) | `tasks/prd-nexo-assist/task_27.md`                             | 39        | A nota dizia que o bloco de evals do README "espera os resultados", mas ele já está preenchido                                                                                                                                                                                           | Nota atualizada                                                                                                                                                                            |
| Baixa             | histórico git                                                  | —         | Quatro assuntos de commit têm de 74 a 80 caracteres (`4a5fa71`, `514f5d9`, `5c72d3d`, `7e17277`), acima do limite de 72 de `git-commits.md`                                                                                                                                              | Nenhuma ação: corrigir exigiria `rebase`, que não foi pedido. Manter o limite nos próximos                                                                                                 |
| Baixa             | `.oxfmtrc.json`; `tasks/prd-nexo-assist/*.md`                  | —         | `format:check` aponta os `.md` de `tasks/` (prd, techspec, tasks, qa) e `packages/*/drizzle/meta/*.json` (gerados). Não é exigido pelo `CLAUDE.md`, mas fica ruído para quem rodar a checagem                                                                                            | Incluir `**/drizzle/meta` em `ignorePatterns` e rodar `pnpm format` nos `.md`, ou documentar que `format:check` não é critério de aceite                                                   |
| Baixa             | `.gitattributes`                                               | —         | Só `Dockerfile` e `.dockerignore` têm `eol=lf`. Com `autocrlf=true`, o working tree no Windows fica em CRLF e `format:check` reprova tudo                                                                                                                                                | Adicionar `* text=auto eol=lf`                                                                                                                                                             |

Problemas da revisão anterior, todos já corrigidos e confirmados nesta: `VITE_API_URL` não lido no `pnpm dev` (`envDir`), turno cortado por queda do servidor (`RecoverInterruptedTurns`), opções duplicadas no chamado vencido, markdown cru no balão, regra de vencimento ausente no detalhe da decisão e `hookTimeout` do PGlite (agora 120 s). "Chamados bem abertos" saiu de 50% para 100% e o cenário `chamado-vencido` foi reexecutado na rodada de 90 turnos.

## Pontos positivos

- As regras do service desk ficaram no código, não no prompt: a tool finalizadora obrigatória (`tool-choice.ts`), a recusa de pergunta em relato crítico, a pergunta de impacto e a oferta de analista no chamado vencido são pós-regras do `TurnFinisher`, cada uma com teste.
- Cada defeito da QA tem teste de regressão e commit próprio; a concorrência do `turn_lock_until` (BUG-08) foi resolvida na causa, com atualização atômica de uma coluna e teste de corrida.
- Segurança preservada nas mudanças: `requesterId` só da sessão, tools que rejeitam argumentos extras (`z.strictObject`) e `transferir_para_analista` sem o motivo `overdue`.
- Acessibilidade tratada com testes (foco, Esc, contraste de todo token `*-text`, texto anunciado sem asteriscos) e E2E em 375 px.
- Os números do README e do `qa.md` batem com a execução: 751 testes, 4 E2E, 88 de 90 nos evals, custo de US$ 0,0092 por 10 mensagens.
- Fronteiras entre domínios impostas por script e limites de tamanho impostos pelo linter, sem regras desligadas.

## Recomendações

- Fechar a tarefa 27.0: publicar no Railway com a confirmação do usuário e verificar o limite de uso para liberar o CA-39.
- Decidir sobre o log do erro do provedor (problema 3) antes de publicar: em produção o `LOG_LEVEL` é `info` ou acima.
- Adicionar `.gitattributes` com `* text=auto eol=lf` e ajustar o `ignorePatterns` do `oxfmt`, para `pnpm format:check` virar uma checagem útil em qualquer máquina.
- Se houver tempo, reduzir as chamadas em sequência do turno; é o que melhora a latência e a margem das metas.

## Conclusão

Typecheck, lint, fronteiras, 751 testes e os 4 E2E passam, e o código segue as rules e a TechSpec. Os defeitos da QA foram corrigidos na causa raiz com teste de regressão, e as metas dos evals estão atingidas com o modelo real, algumas com pouca margem. Fica **APROVADO COM RESSALVAS** por dois motivos: o deploy (tarefa 27.0, CA-39) ainda não foi publicado, o que depende da confirmação do usuário, e a meta de latência foi revista depois da medição e fecha no limite. Nenhum problema é bloqueante.
