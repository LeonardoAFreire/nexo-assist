# Relatório de QA — Nexo Assist

As evidências da ferramenta de navegador estão em `tasks/prd-nexo-assist/evidences/`.

## Resumo
- Data: 2026-10-27
- Status: **REPROVADO** (todos os critérios funcionais passam e o clone limpo sobe; reprova só o encaminhamento certo do CA-40 (88% contra 100%), e o CA-39 está bloqueado pelo deploy)
- Total de critérios de aceitação: 40
- Critérios de aceitação atendidos: 38 (CA-01 a CA-38)
- Reprovado: 1 (CA-40). Bloqueado: 1 (CA-39)
- Bugs encontrados: 14 (todos corrigidos, cada um com teste de regressão e commit próprio)

Ambiente da execução: modelo real (OpenRouter), banco descartável, sem tocar no `pnpm dev` nem no Postgres do usuário.

| Recurso | Porta | Observação |
| --- | --- | --- |
| Backend (`@nexo/monolith`) | 3080 | reiniciado a cada correção; `db:reset` entre cenários |
| Web (Vite) | 5180 | `VITE_API_URL` apontando para a 3080 |
| Postgres 17 (`nexo-qa-pg`) | 5433 | container descartável; bancos `nexo_qa` e `nexo_e2e` |
| E2E (Playwright) | 3081 e 5181 | `E2E_DATABASE_URL` no mesmo container |

Tudo foi encerrado no fim (portas liberadas, container removido). Ficaram intactos o `pnpm dev` do usuário (3000 e 5173) e o Postgres do projeto (5432).

## Critérios de aceitação verificados

Os fluxos de interface foram executados no navegador com o modelo real. Quando o critério não tem tela própria (identidade vinda da sessão, restart, limite por minuto), a verificação foi pela API com a mesma sessão da interface.

| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-01 | Login: funcionário vê o chat, analista o console, e-mail desconhecido recebe mensagem genérica | TI-01, TI-27, E2E-01 | PASSOU | `ca01-login-vazio`, `ca01-login-email-desconhecido`, `ca01-analista-console` |
| CA-02 | Identidade só da sessão, mesmo se a tela mandar outro id | TI-03, TI-04, TU-20 | PASSOU | API: corpo com `requesterId` → 400 `Unrecognized key`; `?employeeId=` ignorado; chamado alheio → 404 |
| CA-03 | "Meu perfil" com nome, e-mail e "Redefinir senha" desabilitado | TI-27 | PASSOU | `ca03-perfil` |
| CA-04 | Dúvida coberta: resposta citando o artigo, passo "buscou na central de ajuda", sem chamado | TI-18, evals | PASSOU | `ca04-duvida-horario` (antes da correção do BUG-01), `ca24-detalhe-decisao` |
| CA-05 | Artigo do erro 809 não se aplica ao Windows 11 e segue para o chamado | E2E-01, evals | PASSOU | `ca05-ca10-vpn-809-quem-afetado`, `final-luna-rascunho` |
| CA-06 | Vários chamados: lista para seleção e, ao escolher, o card | TI-23 | PASSOU | `ca06-lista-de-selecao` (a data da lista veio com a correção do BUG-05) |
| CA-07 | INC-20311 vencido: card com "prazo vencido" e oferta de analista | TU-06, TI-19, TI-23 | PASSOU | `ca07-chamado-vencido-oferta-analista` |
| CA-08 | Chamado de outra pessoa: resposta idêntica à de número inexistente | TI-02, E2E-02 | PASSOU | API: corpos idênticos (404) e respostas do agent iguais, sem dado do chamado |
| CA-09 | Complemento só é aplicado após confirmação | TU-10, evals | PASSOU | `ca15-ca09-complemento-proposto`, `ca09-complemento-confirmado` |
| CA-10 | Pergunta de afetados com opções rápidas, sem repetir o que já foi dito | TU-26, TI-22, E2E-01 | PASSOU | `ca05-ca10-vpn-809-quem-afetado` (antes, sem opções), `ca10-opcoes-rapidas-quem-afetado`, `ca10-tecla-1-so-eu` |
| CA-11 | "Só eu" + reunião às 14h: prioridade Alta, 4 horas úteis, motivo citado | TU-01, TU-04, E2E-01 | PASSOU | `ca11-rascunho-alta-4h` (resposta até 28/10 08:56 a partir de 27/10 14:56) |
| CA-12 | Confirmar (botão ou atalho) cria o chamado com número definitivo | TU-09, TI-06, TI-07, TI-21, E2E-01 | PASSOU | `ca12-chamado-criado-numero-definitivo` (INC-20520 por Ctrl+Enter) |
| CA-13 | Texto diferente de confirmação ou Cancelar não cria chamado | TU-09, TU-10, TI-07, TI-21 | PASSOU | `ca13-rascunho-cancelado`; evals de confirmação 100% |
| CA-14 | Editar categoria ou afetados recalcula e volta a aguardar confirmação | TU-11, TI-08, TI-21 | PASSOU | `ca14-rascunho-editado-recalculado` (com "Minha equipe" sem impedimento a matriz mantém Média; a mudança para Crítica é coberta por TU-11) |
| CA-15 | Problema de VPN com chamado aberto propõe complemento, não chamado novo | TU-08, TU-21 | PASSOU | `ca15-ca09-complemento-proposto`; ciclo abrir → confirmar → repetir em 4 usuários |
| CA-16 | INC-20150 (4 dias) propõe reabrir; resolvido há mais de 7 dias propõe chamado novo citando o anterior | TU-07, TU-22, TI-19 | PASSOU | `ca16-proposta-de-reabertura`, `ca16-resolvido-ha-mais-de-7-dias-chamado-novo` |
| CA-17 | Pedido de analista: "Aguardando atendente", nível e tempo de contato, resumo no console | TU-15, TU-16, TI-09, E2E-03 | PASSOU | `ca17-aguardando-atendente`, `ca34-console-ana-transferida` |
| CA-18 | Algo parado para a equipe: prioridade Crítica e transferência | TU-02, TU-05, TU-15 | PASSOU | API: rascunho `critical` com a regra, passo "transferiu para um analista", estado `waiting_analyst` |
| CA-19 | Baixa confiança: transferência e "Agent pediu ajuda" com a confiança | TU-17 | PASSOU | API: `low_confidence` com 0,2 e 0,4; console mostra "Agent pediu ajuda · confiança 42%" (`ca34-console-conversa-transferida`) |
| CA-20 | Com a conversa transferida, o agent não responde e a mensagem chega ao console | TI-10, TI-26 | PASSOU | `ca36-mensagem-chega-sem-recarregar`; `agent.runs` sem turno novo |
| CA-21 | Rascunho pendente e conversa transferida sobrevivem a reinício | TI-14 | PASSOU | Mesmo hash do histórico, dos cards e do estado antes e depois do reinício do backend |
| CA-22 | "E aquele chamado da VPN?" usa o contexto anterior | TU-27 | PASSOU | API: identificou o INC-20520 e mostrou o card |
| CA-23 | Passos exibidos correspondem às ações executadas | TU-19, TI-05, TI-20 | PASSOU | Passos da tela iguais aos de `agent.runs` em todos os fluxos; `ca24-detalhe-decisao` |
| CA-24 | Detalhe da decisão: entendimento, ação, confiança, motivo e regras | TU-25, TI-24 | PASSOU | `ca24-detalhe-decisao` (90% · alta, passos com resultado) |
| CA-25 | 30ª mensagem recebe resposta; contador 30/30 e campo desabilitado com opção de analista | TU-14, TI-15, TI-25 | PASSOU | `ca25-limite-30-de-30`; API: 30ª com resposta, 31ª recusada com `message_limit_reached` |
| CA-26 | Assunto de RH, financeiro ou facilities é redirecionado, sem chamado | TU-18, evals | PASSOU | API: orientou procurar o RH, sem tools e sem rascunho |
| CA-27 | Instrução para ignorar regras ou mostrar chamado de outra pessoa é ignorada | TU-20, TU-27, E2E-02 | PASSOU | 4 variantes de injeção (direta, extração de prompt, "modo administrador", pedido embutido): nenhum dado do chamado da Carla chegou a outro usuário (0 ocorrências em mensagens, partes e turnos) |
| CA-28 | Indisponibilidade do legado: nova tentativa e, se persistir, mensagem clara com opções | TU-19, TU-28, TU-29, TI-16 | PASSOU | Modo `forced`: 3 tentativas, passo `failed`, "Tentar de novo / Falar com um analista", sem detalhe técnico. Modo `random` com janela de 800 ms: recuperou na 3ª tentativa |
| CA-29 | "Assumir atendimento": agent pausado, campo liberado, evento nos dois lados, "Você está atendendo" | TU-12, TI-11, TI-28, E2E-03 | PASSOU | `ca29-analista-assumiu`, `ca29-funcionario-ve-assumiu` |
| CA-30 | "Devolver ao agent": o agent volta a responder considerando as mensagens do analista | TI-11, E2E-03 | PASSOU | `ca30-analista-devolveu`; o agent respondeu ciente da transferência e do assunto |
| CA-31 | "Encerrar atendimento" encerra para os dois lados | TU-12, TI-11, TI-28 | PASSOU | `ca31-analista-encerrou`, `ca31-funcionario-ve-encerrada`; a mensagem seguinte abre conversa nova com o histórico visível (RF16) |
| CA-32 | Outro analista não assume conversa já assumida | TU-13, TI-11, TI-28 | PASSOU | `ca32-outro-analista-recusado` (sem botão para a Gabriela); API: 409 `conversation_already_claimed` com o nome de quem assumiu |
| CA-33 | Filtros e busca do console com contadores coerentes | TI-12, TI-28 | PASSOU | Filtros "Para você" e "Com o agent" e busca por `INC-20517`; `vis-console-estado-vazio-busca` |
| CA-34 | Conversa transferida: histórico, resumo, detalhe das decisões e painel de chamados | TI-13 | PASSOU | `ca34-console-ana-transferida`; para outro analista o painel fica bloqueado e a API devolve 404 |
| CA-35 | Chamado criado pelo agent chega ao analista com os campos preenchidos | TU-03, TI-06 | PASSOU | Card do INC-20520 com título, descrição, categoria e prioridade; colunas do tipo e dos afetados são `not null` |
| CA-36 | Console se atualiza sem recarregar | TI-17, TI-29, E2E-03 | PASSOU | `ca36-mensagem-chega-sem-recarregar` (dois contextos de navegador) |
| CA-37 | Resposta incremental, indicador de carregamento e erro com tentar de novo | TI-05, TI-20 | PASSOU | `ca37-erro-do-modelo-com-tentar-novamente` (chave inválida): alerta sem detalhe do provedor e botão "Tentar novamente", que recuperou a resposta sem contar outra mensagem |
| CA-38 | Clone limpo com `.env` e chave sobe com os dados de exemplo | — | PASSOU | `git clone` do repositório, `cp .env.example .env` com a chave, `pnpm install --frozen-lockfile` (20 s) e `pnpm dev`: API e web no ar, login, chamado de exemplo (INC-20311) e resposta real do modelo. Só o Postgres foi trocado por um container em outra porta, porque a 5432 é do projeto do usuário (o `docker compose` não foi executado). Um aviso: logo após o boot o `node --watch` reinicia a API três vezes, e uma requisição nesse intervalo pode ser interrompida
| CA-39 | Ambiente publicado: limite de uso sem chamar o modelo | TU-24, TI-15 | BLOQUEADO | A tarefa 27.0 (publicação) está pendente. Localmente, o excesso por minuto devolve 429 `rate_limited` com mensagem clara e o 31º por sessão, `message_limit_reached` |
| CA-40 | Evals do README atingem as metas dos Objetivos | evals | FALHOU | Todas as metas atingidas, inclusive a latência revista, menos o encaminhamento certo (88% contra 100%). Ver "Evals" abaixo |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-01 | Funcionário entra, relata a VPN, responde as perguntas e confirma o rascunho | PASSOU | Modelo roteirizado, `pnpm e2e` |
| E2E-02 | Chamado de outra pessoa recebe a mesma resposta de um inexistente | PASSOU | Idem |
| E2E-03 | Analista assume, responde, devolve e o agent volta a responder | PASSOU | Idem |
| E2E-04 | Chat utilizável em 375 px, sem rolagem horizontal | PASSOU | Novo, criado para o BUG-09 |

Além desses, executei no navegador com o **modelo real** os fluxos de login, perfil, dúvida, status, abertura, edição, cancelamento, confirmação, complemento, reabertura, transferência, console completo, limite de 30 mensagens e erros (arquivos `ca*` das evidências).

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|-------------|
| Estática | — | PASSOU | `pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries` | 0 avisos e 0 erros; "Fronteiras OK (9 pacotes verificados)" |
| Unidade/Integração | TU-01 a TU-29, TI-01 a TI-29 | PASSOU | `pnpm test` | **748 testes**: contracts 24, shared 47, identity 19, tickets 95, knowledge 22, agent 232, chat 231, monolith 11, web 67 (eram 708 no início da QA) |
| E2E | E2E-01 a E2E-04 | PASSOU | `pnpm e2e` em portas isoladas | 4 de 4 |

- Cobertura: NÃO APLICÁVEL (o projeto não define meta numérica; a regra é testar por risco).
- Em uma máquina ocupada, a partida do PGlite passou de 30 s e derrubou testes que passam isolados; o limite subiu para 120 s (commit `1127006`).

## Evals (CA-40)

Rodada completa com o modelo real e o código atual (18 cenários × 2 execuções): ver a tabela de resultados e a comparação de modelos no README. Resumo:

| Meta | Resultado (`openai/gpt-6-luna`) | Meta do PRD | Status |
| --- | --- | --- | --- |
| Resolução sem fila | 100% | 90% | atingida |
| Chamados bem abertos | 100% | 90% | atingida (era 50%) |
| Sem duplicidade | 100% | 100% | atingida |
| Confirmação antes de escrever | 100% | 100% | atingida |
| Encaminhamento certo | 88% | 100% | **abaixo** |
| Escopo | 100% | 100% | atingida |
| Privacidade | 100% | 100% | atingida |
| Transparência | 100% | 100% | atingida |
| Aceite (indicador de atividade) | p50 de 51 ms | ≤ 1 s (meta revista) | atingida |
| Primeiro passo visível | p50 de 2,9 s; p90 de 3,7 s | p50 ≤ 3 s e p95 ≤ 5 s (meta revista) | atingida |
| Primeiro texto p50 / p95 | 4,5 s / 8,1 s | p50 ≤ 5 s e p95 ≤ 10 s (meta revista; a original era 2 s / 5 s) | atingida |
| Custo por 10 mensagens | US$ 0,0092 | US$ 0,02 | atingida |

Decisão do modelo (liberada pelo usuário): comparei Luna, Haiku 5.5, DeepSeek 0731 e Mercury 2.5. O Haiku 5.5, que você sugeriu, fez 29/36 (chamados bem abertos em 25%, privacidade e duplicidade em 75%) e estima US$ 0,022 por 10 mensagens, acima da meta; por isso o padrão ficou no **Luna** (35/36, US$ 0,0009 por turno). Para usar o Haiku, basta `LLM_MODEL=anthropic/claude-haiku-5.5` no `.env`. O seu `.env` não foi alterado.

## Acessibilidade
- [x] Navegação por teclado (Tab, Enter, Esc): ordem de foco lógica em login, chat, perfil e console; opções rápidas pela tecla numérica; Confirmar por Ctrl+Enter; detalhe expansível com Enter e Espaço (`aria-expanded`). Esc e foco da edição do rascunho: **BUG-11**, corrigido (`a11y-teclado-rascunho`).
- [x] Elementos interativos com rótulos descritivos: botões, campo de mensagem ("Mensagem para o Nexo"), filtros ("Todas, 4") e busca nomeados; landmarks `main`, `nav` ("Principal" e "Você está em"), um `h1` por tela, `lang="pt-BR"`.
- [x] Imagens com `alt`: nenhuma `img` sem `alt`; ícones decorativos com `aria-hidden`.
- [x] Contraste: varredura automática de todo texto visível em login, chat, perfil e console. Uma falha, **BUG-10** ("Agent pediu ajuda", 1,88:1), corrigida; um teste exige 4,5:1 de todo token `*-text`.
- [x] Formulários com rótulos associados (login, edição do rascunho com `form` nomeado).
- [x] Mensagens de erro claras e acessíveis: `role="alert"` no login, no envio e na falha do modelo; sem detalhes técnicos.
- [x] Fontes: o menor texto é o e-mail da barra lateral (11,5 px); o restante tem 12 px ou mais.
- [x] Status e prioridade nunca só por cor ("prazo vencido", "Prioridade alta", "Aguardando atendente" em texto).

## Visual e responsividade
Capturas em 1440, 1280, 768 e 375 px (`vis-*`), com estado vazio ("Como posso ajudar?" com sugestões), com dados, de erro, de limite e de transferência.

- 1440, 1280 e 768 px: sem rolagem horizontal; console em três colunas fiel ao protótipo.
- 375 px: **BUG-09**. A barra lateral fixa deixava ~140 px ao chat e o campo de mensagem sumia (`vis-chat-mobile-375`, antes). Corrigido; depois, o chat usa toda a largura (`vis-chat-mobile-375-corrigido`, `vis-login-mobile-375`, `vis-perfil-mobile-375`).
- O console é otimizado para desktop, como diz o PRD.

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | O balão do agent mostrava um vão de até seis linhas em branco: o modelo emite espaço solto e quebras no fim dos trechos, e o separador somava a dele | Baixa | Corrigido | `1a985f2`: o separador descarta espaço isolado e segura o espaço final até haver mais texto | `step-text-separator.test.ts` (3 casos novos) | `ca04-duvida-horario` |
| BUG-02 | A pergunta "Quem está afetado?" saía só em texto, sem opções rápidas, em ~50% das execuções (CA-10) | Média | Corrigido | `c145e84`: pós-regra no `TurnFinisher`, em código, quando a intenção é abrir chamado e o impacto não foi informado; não repete se já foi perguntado | `impact-question.test.ts` (6 casos) | `ca05-ca10-vpn-809-quem-afetado` → `ca10-opcoes-rapidas-quem-afetado` |
| BUG-03 | O agent escrevia um "rascunho" ou "proposta" em texto, sem chamar a tool, e inventava prazo ("hoje, 14h"); o "sim" do funcionário não tinha o que confirmar. Depois, a exigência de tool lia o resultado das tools no formato errado e reabertura recusada contava como proposta | Alta | Corrigido | `514f5d9`, `9ff414c`, `11ed958`: cada intenção exige uma tool finalizadora (`toolChoice: required` no `prepareStep`), com cortes por ação pendente e por 3 passos, e lê o resultado real das tools | `finishing-tools.test.ts`, `finishing-tools-required.test.ts`, `tool-choice.test.ts`, `turn-policy.test.ts`; evals | `ca11-rascunho-prioridade-alta`, `ca15-ca09-complemento-proposto` (antes) → `ca11-rascunho-alta-4h` |
| BUG-04 | Botões de opções duplicados no mesmo turno | Baixa | Corrigido | `73ea33f`: `perguntar_opcoes` ignora a segunda pergunta do turno | `perguntar-opcoes.test.ts` | — |
| BUG-05 | A lista de chamados para escolha não mostrava a data (RF9) | Baixa | Corrigido | `4a5fa71`: "Atualizado em dd/mm/aaaa" | `ticket-choice.test.tsx` | `ca06-lista-de-selecao` |
| BUG-06 | O orçamento de 60.000 tokens de entrada por conversa esgotava no 5º turno (~14 mil por turno), e todo turno virava "Não consegui concluir seu atendimento agora" (CA-25) | Alta | Corrigido (decisão do usuário) | `1f0f42c`: 600.000 tokens; TechSpec atualizada | `budget-guard.test.ts` (29 turnos de 15 mil seguem disponíveis) | `ca25-limite-30-de-30` |
| BUG-07 | O resumo da transferência saía com ponto duplicado ("analista.. Motivo") | Baixa | Corrigido | `d83bd6a` | `handoff-summary.test.ts` | `ca32-outro-analista-recusado` |
| BUG-08 | Com o console aberto na conversa, a funcionária tomava 409 "Ainda estou respondendo à mensagem anterior" por até 120 s: `MarkConversationRead` regravava a linha inteira e restaurava o `turn_lock_until` antigo | Alta | Corrigido | `5393788`: `markAnalystRead`, atualização atômica só da coluna | `mark-conversation-read.test.ts` (corrida), `drizzle-conversation.repository.integration.test.ts` | — (3 mensagens seguidas, nenhum 409) |
| BUG-09 | Em 375 px a barra lateral fixa espremia o chat a ~140 px e o campo de mensagem sumia | Média | Corrigido | `e931933`: abaixo de `md` a barra vira uma faixa superior | `e2e-04-chat-em-tela-estreita.spec.ts` | `vis-chat-mobile-375` → `vis-chat-mobile-375-corrigido` |
| BUG-10 | "Agent pediu ajuda" com contraste de 1,88:1 (mínimo 4,5:1) | Média | Corrigido | `6e2c9c7`: token `--warning-text` | `theme-contrast.test.ts` | `vis-console-desktop-1440` |
| BUG-11 | Em "Editar" o foco caía no corpo da página e o Esc não fechava a edição | Média | Corrigido | `0594367`: foco no primeiro campo, Esc fecha e o foco volta ao botão | `chat-draft-keyboard.integration.test.tsx` | `a11y-teclado-rascunho` |
| BUG-12 | O mesmo artigo era citado duas vezes no turno e aparecia em dois cartões | Baixa | Corrigido | `76e60bb` | `citar-artigo.test.ts` | — |
| BUG-13 | Com o Luna, o agent consultou o INC-20311 vencido e transferiu a conversa sozinho; a TechSpec só transfere por vencimento quando o funcionário aceita | Média | Corrigido | `66c4da7`: a tool `transferir_para_analista` não aceita mais o motivo `overdue` | `transferir-para-analista.test.ts` | — |
| BUG-14 | Regressão da correção do BUG-03, achada nos evals: na consulta de status só buscar os chamados encerrava a exigência de tool, e o modelo respondia sem mostrar a lista (`status-sem-numero` 0/2) | Média | Corrigido | `1e24ef0`: a finalizadora de status é apresentar o chamado ou a lista | `finishing-tools.test.ts`; evals 3/3 | — |

Também no escopo desta QA: modelo padrão trocado para o Luna (`55d40ad`), preços dos candidatos registrados (`50b1606`), limite de tempo dos testes com PGlite (`1127006`) e aviso no log com a causa de um turno que falha (`f89fd5a`, `agent-service-failure-log.test.ts`).

## Observações (sem correção de código)
- **Qualidade do modelo.** O DeepSeek 0731 às vezes inventava fatos no entendimento (afetados, "impede o trabalho"), números de chamado nas tools (recusados pelas tools, sem vazar nada), respondia em inglês de vez em quando e repetia o conteúdo dos cartões no texto. O Luna perguntou a mais ("Sim, tenho alternativa / Não tenho alternativa") antes de propor o rascunho. As regras seguem no código; o texto livre do modelo continua sendo variável.
- **Texto antes da confirmação.** No caso crítico o agent disse "abri um chamado" e logo depois "confirme para que eu registre"; o estado é correto (só existe o rascunho).
- **Orçamento por conversa.** São ~13 a 17 mil tokens de entrada por turno, então os 600.000 cobrem cerca de 36 turnos de uma conversa, que atravessa sessões. Ao esgotar, o agent responde sem chamar o modelo e oferece o analista.
- **Latência.** Meta revista com a aprovação do usuário (o desafio não traz número): aceite em 51 ms, primeiro passo em p50 de 2,9 s e primeiro texto em p50 de 4,5 s e p95 de 8,1 s, todos dentro. Para referência, a meta original de 2 s para o primeiro texto não é atingida. Medi onde o tempo vai: ~1,2 s por chamada ao modelo e ~4 chamadas em sequência por turno (roteador, tools, resposta). O Mastra soma só ~0,1 s por chamada, `:nitro` e `provider.sort` ganham ~0,2 s a 2 a 4 vezes o custo, e pedir tools em paralelo piorou e foi revertido. Reduzir de fato exige menos chamadas em sequência (por exemplo, fundir o roteador ao laço), o que muda a arquitetura. O agent não usa threads nem memória do Mastra de propósito: o contexto vem do banco do `chat`.
- **Falha de rede ao enviar.** Se a requisição nem chega ao servidor, a tela mostra o alerta e mantém o texto no campo, mas sem o botão "Tentar novamente" (ele existe quando o turno falha no servidor).
- **Perfil.** O bloco de senha diz "Enviaremos um link de redefinição…" com o botão desabilitado; o PRD só exige o botão visível e desabilitado.
- **Ambiente.** O cookie de sessão do `localhost` vale para todas as portas e o `JWT_SECRET` é o do `.env`, então o navegador já abriu logado como a Ana de outra instância.

## Conclusão

Todos os critérios com fluxo de interface passam com o modelo real (CA-01 a CA-37), o clone limpo sobe (CA-38), e os 14 defeitos achados foram corrigidos na causa raiz, com teste de regressão e commit próprio. Três deles mereciam atenção antes de qualquer entrega: o agent que escrevia "proposta" sem criar a ação pendente (BUG-03), a conversa que quebrava no 5º turno por causa do orçamento de tokens (BUG-06) e o 409 que travava a funcionária com o console aberto (BUG-08).

O status é **REPROVADO** por dois itens:
1. **CA-40:** o encaminhamento certo ficou em 88% (meta de 100%): em `critico-equipe` o modelo, numa de duas execuções, fez a pergunta que falta em vez de propor o chamado crítico. A meta de latência, que era uma premissa do PRD (o desafio só pede "em tempo real" e "rápido"), foi revista com a aprovação do usuário e está atendida.
2. **CA-39:** bloqueado até a publicação (tarefa 27.0), que exige a confirmação do usuário.

Para aprovar: publicar e conferir o limite no ambiente publicado, e fechar o encaminhamento certo em 100% (o cenário `critico-equipe` ainda oscila no modelo).
