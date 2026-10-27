# Estrutura de pastas

Monorepo Turborepo com pnpm. Os pacotes usam o escopo `@nexo/*`. A lógica fica em `packages/`; `apps/` apenas compõe e inicializa. As regras de dependência estão em [modular-architecture.md](modular-architecture.md).

```text
.
├── apps/
│   ├── monolith/           # NestJS: main.ts + monolith.module.ts, importa todos os domínios
│   └── web/                # React + Vite
├── packages/
│   ├── contracts/          # tipos, schemas zod, eventos e interfaces públicas
│   ├── shared/             # config, logger, database, events, http, auth, resilience (infra do backend)
│   ├── identity/           # login e sessão
│   ├── chat/               # conversas, mensagens, transferência, console do analista
│   ├── tickets/            # chamados, prioridade e prazos, deduplicação
│   ├── knowledge/          # central de ajuda
│   └── agent/              # orquestração do agent e porta para o modelo
├── e2e/                    # testes Playwright
├── docker-compose.yml      # Postgres local (postgres:17)
├── tasks/                  # fluxo SDD: tasks/prd-<slug>/{prd,techspec,tasks,task_N,qa,codereview}.md
├── docs/                   # documentos-fonte (PRD do desafio, protótipo)
├── tools/scripts/          # check-boundaries.mjs e outros utilitários
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

## Backend

```text
packages/<domínio>/src/
├── index.ts                # exporta apenas o módulo Nest
├── <domínio>.module.ts
├── core/                   # entidades, regras, casos de uso, portas
├── persistence/            # repositórios que implementam as portas
├── http/                   # controllers e DTOs
└── drizzle/                # migrations SQL do schema do domínio (gerado pelo drizzle-kit)
```

`packages/agent/` tem ainda `evals/` (casos e execução dos evals do modelo, fora da suíte de testes comum).

Subpaths de `packages/shared` (cada um é um export em `package.json`):

```text
packages/shared/src/
├── config/                 # AppConfig e schema do ambiente
├── logger/
├── database/               # conexão Postgres e módulo; database/testing expõe o PGlite para testes
├── events/
├── http/                   # filtro de exceção, pipes, guards
├── auth/                   # sessão e JWT
└── resilience/             # timeout e nova tentativa com espera
```

Os subpaths públicos são `@nexo/shared/{config,logger,database,database/testing,events,http,auth,resilience}`.

- `core/`: regras de negócio independentes de HTTP e de banco. É onde ficam os testes unitários mais importantes.
- `persistence/`: acesso a dados e integrações externas (por exemplo, o cliente do sistema de chamados legado).
- `http/`: recebe a requisição, valida a entrada com os schemas de `@nexo/contracts` e delega ao `core`. Sem regra de negócio.
- `apps/monolith` contém só `main.ts`, `monolith.module.ts` e o health check.
- Um tipo por arquivo, com o nome do conceito. Contratos compartilhados ficam em `packages/contracts`.
- Testes unitários e de integração ao lado do código (`*.test.ts`, `*.integration.test.ts`).

Fluxo: `requisição HTTP → http → core ← persistence`.

## Frontend

```text
apps/web/src/
├── app/                    # providers (QueryClient, router), rotas, layout raiz
├── modules/<domínio>/      # um módulo por contexto: identity, chat, console, tickets
│   ├── api/                # funções axios que chamam o backend
│   ├── hooks/              # useQuery/useMutation e lógica de estado da tela
│   ├── components/         # componentes do módulo
│   ├── pages/              # telas
│   └── types/
├── components/
│   ├── ui/                 # componentes do shadcn/ui (gerados, não editar sem necessidade)
│   └── ...                 # componentes compartilhados entre módulos
├── lib/                    # cliente axios, query client, utilitários (cn)
└── main.tsx
```

- Fluxo: `page → components/hooks → api → backend`. Componentes e páginas não chamam axios diretamente.
- Um módulo do frontend não importa outro módulo. O que for comum vai para `components/` ou `lib/`.
- Tipos e schemas de resposta vêm de `@nexo/contracts`; não redeclare tipos da API.
- A URL da API vem de `VITE_API_URL`.

## Convenções

- Pacotes, apps e pastas em kebab-case; arquivos Nest com o sufixo do papel (`tickets.module.ts`, `tickets.controller.ts`).
- Crie uma pasta ou pacote novo somente quando representar uma responsabilidade clara e recorrente.
- Cada pacote mantém seus próprios `package.json` e `tsconfig.json`, estendendo `tsconfig.base.json`.
