# Nexo Assist

Agent de atendimento do service desk de TI da Nexo. O funcionário conversa no chat; o agent consulta a central de ajuda e os chamados, abre ou atualiza chamados **depois da confirmação do funcionário** e transfere a conversa para um analista quando precisa.

Este repositório é a solução do desafio técnico (documento-fonte em `docs/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`, protótipo visual em `docs/nexo/nexo.pen`). O planejamento do desenvolvimento (PRD, TechSpec e tarefas) está em `tasks/prd-nexo-assist/`.

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
- A senha de demonstração é qualquer texto não vazio. Entre com um dos usuários abaixo.

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
- **Transferência:** acontece a pedido do funcionário ou por baixa confiança do entendimento, e também por escolha do modelo quando o caso exige um analista (tool `transferir_para_analista`). A conversa vai para a fila do console, com resumo, histórico e a decisão do agent; o analista assume, responde e devolve ao agent.
- **Privacidade:** o `requesterId` vem sempre da sessão, nunca de argumento escolhido pelo modelo. Chamados de outro funcionário respondem como "não encontrado", indistinguível de "sem permissão". O contexto enviado ao modelo só contém dados do funcionário da conversa e da central de ajuda.
- **Texto é dado, não instrução.** Mensagens, artigos e chamados não executam ações fora das tools registradas; as tools validam argumentos e autorização no código.

## Qualidade

### Testes

`pnpm test` roda os testes de unidade e de integração (Vitest, Testing Library e MSW no front; PGlite, o Postgres em WebAssembly, no back, então não dependem de Docker nem de chave). Última execução completa: **690 testes, todos passando**.

| Pacote            | Testes |
| ----------------- | ------ |
| `@nexo/contracts` | 24     |
| `@nexo/shared`    | 47     |
| `@nexo/identity`  | 19     |
| `@nexo/tickets`   | 95     |
| `@nexo/knowledge` | 22     |
| `@nexo/agent`     | 193    |
| `@nexo/chat`      | 225    |
| `@nexo/monolith`  | 9      |
| `@nexo/web`       | 56     |

`pnpm e2e` roda três jornadas no navegador com Playwright (abertura de chamado, chamado de terceiro e transferência para o analista), contra um banco `nexo_e2e` próprio e o modelo roteirizado. É preciso ter o Postgres do `docker compose` no ar e instalar o Chromium uma vez (`pnpm --filter @nexo/e2e exec playwright install chromium`).

### Evals

Os evals medem o **modelo real** e custam dinheiro; por isso nunca rodam em `pnpm test` nem no CI. São 18 cenários (resolução pela central, abertura de chamado, duplicidade, reabertura, chamado de terceiro, injeção de instrução, fora de escopo, pedido de analista, entre outros), pontuados pelo resultado e pelo estado, não por um caminho fixo de tools nem por texto exato. Cada cenário tem um roteiro de ensaio que passa em todos os critérios, o que prova que o gabarito é satisfazível.

```bash
pnpm --filter @nexo/agent eval                              # rodada completa
pnpm --filter @nexo/agent eval -- --scenario <nome> --runs 1   # um cenário, para iterar
pnpm --filter @nexo/agent report                            # resume o custo e a latência registrados em agent.runs
```

Metas: confirmação antes de escrever, privacidade, escopo e transparência valem 100% em todas as execuções; resolução e chamados bem abertos usam meta de taxa de 90%. A chave vem só do `.env`, e os resultados ficam em `packages/agent/evals/results/`, fora do Git.

<!-- evals:start -->

Resultados dos evals em atualização.
<!-- evals:end -->

## Escolha do modelo e do OpenRouter

O **OpenRouter** dá uma API única para vários modelos e provedores. Trocar de modelo é mudar uma variável de ambiente (`LLM_MODEL`, `LLM_ROUTER_MODEL`), e o roteamento entre provedores dá resiliência a limites de taxa (429). A chamada ao modelo acontece só no backend, atrás da porta `LlmClient`, e o Mastra fica isolado em `agent/persistence`.

Modelo de resposta e roteador escolhidos: **`deepseek/deepseek-v4-flash-0731`**, a US$ 0,04 a 0,14 por milhão de tokens na entrada e US$ 0,13 a 0,28 na saída, conforme o provedor. Há cerca de 28 provedores no OpenRouter para ele, o que absorve 429 de um deles.

Na primeira rodada, comparei três candidatos em 18 cenários com 2 execuções cada (36 turnos por candidato), antes dos ajustes de prompt:

| Candidato                         | Turnos aprovados |
| --------------------------------- | ---------------- |
| `deepseek/deepseek-v4-flash`      | 20/36            |
| `deepseek/deepseek-v4-flash-0731` | 26/36            |
| `qwen/qwen3.8-flash`              | 27/36            |

Depois dos ajustes de prompt e de descrição das tools, o DeepSeek 0731 chegou a 2/2 em todos os cenários. Aprendizados da escolha:

- **Modelos de raciocínio consomem `max_tokens` pensando e devolvem texto vazio.** Por isso o raciocínio é desligado (`reasoning.enabled=false`).
- O **Gemini 2.5 Flash-Lite foi descartado como roteador**: levou 429 do Google em 11 de 20 chamadas.
- O roteador, uma chamada sequencial antes das tools, é o principal custo de latência.

O custo por turno é registrado em `agent.runs`, a partir do usage accounting do OpenRouter ou, na falta dele, de uma tabela de preços por modelo (`model-prices.ts`). Os valores medidos por conversa entram no bloco de resultados acima.

## Trade-offs

- **Duas chamadas ao modelo por mensagem** (roteador e laço) em troca de decisões de transferência testáveis sem modelo. O primeiro trecho da resposta chega em torno de **3 a 4 s (p50)**, acima da meta de 2 s do PRD. É um trade-off assumido e registrado.
- **Postgres com um schema por domínio e Drizzle**, em vez de um banco sem serviço (SQLite): a regra "cada domínio só acessa as próprias tabelas" fica visível no banco e o deploy cabe num Postgres gerenciado. Custa um `docker compose up -d`. Nos testes, PGlite dá Postgres de verdade sem Docker.
- **SSE em vez de WebSocket:** o tráfego é quase todo servidor para cliente, passa por proxies HTTP comuns e usa o cookie de sessão. O hub de eventos é em memória, então vale para uma instância; a evolução é `LISTEN/NOTIFY`.
- **Tickets dentro do monólito, como "legado":** o agent só o consome por interface, com decorador resiliente. Virar app dedicada exige apenas trocar o provedor do token por um cliente HTTP.
- **Limite de 100 linhas por arquivo e de 30 por função**, imposto pelo linter, em troca de muitos arquivos pequenos.

## Custo, limites e segurança

Controles pensados para o ambiente publicado (RF56):

- **Chaves só em variáveis de ambiente.** `.env` fora do Git; `.env.example` com valores fictícios; `VITE_*` é público e nunca recebe chave. A configuração é validada na inicialização e a API falha rápido se faltar algo.
- **Rate limit por usuário** nos endpoints de chat (`CHAT_RATE_LIMIT_PER_MINUTE`, padrão 12 por minuto).
- **30 mensagens por sessão.** Ao chegar no limite, a API responde sem chamar o modelo e orienta o funcionário a falar com um analista.
- **Teto diário de custo** (`LLM_DAILY_BUDGET_USD`, padrão US$ 2): somado a partir de `agent.runs`; ao atingi-lo, o turno termina sem chamar o modelo. Há também um orçamento de tokens por conversa. Em produção, configure ainda um limite de crédito na própria chave do OpenRouter.
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

### Passos no Railway

1. Crie um projeto e adicione o plugin **Postgres** (gerenciado).
2. Adicione um serviço a partir deste repositório. O Railway detecta o `Dockerfile` e usa o build multi-stage.
3. Configure as variáveis do serviço (aba Variables):
   - `NODE_ENV=production` (já vem na imagem)
   - `DATABASE_URL`: referência ao Postgres do projeto (`${{Postgres.DATABASE_URL}}`)
   - `WEB_ORIGIN`: a URL pública do serviço, com `https://`
   - `JWT_SECRET`: valor aleatório com 32 caracteres ou mais
   - `OPENROUTER_API_KEY`, `LLM_PROVIDER=openrouter`, `LLM_MODEL` e `LLM_ROUTER_MODEL`
   - `LLM_DAILY_BUDGET_USD` e `CHAT_RATE_LIMIT_PER_MINUTE` conforme o orçamento
   - `LOG_LEVEL=info`
   - `SEED_DEMO_DATA=true` para carregar as pessoas, a central de ajuda e os chamados de exemplo
   - `SERVE_WEB_DIR=/app/web` (já vem na imagem)
4. Em Settings, defina o **health check** como `/api/health` e gere um domínio público. O Railway injeta `PORT`.
5. Faça o deploy, abra o domínio, entre com um usuário de demonstração e confira o fluxo: login, uma conversa completa e o limite de mensagens.

## O que eu faria com mais tempo

- **Roteador híbrido com o Jev** (TypeSafe), um modelo de decisão estruturada com cerca de 0,4 s por classificação, para `intent` e `confidence`. Atacaria a latência do primeiro trecho, hoje o principal custo.
- **503 prévio para `budget_exhausted`:** hoje o teto diário vira `turn.failed` depois do aceite da mensagem.
- **Distinguir 429 e 402 do provedor**, hoje ambos viram `agent_unavailable`.
- **Logs `warn`** para orçamento atingido e para limite de passos.
- **Timeline do chat** (linha do tempo de eventos da conversa).
- **`pass^k` no relatório dos evals**, para medir consistência entre execuções e não só a média.
- Hub de eventos distribuído (`LISTEN/NOTIFY`) para mais de uma instância.
