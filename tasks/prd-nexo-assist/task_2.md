# Tarefa 2.0: `shared/database`: Drizzle, migrations, PGlite e health check

## Visão geral

Troca a base de dados do scaffold por Postgres com Drizzle, com um schema por domínio. Oferece o token `DATABASE`, a aplicação de migrations por domínio e um banco PGlite em memória para os testes de integração. O health check passa a verificar o banco.

<skills>
### Conformidade com skills

- `nestjs`: módulo `@Global()`, provider por token, `onApplicationShutdown` idempotente e health check.
- `arquitetura-modular`: `shared` é infraestrutura, sem regra de negócio nem tabela de domínio.
- `testes`: PGlite como banco real nos testes de integração, sem Docker.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `modular-architecture.md`: cada domínio acessa só as próprias tabelas; `shared` não conhece domínios.
- `code-standards.md`: arquivos de até 100 linhas e funções de até 30.
- Imports relativos com `.js`.
</rules>

<requirements>
- RF52: dados sobrevivem a um reinício (Postgres persistente).
- `DatabaseModule` global com token `DATABASE` (Drizzle sobre `pg.Pool`, no máximo 10 conexões), fechado em `onApplicationShutdown`.
- `runMigrations({ folder, schema })` com tabela de controle `<schema>.__migrations`.
- Subpath `@nexo/shared/database/testing` com PGlite em memória e as mesmas migrations.
- `GET /api/health` responde 503 se `select 1` falhar.
</requirements>

## Subtarefas

- [x] 2.1 Instalar `drizzle-orm`, `drizzle-kit`, `pg` e `@electric-sql/pglite` no pacote `shared`.
- [x] 2.2 Implementar `DatabaseModule` com o token `DATABASE` e o fechamento do pool.
- [x] 2.3 Implementar `runMigrations` e o helper de teste PGlite em `database/testing`.
- [x] 2.4 Exportar os subpaths no `package.json` de `shared`.
- [x] 2.5 Atualizar `health.controller.ts` com ping no banco.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", item `database` de `packages/shared`.
- TechSpec, "Esquema do banco", parágrafo sobre migrations em `onModuleInit` e seeds em `onApplicationBootstrap`.
- TechSpec, "Pontos de integração", Postgres.

## Critérios de aceitação relacionados

- CA-21
- CA-38

## Testes da tarefa

### Testes de integração

- [x] `runMigrations` aplica as migrations de um schema de exemplo no PGlite uma única vez (idempotente).
- [x] Health check: 200 com banco disponível; 503 quando o ping falha.

## Arquivos relevantes

- `packages/shared/src/database/*` e `packages/shared/src/database/testing/*` (novo)
- `packages/shared/package.json`
- `apps/monolith/src/health.controller.ts`
