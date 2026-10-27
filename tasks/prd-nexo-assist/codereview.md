# Relatório de revisão de código — Nexo Assist

## Resumo
- Data: 2026-10-27
- Branch: main (commit `9d2dbf5`)
- Status: APROVADO COM RESSALVAS

Escopo: revisão geral da solução contra o PDF do desafio (`docs/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`), a TechSpec, as tarefas 1.0 a 27.0 e as regras do projeto. Nenhum código foi alterado: nada bloqueante apareceu.

O PDF já estava transcrito em `docs/Desafio_Tecnico_Nexo_Assist_PRD_v5.md` (commit `52f01ed`). Conferi essa transcrição contra o texto extraído do PDF (seções, histórias, requisitos, Anexos A, B e C) e ela bate, então a usei como fonte da revisão. A extração do PDF sai com camadas de texto sobrepostas e não serve para leitura direta.

## Aderência ao PDF do desafio

| Exigência do PDF | Status | Evidência |
|------------------|--------|-----------|
| Login com e-mail corporativo e qualquer senha | OK | `packages/identity`, README (8 usuários de exemplo) |
| Chat com respostas em tempo real, cards, seleção de chamado, rascunho, opções rápidas | OK | SSE em `chat/http`; `apps/web/src/modules/chat/components` (`draft-card`, `ticket-selection`, `quick-options`) |
| Limite de 30 mensagens por sessão | OK | `chat/core/allowance/message-allowance.ts`, `chat-limit.integration.test.tsx` |
| Agent decide por mensagem usando central e chamados | OK | `packages/agent/src/core` (roteador `understand`, política de turno, laço de até 6 passos) |
| Serviço de chamados simulado, separado do agent | OK | `packages/tickets` acessado só pelo token `TICKETS_API`; simulador de indisponibilidade do legado |
| Transferência: agent para de responder até ser liberado | OK | `chat/core/handoff`, E2E-03 |
| Console do analista: filtros, status, histórico, assumir, devolver, encerrar, painel de chamados | OK | `apps/web/src/modules/console`, `chat/http` do console |
| Visibilidade das decisões (a parte mais importante) | OK | `components/agent-turn` com "O que entendeu", ação, confiança e motivo; passos gravados por decorador de execução real |
| TypeScript estrito | OK | `pnpm typecheck` verde, sem `any` |
| Mastra | OK | `@mastra/core` isolado em `agent/persistence` atrás da porta `LlmClient` |
| Escolha do modelo explicada no README | OK | Seção "Escolha do modelo e do OpenRouter" com comparação medida |
| Persistência sobrevive a reinício | OK | Postgres/Drizzle; `restart.integration.test.ts` (TI-14) |
| Rodar com poucos comandos e `.env.example` | OK | 4 comandos no README; `.env.example` sem segredos |
| Arquitetura clara, testes, tratamento de erros, commits | OK | `check:boundaries`, 691 testes, histórico em Conventional Commits |
| Eficiência e custo por conversa | RESSALVA | US$ 0,0013 por turno (dentro da meta); latência do primeiro trecho p50 de 2,9 s, acima dos 2 s do PRD |
| Chaves fora do código e privacidade entre funcionários | OK | `requesterId` da sessão; "não encontrado" indistinguível de "sem permissão"; E2E-02 |
| Anexo A: tipos, categorias, abertura com confirmação, duplicidade, reabertura de 7 dias, privacidade, escopo | OK | `tickets/core` (testes TU-01 a TU-08); confirmação verificada no código |
| Anexo A: prioridade e prazos (1 h, 4 h úteis, 3 d úteis, 5 d úteis) | OK | `tickets/core`, `business-time.ts` |
| Anexo A: transferência a pedido, em caso crítico, em chamado vencido, por baixa confiança | OK | Pedido e baixa confiança por código; crítico por `turn-finisher.ts`; vencido por oferta de analista (ver problema 4) |
| Anexo B: 5 a 10 artigos e chamados variados (aberto, vencido, resolvido recente, de terceiros) | OK | 8 artigos; INC-20311, REQ-10442 e INC-20150 como no PDF, mais chamados de outros funcionários |
| Anexo C: telas 1 a 5 | OK | Rotas de identity, chat e console; fidelidade visual aferida por testes de interface, não por comparação com o `.pen` |
| README com as seis seções pedidas | OK | Como rodar, arquitetura, como o agent decide, qualidade, trade-offs e o que faria com mais tempo |
| Deploy (diferencial) | PENDENTE | Dockerfile, serve-static e passos do Railway prontos; publicação (27.3, 27.4) aguarda confirmação do usuário |

## Conformidade com regras

| Regra | Status | Observações |
|------|--------|-------------|
| `modular-architecture.md` | OK | `pnpm check:boundaries`: "Fronteiras OK (9 pacotes verificados)" |
| `folder-structure.md` | OK | Estrutura `http`, `core`, `persistence` por domínio; módulos do web sem importação cruzada |
| `code-standards.md` (100 linhas, 30 por função, 3 parâmetros, profundidade 3, sem comentários) | OK | Imposto pelo oxlint; nenhum arquivo `.ts` de produção acima de 100 linhas; nenhum comentário em código de produção |
| `javascript-typescript.md` | OK | Sem `any`, `eqeqeq`, `no-nested-ternary`, `prefer-const` ativos no lint |
| `security-privacy.md` | OK | `process.env` só em `@nexo/shared/config` (as outras ocorrências ficam em `e2e/`); cookie `HttpOnly`, produção recusa `scripted`, `LOG_LEVEL=debug` e segredo de exemplo |
| `evals.md` | OK | Evals fora de `pnpm test`; resultados fora do Git; 18 cenários com roteiro de ensaio |
| `git-commits.md` | OK com nota | Um commit usa escopo fora da lista (`test(e2e): ...`, problema 5) |

## Aderência à TechSpec

| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Monólito modular com domínios em `packages/` e apps que só compõem | SIM | `apps/monolith` tem `main.ts`, módulos e health check |
| Domínios só falam por tokens e eventos de `@nexo/contracts` | SIM | `TICKETS_API`, `KNOWLEDGE_API`, eventos de transferência |
| Postgres com um schema por domínio (Drizzle) e PGlite nos testes | SIM | Migrations rodam no boot; seed controlado por `SEED_DEMO_DATA` |
| Roteador `understand` seguido de política de turno no código e laço de tools | SIM | Registro em `agent.runs` |
| O modelo só propõe; o código escreve após confirmação com `idempotencyKey` | SIM | Tools `propor_*`; confirmação por botão, opção rápida ou frase afirmativa |
| SSE para o turno e para o console | SIM | Hub em memória, evolução para `LISTEN/NOTIFY` registrada como trade-off |
| Resiliência com o legado: timeout, nova tentativa e resposta degradada | SIM | `@nexo/shared/resilience`, `TICKETS_OUTAGE_MODE` |
| Limites de uso: rate limit, 30 mensagens, teto diário de custo | SIM | `CHAT_RATE_LIMIT_PER_MINUTE`, `LLM_DAILY_BUDGET_USD` |
| Deploy como serviço único com Postgres gerenciado | PARCIAL | Artefatos prontos; publicação pendente (tarefa 27.0) |

## Tarefas verificadas

| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 a 26.0 | COMPLETA | Marcadas como concluídas em `tasks.md`; código e testes presentes |
| 27.0 Deploy e README | INCOMPLETA | 27.1, 27.2 e 27.5 concluídas; 27.3 (Railway) e 27.4 (verificação no ambiente publicado) pendentes por serem ações externas que exigem confirmação |

## Testes

Comandos executados na raiz: `pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries` e `pnpm test`. Todos terminaram com sucesso (código de saída 0). O Turborepo reaproveitou o cache (`FULL TURBO`) para parte das tarefas, porque nenhum arquivo mudou desde a última execução.

- Total de testes: 706 (691 da execução inicial mais os testes de regressão das correções)
- Passando: 706
- Falhando: 0
- Cobertura: NÃO APLICÁVEL (o projeto não define meta de cobertura numérica; a regra é testar por risco)

| Pacote | Testes |
|--------|--------|
| `@nexo/contracts` | 24 |
| `@nexo/shared` | 47 |
| `@nexo/identity` | 19 |
| `@nexo/tickets` | 95 |
| `@nexo/knowledge` | 22 |
| `@nexo/agent` | 198 |
| `@nexo/chat` | 229 |
| `@nexo/monolith` | 11 |
| `@nexo/web` | 61 |

`pnpm e2e` (Playwright): 3 de 3 passaram (E2E-01, E2E-02, E2E-03). A porta 5432 é do container `truck-postgres`, de outro projeto, e não foi tocada. Rodei o E2E contra um Postgres 17 descartável na porta 5433 (`E2E_DATABASE_URL=postgres://nexo:nexo@127.0.0.1:5433/nexo_e2e`), com o backend na 3017 e o web na 5177.

Também subi o app (`pnpm dev`) e usei o chat e o detalhe da decisão no navegador com o modelo real, como Ana Souza. O login, o card do INC-20311 com prazo vencido, os passos do agent e o detalhe (entendimento, ação, confiança de 95%, motivo e passos) funcionaram.

Não executei `pnpm eval`: gasta dinheiro e a regra do projeto o mantém fora da revisão. Usei os números já registrados no README.

Ambiente: o `pnpm dev` (portas 3000 e 5173) e o Postgres do `docker compose` (5432) ficaram no ar a pedido do usuário. O container `nexo-review-pg` (porta 5433) e os servidores do Playwright (3017 e 5177) foram encerrados, e as portas ficaram livres. Para liberar a 5432, o usuário pediu para parar os containers do projeto truck (`truck-postgres`, `truck-redis` e `truck-sync`), que foram parados com `docker stop`, sem remoção, e voltam com `docker start`.

## Problemas encontrados

Os cinco primeiros problemas saíram da execução do app no navegador (Playwright) com o modelo real. Todos foram corrigidos nesta revisão, cada um com teste de regressão e um commit próprio. O último é uma observação sobre os testes.

| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Alta (CORRIGIDO) | `apps/web/vite.config.ts` | 9 | Com `pnpm dev`, o Vite lia o `.env` só de `apps/web`, mas o `VITE_API_URL` está no `.env` da raiz. O axios ficava sem `baseURL` e o front chamava `localhost:5173/auth/me`, que devolve o `index.html`; a tela mostrava "Não foi possível verificar sua sessão" em vez do login. Quebrava os 4 comandos do README numa instalação limpa. O E2E não pegou porque injeta a variável por conta própria. | Corrigido com `envDir` apontando para a raiz do repositório. Teste de regressão em `apps/web/src/lib/vite-env-dir.test.ts` (falha sem a correção). |
| Média (CORRIGIDO) | `packages/chat/src/core` (travamento do turno, `TURN_LOCK_MS` de 120 s) e `apps/web/src/modules/chat` | — | Se o backend cai ou reinicia no meio de um turno, a mensagem fica salva sem resposta. O "Tentar novamente" devolve 404 ("Não há resposta com falha para refazer") e o campo de mensagem fica desabilitado, sem explicação, até o travamento expirar em 120 s. Depois a conversa se recupera sozinha. É o cenário de um deploy no Railway. | Corrigido: no boot, `RecoverInterruptedTurns` libera os travamentos e grava uma resposta com falha, o que habilita o "Tentar novamente". Vale para uma instância. Teste de regressão em `restart.integration.test.ts`. |
| Baixa (CORRIGIDO) | `apps/web/src/modules/chat/components/agent-bubble.tsx` e prompt do agent | — | A resposta do agent mostra `**aguardando analista**` com os asteriscos literais e junta frases sem espaço ("andamento?Aguardo"). | Corrigido: `FormattedText` renderiza o negrito sem os asteriscos e o adaptador do Mastra insere uma quebra de parágrafo depois de cada tool. |
| Baixa (CORRIGIDO) | `packages/agent/src/core/tools/mostrar-chamado.ts`, `fixed-replies.ts` | 44 | Ao consultar um chamado vencido aparecem duas perguntas de opções empilhadas: "Sim, quero falar com um analista / Não, só queria saber o status" (do modelo, via `perguntar_opcoes`) e "Falar com um analista / Adicionar informação / Não, obrigado" (resposta fixa do código). | Corrigido: o código só oferece as opções quando o modelo não perguntou no turno, e a descrição da tool deixa de pedir a pergunta. Reexecutar o cenário `chamado-vencido` nos evals. |
| Baixa (CORRIGIDO) | `packages/agent/src/core/decision-builder.ts` | — | No detalhe da decisão, "Regras aplicadas" diz "Nenhuma regra específica" mesmo quando o vencimento do prazo foi aplicado. | Corrigido: `mostrar_chamado` devolve a regra do vencimento. |
| Média | `README.md` (bloco `evals`) | — | "Chamados bem abertos" fecha em 50% (2/4) contra a meta de 90%. O README informa o número e não afrouxa o critério. | Endurecer a pergunta de impacto e o registro do compromisso do dia em `erro-809-windows-11` e `abertura-coleta-minima`, depois rodar só esses cenários com `--runs 1`. |
| Média | `README.md` (Trade-offs) | — | Latência do primeiro trecho em p50 de 2,9 s, acima dos 2 s do PRD (p95 de 3,9 s está dentro). Causa: roteador sequencial antes do laço. | Aceito e documentado como trade-off; o caminho está em "O que eu faria com mais tempo". |
| Baixa | `tasks/prd-nexo-assist/tasks.md` | 33 | A tarefa 27.0 segue desmarcada; não há link de deploy para entregar. O PDF trata o deploy como diferencial sem penalidade. | Publicar no Railway após a confirmação do usuário, verificar o limite de uso (27.4) e marcar a tarefa. |
| Baixa (CORRIGIDO) | `packages/agent/src/core/tools/mostrar-chamado.ts` | 44 | O PDF diz que a transferência "acontece em chamados vencidos"; a implementação mostra o aviso e oferece o analista, sem transferir sozinha. Isso casa com a Tela 3 ("oferta de chamar um analista"), então é uma leitura válida. | Corrigido: o README explica que o chamado vencido gera uma oferta de transferência, não uma transferência automática. |
| Baixa | `packages/chat` (testes de integração) | — | Na primeira rodada completa de `pnpm test`, feita com o `pnpm dev` ainda rodando, 7 arquivos do `chat` falharam com `Hook timed out in 30000ms` ao subir o banco de teste. Isolado o pacote passa (229), e a segunda rodada completa passou (706). É carga de máquina, não regressão, mas num computador lento do avaliador pode se repetir. | Subir o `hookTimeout` do Vitest nos pacotes com PGlite ou limitar a concorrência do Turborepo nos testes. |
| Baixa | histórico git | — | O commit `test(e2e): cobre abertura de chamado, privacidade e transferência` usa um escopo fora da lista de `git-commits.md`. | Nenhuma ação (reescrever o histórico exigiria rebase, que não foi pedido); usar `repo` em casos futuros. |

## Pontos positivos
- Aderência alta ao PDF: todos os requisitos obrigatórios e as regras do Anexo A estão implementados e rastreados até testes.
- A parte que o PDF chama de mais importante, a visibilidade das decisões, tem componente próprio (entendimento, ação, confiança e motivo), e os passos vêm da execução real das tools, não do texto do modelo.
- Segurança: o `requesterId` vem só da sessão, a confirmação é verificada no código, "não encontrado" e "sem permissão" são indistinguíveis, e a produção recusa configurações inseguras.
- Os números do README são honestos: ele mostra as metas não atingidas em vez de afrouxar critérios.
- Fronteiras entre domínios impostas por script e limites de tamanho impostos pelo linter, sem desligar regras.

## Recomendações
- Fechar a tarefa 27.0: confirmar com o usuário e publicar no Railway, para ter um link a enviar junto com o repositório.
- Se houver tempo, melhorar "chamados bem abertos" e a latência do primeiro trecho, que são as duas metas abertas.
- Explicitar no README que o chamado vencido gera oferta de transferência, não transferência automática.

## Conclusão
A implementação atende ao que o PDF pede. Typecheck, lint, fronteiras e os 706 testes passam, e o código segue as regras e a TechSpec. O E2E também passou (3 de 3), inclusive depois das correções. O uso real no navegador achou um defeito alto, que o E2E não via: o front não lia o `VITE_API_URL` no `pnpm dev`. Ele e os outros quatro defeitos do chat (turno cortado por queda do backend, opções duplicadas, markdown cru e regra de prazo ausente no detalhe da decisão) foram corrigidos. Fica **APROVADO COM RESSALVAS** por três motivos: o deploy (diferencial) ainda não foi publicado; duas metas do PRD (chamados bem abertos e latência do primeiro trecho) seguem abaixo do alvo e ficam para os evals; e a descrição da tool `mostrar_chamado` mudou, então o cenário `chamado-vencido` precisa ser reexecutado nos evals. Nenhum problema é bloqueante.
