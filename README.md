# Nexo Assist

Agent de atendimento do service desk de TI da Nexo. O funcionário conversa no chat; o agent consulta a central de ajuda e os chamados, abre ou atualiza chamados **depois da confirmação do funcionário** e transfere a conversa para um analista quando precisa.

Este repositório é a solução do desafio técnico (documento-fonte em `docs/Desafio_Tecnico_Nexo_Assist_PRD_v5.md`, transcrito do PDF original, protótipo visual em `docs/nexo/nexo.pen`). O planejamento do desenvolvimento (PRD, TechSpec e tarefas) está em `tasks/prd-nexo-assist/`.

## Como rodar

Pré-requisitos: Node 22 ou superior, pnpm 10 (o `packageManager` do repositório fixa a versão; `corepack enable` resolve) e Docker para o Postgres local.

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm dev
```

- O front sobe em http://localhost:5173 e a API em http://localhost:3000/api.
- As migrations e os dados de exemplo (pessoas, central de ajuda e chamados) rodam sozinhos no boot da API.
- **Antes do `pnpm dev`, abra o `.env` e preencha `OPENROUTER_API_KEY`.** A chave é obrigatória quando `LLM_PROVIDER=openrouter`; sem ela a API recusa a subir. Para rodar sem chave, troque para `LLM_PROVIDER=scripted`: um modelo roteirizado, determinístico, usado também nos testes. Ele só serve para conhecer a interface e é recusado em produção.
- Fora de produção, a senha de demonstração é qualquer texto não vazio. Com `NODE_ENV=production` (a imagem Docker e o deploy), o login exige a senha padrão do seed, `senha@1234` (`SEED_USER_PASSWORD`), guardada com hash bcrypt. Entre com um dos usuários abaixo.

| Perfil      | Nome           | E-mail                       | Observação       |
| ----------- | -------------- | ---------------------------- | ---------------- |
| Funcionário | Ana Souza      | `ana.souza@nexo.com.br`      | Financeiro       |
| Funcionário | Bruno Tavares  | `bruno.tavares@nexo.com.br`  | Comercial        |
| Funcionário | Carla Mendes   | `carla.mendes@nexo.com.br`   | Operações        |
| Funcionário | Diego Ramos    | `diego.ramos@nexo.com.br`    | Marketing        |
| Funcionário | Elisa Prado    | `elisa.prado@nexo.com.br`    | Recursos Humanos |
| Analista    | Rafael Lima    | `rafael.lima@nexo.com.br`    | N2               |
| Analista    | Gabriela Rocha | `gabriela.rocha@nexo.com.br` | N1               |
| Analista    | Fábio Nunes    | `fabio.nunes@nexo.com.br`    | N1               |

Funcionários entram no chat; analistas entram no console, onde assumem as conversas transferidas.

Comandos úteis, a partir da raiz:

```bash
pnpm build               # compila pacotes e apps
pnpm typecheck           # TypeScript estrito
pnpm lint                # oxlint, com checagem por tipos
pnpm format              # oxfmt
pnpm check:boundaries    # nenhum domínio depende de outro
pnpm test                # testes de unidade e de integração
pnpm e2e                 # Playwright (precisa do Postgres e do Chromium)
pnpm --filter @nexo/monolith db:reset   # recria o banco com os dados de exemplo
```

Os dados de exemplo usam datas relativas ao momento do boot (por exemplo, a janela de 7 dias para reabrir um chamado). Se uma demonstração parecer "velha", rode o `db:reset`.

## Arquitetura

Monólito modular: as fronteiras lógicas (módulos no código) ficam separadas das fronteiras físicas (apps que sobem em produção), para que um módulo possa virar um serviço dedicado sem refatorar.

```mermaid
flowchart LR
  web["apps/web<br/>React + Vite"] -->|HTTP e SSE| monolith["apps/monolith<br/>NestJS"]
  monolith --> identity
  monolith --> chat
  monolith --> agent
  monolith --> tickets
  monolith --> knowledge
  chat -. "interfaces e eventos<br/>(@nexo/contracts)" .-> agent
  agent -. "TICKETS_API, KNOWLEDGE_API" .-> tickets
  agent -. "TICKETS_API, KNOWLEDGE_API" .-> knowledge
  agent --> llm["OpenRouter"]
  identity --> db[("Postgres<br/>um schema por domínio")]
  chat --> db
  agent --> db
  tickets --> db
  knowledge --> db
```

| Unidade        | Onde                                                         | Responsabilidade                                                                                                                                     |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apps           | `apps/monolith`, `apps/web`                                  | Compõem os módulos e inicializam; sem regra de negócio                                                                                               |
| Domínios       | `packages/identity`, `chat`, `tickets`, `knowledge`, `agent` | Login e sessão; conversas, transferência e console do analista; chamados, prioridade, prazos e deduplicação; central de ajuda; orquestração do agent |
| Infraestrutura | `packages/shared`                                            | Config, logger, banco, eventos, HTTP, auth e resiliência                                                                                             |
| Contratos      | `packages/contracts`                                         | Tipos, schemas zod, eventos e interfaces públicas                                                                                                    |

Invariantes, aplicadas por `pnpm check:boundaries`:

- Um domínio só depende de `shared` e `contracts`. **Nunca de outro domínio.** Quando um precisa do outro, usa uma interface com token em `@nexo/contracts` ou um evento.
- Cada domínio acessa apenas as suas tabelas (um schema por domínio no Postgres, com Drizzle).
- Dentro de um domínio, o fluxo é `http -> core <- persistence`: o `core` guarda as regras e não conhece HTTP nem banco.

O `chat` orquestra a conversa e decide **no código** se a mensagem vai para o agent, para o analista ou para uma ação determinística (confirmar rascunho, escolher uma opção). Os eventos do turno chegam ao navegador por SSE. O sistema de chamados é tratado como **legado**: tem um injetor de falhas configurável (`TICKETS_OUTAGE_MODE`), e quem o consome usa timeout, nova tentativa com espera e uma resposta degradada definida no código.

## Como o agent decide

Cada mensagem do funcionário passa por duas etapas.

1. **`understand` (roteador).** Um modelo pequeno devolve uma saída estruturada: intenção, dados extraídos (número do chamado, sistema operacional, sintoma, impacto, compromisso no dia, alternativa, bloqueio), confiança e motivo. O registro fica salvo em `agent.runs`.
2. **Política do turno, no código.** Com esse entendimento, o código decide a rota: transferir (o funcionário pediu um analista, ou a confiança ficou abaixo de `AGENT_CONFIDENCE_THRESHOLD`), redirecionar (fora do escopo de TI) ou responder.
3. **Laço de passos com tools.** Para responder, o modelo roda um laço limitado a 6 passos, chamando tools com argumentos validados por zod (`buscar_central`, `citar_artigo`, `buscar_chamados`, `consultar_chamado`, `classificar_prioridade`, `propor_chamado`, `propor_complemento`, `propor_reabertura`, `transferir_para_analista`, entre outras). A resposta sai em **streaming**, e os passos executados aparecem acima dela. Eles são gravados por um decorador que envolve a execução real de cada tool, e não pelo texto do modelo.

Princípios que valem mais que o prompt:

- **O modelo só propõe; o código escreve.** As tools de escrita produzem apenas propostas (rascunho, complemento, reabertura). O chamado só é criado ou alterado quando a confirmação chega pelo botão, por uma opção rápida ou por uma frase afirmativa reconhecida no código, com `idempotencyKey`. "Zero escritas sem confirmação" é uma propriedade do código.
- **Regras do service desk ficam no `core` de `tickets`**, cobertas por testes determinísticos: matriz de prioridade, prazos em horas úteis, vencimento, janela de reabertura de 7 dias e deduplicação. O modelo extrai fatos; o código calcula a prioridade e o prazo e devolve o motivo exibido ao usuário.
- **Duplicidade:** `propor_chamado` recusa quando há chamado aberto equivalente. O modelo só segue citando explicitamente que não é duplicado, e isso aparece nas regras da decisão.
- **Transferência:** acontece a pedido do funcionário ou por baixa confiança do entendimento, e também por escolha do modelo quando o caso exige um analista (tool `transferir_para_analista`). Uma prioridade crítica no rascunho transfere no mesmo turno. **Chamado vencido** não transfere sozinho: o código avisa que o prazo passou e oferece falar com um analista (como na Tela 3 do protótipo); a conversa só vai para a fila se o funcionário aceitar. A conversa vai para a fila do console, com resumo, histórico e a decisão do agent; o analista assume, responde e devolve ao agent.
- **Privacidade:** o `requesterId` vem sempre da sessão, nunca de argumento escolhido pelo modelo. Chamados de outro funcionário respondem como "não encontrado", indistinguível de "sem permissão". O contexto enviado ao modelo só contém dados do funcionário da conversa e da central de ajuda.
- **Texto é dado, não instrução.** Mensagens, artigos e chamados não executam ações fora das tools registradas; as tools validam argumentos e autorização no código.

## Qualidade

### Testes

`pnpm test` roda os testes de unidade e de integração (Vitest, Testing Library e MSW no front; PGlite, o Postgres em WebAssembly, no back, então não dependem de Docker nem de chave). Última execução completa: **760 testes, todos passando**.

| Pacote            | Testes |
| ----------------- | ------ |
| `@nexo/contracts` | 24     |
| `@nexo/shared`    | 47     |
| `@nexo/identity`  | 25     |
| `@nexo/tickets`   | 95     |
| `@nexo/knowledge` | 22     |
| `@nexo/agent`     | 235    |
| `@nexo/chat`      | 231    |
| `@nexo/monolith`  | 11     |
| `@nexo/web`       | 68     |

`pnpm e2e` roda quatro jornadas no navegador com Playwright (abertura de chamado, chamado de terceiro, transferência para o analista e o chat em 375 px), contra um banco `nexo_e2e` próprio e o modelo roteirizado. É preciso ter o Postgres do `docker compose` no ar e instalar o Chromium uma vez (`pnpm --filter @nexo/e2e exec playwright install chromium`).

### Evals

Os evals medem o **modelo real** e custam dinheiro; por isso nunca rodam em `pnpm test` nem no CI. São 18 cenários (resolução pela central, abertura de chamado, duplicidade, reabertura, chamado de terceiro, injeção de instrução, fora de escopo, pedido de analista, entre outros), pontuados pelo resultado e pelo estado, não por um caminho fixo de tools nem por texto exato. Cada cenário tem um roteiro de ensaio que passa em todos os critérios, o que prova que o gabarito é satisfazível.

```bash
pnpm --filter @nexo/agent eval                              # rodada completa
pnpm --filter @nexo/agent eval -- --scenario <nome> --runs 1   # um cenário, para iterar
pnpm --filter @nexo/agent report                            # resume o custo e a latência registrados em agent.runs
```

Metas: confirmação antes de escrever, privacidade, escopo e transparência valem 100% em todas as execuções; resolução e chamados bem abertos usam meta de taxa de 90%. A chave vem só do `.env`, e os resultados ficam em `packages/agent/evals/results/`, fora do Git.

<!-- evals:start -->

Rodada final, com `openai/gpt-6-luna` como modelo de resposta e `deepseek/deepseek-v4-flash-0731` como roteador: 18 cenários × 5 execuções (90 turnos), **88 aprovados** e nenhuma falha de disponibilidade.

| Meta                          | Resultado    | Meta do PRD |
| ----------------------------- | ------------ | ----------- |
| Resolução sem fila            | 90% (18/20)  | 90%         |
| Chamados bem abertos          | 100% (10/10) | 90%         |
| Sem duplicidade               | 100% (20/20) | 100%        |
| Confirmação antes de escrever | 100%         | 100%        |
| Encaminhamento certo          | 100% (20/20) | 100%        |
| Escopo                        | 100% (10/10) | 100%        |
| Privacidade                   | 100% (10/10) | 100%        |
| Transparência                 | 100%         | 100%        |

- **Latência percebida** (meta revista do PRD; o desafio só pede "em tempo real" e "rápida"): o aceite chega em ~51 ms e o chat mostra o indicador na hora; o **primeiro passo** do agent aparece em p50 de 2,9 s e p90 de 3,7 s (meta: p50 ≤ 3 s e p95 ≤ 5 s); o **primeiro texto** em p50 de 4,6 s e p95 de 9,9 s (meta: p50 ≤ 5 s e p95 ≤ 10 s). Medi onde o tempo vai: cada chamada ao modelo leva cerca de 1,2 s, e um turno faz em média quatro em sequência (roteador, tools e resposta). O Mastra soma só ~0,1 s por chamada (roteador via Mastra: 1,47 s; a mesma chamada direta na API: 1,35 s). `:nitro` e `provider.sort` do OpenRouter ganham ~0,2 s por chamada e custam de 2 a 4 vezes mais, então não foram adotados. Reduzir mais exigiria menos chamadas em sequência (por exemplo, fundir o roteador ao laço), o que muda a arquitetura. Pedir ao modelo chamadas de tool em paralelo foi testado e piorou (falhas de execução, sem ganho de tempo).
- **Custo médio por turno:** US$ 0,0009. Para 10 mensagens, a estimativa é de US$ 0,0092 (meta de US$ 0,02, dentro).
- **Variação entre rodadas:** com 2 execuções por cenário (36 turnos) o resultado oscilou de 33 a 35 aprovados entre rodadas, por critérios de texto (`erro-809-windows-10`: o modelo às vezes pergunta "isso resolveu?" antes de escrever o passo do artigo; `status-sem-numero`) e por falhas transitórias do provedor (`agent_unavailable`, que agora deixam um aviso no log). Por isso a rodada final usa 5 execuções por cenário. Os dois cenários que ainda falham de vez em quando são esses de resolução.
- O que mudou desde a rodada anterior (DeepSeek, 34/36, chamados bem abertos em 50%): a pergunta "quem é afetado" passou a ser garantida pelo código; cada intenção só encerra o turno depois de uma tool finalizadora (propor, perguntar, transferir ou apresentar o chamado), porque o modelo às vezes escrevia o "rascunho" em texto, sem chamar a tool, e inventava prazo; em relato crítico (equipe ou empresa parada e impedimento de trabalhar) o código recusa a pergunta e manda propor o chamado; e a tool de transferência não aceita mais o motivo "vencido", que só se aplica quando o funcionário aceita a oferta.

<!-- evals:end -->

## Escolha do modelo e do OpenRouter

O **OpenRouter** dá uma API única para vários modelos e provedores. Trocar de modelo é mudar uma variável de ambiente (`LLM_MODEL`, `LLM_ROUTER_MODEL`), e o roteamento entre provedores dá resiliência a limites de taxa (429). A chamada ao modelo acontece só no backend, atrás da porta `LlmClient`, e o Mastra fica isolado em `agent/persistence`.

Modelo de resposta escolhido: **`openai/gpt-6-luna`**, a US$ 0,10 por milhão de tokens na entrada e US$ 0,50 na saída. Roteador mantido em **`deepseek/deepseek-v4-flash-0731`** (US$ 0,12 e US$ 0,24). O raciocínio não é obrigatório em nenhum dos dois (`reasoning.mandatory: false` no catálogo) e fica desligado (`reasoning.enabled=false`).

Comparação final, com o código atual, 18 cenários × 2 execuções (36 turnos por candidato) e o roteador fixo:

| Modelo de resposta                | Aprovados           | Primeiro trecho p50 / p95 | Custo por turno | Observação                                                                                                              |
| --------------------------------- | ------------------- | ------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `openai/gpt-6-luna`               | 88/90 (5 execuções) | 4,6 s / 9,9 s             | US$ 0,0009      | Todas as metas atingidas                                                                                                |
| `anthropic/claude-haiku-5.5`      | 29/36               | 4,4 s / 7,6 s             | US$ 0,0022      | Chamados bem abertos em 25% (perguntou de novo o Windows que já foi dito); 10 mensagens custam US$ 0,022, acima da meta |
| `deepseek/deepseek-v4-flash-0731` | 34/36               | 5,3 s / 10,2 s            | US$ 0,0015      | 3 turnos sem resposta por indisponibilidade do provedor                                                                 |
| `inception/mercury-2.5`           | 22/36               | 5,6 s / 15,2 s            | US$ 0,0013      | Falhou em privacidade e em chamados bem abertos                                                                         |

Luna como roteador também foi testado e ficou mais lento (p50 de 6,9 s) sem ganho de qualidade. A escolha seguiu aprovação, latência e custo, nessa ordem: o Luna empata ou ganha em aprovação, custa menos e não teve falha de disponibilidade. Nenhum candidato chega a 2 s até o primeiro texto, porque o turno tem uma chamada de roteador e, em geral, três a quatro chamadas do laço. Trocar de modelo é mudar `LLM_MODEL` no `.env`. Aprendizados da escolha:

- **Modelos de raciocínio consomem `max_tokens` pensando e devolvem texto vazio.** Por isso o raciocínio é desligado.
- O **Gemini 2.5 Flash-Lite foi descartado como roteador** (429 do Google em 11 de 20 chamadas) e o **Gemini 3.8 Flash**, por ter raciocínio obrigatório e custar cerca de oito vezes mais.
- Modelos com poucos provedores sofrem com limite de taxa; a redundância de provedores do OpenRouter pesa mais na escolha do que uns décimos de segundo.
- Cenário que reprova em todos os modelos aponta primeiro para a tool: `reabertura-fora-do-prazo` reprovava em todos porque a exigência de tool finalizadora lia o resultado da tool sem o embrulho `{ type: "json", value }` do `prepareStep`.

O custo por turno é registrado em `agent.runs`, a partir do usage accounting do OpenRouter ou, na falta dele, de uma tabela de preços por modelo (`model-prices.ts`). Os valores medidos por conversa entram no bloco de resultados acima.

## Trade-offs

- **Duas chamadas ao modelo por mensagem** (roteador e laço) em troca de decisões de transferência testáveis sem modelo. O primeiro passo aparece em ~3 s e o primeiro texto em **p50 de 4,6 s e p95 de 9,9 s**, dentro da meta revista do PRD (5 s e 10 s) e acima da original (2 s). É um trade-off assumido e registrado.
- **Tool obrigatória até a finalizadora** (`toolChoice: required` no `prepareStep`): garante que o agent nunca escreva um "rascunho" ou uma "proposta" em texto sem a tool; a exigência cai com ação pendente e após três passos.
- **Postgres com um schema por domínio e Drizzle**, em vez de um banco sem serviço (SQLite): a regra "cada domínio só acessa as próprias tabelas" fica visível no banco e o deploy cabe num Postgres gerenciado. Custa um `docker compose up -d`. Nos testes, PGlite dá Postgres de verdade sem Docker.
- **SSE em vez de WebSocket:** o tráfego é quase todo servidor para cliente, passa por proxies HTTP comuns e usa o cookie de sessão. O hub de eventos é em memória, então vale para uma instância; a evolução é `LISTEN/NOTIFY`.
- **Tickets dentro do monólito, como "legado":** o agent só o consome por interface, com decorador resiliente. Virar app dedicada exige apenas trocar o provedor do token por um cliente HTTP.
- **Limite de 100 linhas por arquivo e de 30 por função**, imposto pelo linter, em troca de muitos arquivos pequenos.

## Custo, limites e segurança

Controles pensados para o ambiente publicado (RF56):

- **Chaves só em variáveis de ambiente.** `.env` fora do Git; `.env.example` com valores fictícios; `VITE_*` é público e nunca recebe chave. A configuração é validada na inicialização e a API falha rápido se faltar algo.
- **Rate limit por usuário** nos endpoints de chat (`CHAT_RATE_LIMIT_PER_MINUTE`, padrão 12 por minuto).
- **30 mensagens por sessão.** Ao chegar no limite, a API responde sem chamar o modelo e orienta o funcionário a falar com um analista.
- **Teto diário de custo** (`LLM_DAILY_BUDGET_USD`, padrão US$ 2): somado a partir de `agent.runs`; ao atingi-lo, o turno termina sem chamar o modelo. Há também um orçamento de **600.000 tokens de entrada por conversa** (cada turno consome cerca de 13 mil, porque o laço reenvia o contexto e os schemas das tools a cada passo); a conversa atravessa sessões, então ao esgotá-lo o agent responde sem chamar o modelo e oferece o analista. Em produção, configure ainda um limite de crédito na própria chave do OpenRouter.
- **Em `NODE_ENV=production` a configuração recusa**: `LLM_PROVIDER=scripted`, `LOG_LEVEL=debug` e o `JWT_SECRET` de exemplo; o segredo precisa ter ao menos 32 caracteres. O cookie de sessão sai `HttpOnly; Secure; SameSite=Lax`.
- Origem do `web` definida em CORS (`WEB_ORIGIN`), limite de corpo da requisição e nenhuma mensagem de erro com stack, SQL ou detalhe do provedor.

## Deploy

A aplicação publica como **serviço único**: o monólito serve a API em `/api` e o build do `web` (com fallback de SPA) quando `SERVE_WEB_DIR` está definido. A mesma origem mantém o cookie `SameSite=Lax; Secure`.

O `Dockerfile` é multi-stage: o primeiro estágio instala com pnpm, compila pacotes e front (com `VITE_API_URL=/api`) e isola o monólito com `pnpm deploy --prod`; o estágio final roda como usuário `node` com `NODE_ENV=production`, porta em `PORT` e health check em `/api/health`.

```bash
docker build -t nexo-assist .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgres://usuario:senha@host:5432/banco \
  -e WEB_ORIGIN=http://localhost:3000 \
  -e JWT_SECRET=<segredo-aleatorio-com-32-ou-mais-caracteres> \
  -e OPENROUTER_API_KEY=<sua-chave> \
  -e LLM_MODEL=deepseek/deepseek-v4-flash-0731 \
  -e LLM_ROUTER_MODEL=deepseek/deepseek-v4-flash-0731 \
  nexo-assist
```

### Publicado no Render

Link: https://nexo-assist.onrender.com

- Entre com qualquer usuário da tabela acima e a senha **`senha@1234`**. Em produção o login exige essa senha; localmente qualquer texto não vazio funciona.
- O plano é gratuito: depois de 15 minutos sem uso o serviço dorme e o **primeiro acesso leva cerca de 1 minuto** para acordar.
- O banco é o Postgres gratuito do Render, que **expira 30 dias** após a criação. Para um banco permanente, crie um Postgres gerenciado em outro provedor (por exemplo, o Neon) e troque a `DATABASE_URL`: as migrations e os dados de exemplo rodam sozinhos no boot.
- A chave do OpenRouter e o `JWT_SECRET` ficam só nas variáveis de ambiente do Render. Nada disso vai para o Git.

Passos:

1. Crie um **Postgres** no Render (ou use o de outro provedor) e copie a URL de conexão interna.
2. Crie um **Web Service** a partir deste repositório. O Render detecta o `Dockerfile` e usa o build multi-stage. Escolha o plano Free.
3. Configure as variáveis do serviço:
   - `NODE_ENV=production` (já vem na imagem)
   - `DATABASE_URL`: a URL do Postgres
   - `WEB_ORIGIN`: a URL pública do serviço, com `https://`
   - `JWT_SECRET`: valor aleatório com 32 caracteres ou mais
   - `OPENROUTER_API_KEY`, `LLM_PROVIDER=openrouter`, `LLM_MODEL` e `LLM_ROUTER_MODEL`
   - `LLM_DAILY_BUDGET_USD` e `CHAT_RATE_LIMIT_PER_MINUTE` conforme o orçamento
   - `LOG_LEVEL=info`
   - `SEED_DEMO_DATA=true` para carregar as pessoas, a central de ajuda e os chamados de exemplo
   - `SEED_USER_PASSWORD=senha@1234` (padrão): a senha dos usuários de exemplo no ambiente publicado
   - `SERVE_WEB_DIR=/app/web` (já vem na imagem)
4. Defina o **Health Check Path** como `/api/health`. O Render injeta `PORT`.
5. Faça o deploy, abra o domínio, entre com um usuário de demonstração e confira o fluxo: login, uma conversa completa e o limite de mensagens.

## O que eu faria com mais tempo

- **Roteador híbrido com o Jev** (TypeSafe), um modelo de decisão estruturada com cerca de 0,4 s por classificação, para `intent` e `confidence`. Atacaria a latência do primeiro trecho, hoje o principal custo.
- **503 prévio para `budget_exhausted`:** hoje o teto diário vira `turn.failed` depois do aceite da mensagem.
- **Distinguir 429 e 402 do provedor**, hoje ambos viram `agent_unavailable`.
- **Logs `warn`** para orçamento atingido e para limite de passos.
- **`pass^k` no relatório dos evals**, para medir consistência entre execuções e não só a média.
- Hub de eventos distribuído (`LISTEN/NOTIFY`) para mais de uma instância.
