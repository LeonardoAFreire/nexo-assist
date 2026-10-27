# Tarefa 6.0: Domínio `identity`: login, sessão, perfil e seed

## Visão geral

Implementa o domínio `identity` inteiro: a tabela de usuários com a seed dos funcionários e analistas, o login que aceita qualquer senha não vazia para e-mails conhecidos, o logout, o `me` e a `IdentityApi` usada pelo `chat`.

<skills>
### Conformidade com skills

- `nestjs`: controller fino com `ZodValidationPipe`, módulo provedor `@Global()`, migrations em `onModuleInit` e seed em `onApplicationBootstrap`.
- `arquitetura-modular`: `index.ts` exporta só o módulo; o token `IDENTITY_API` é o único ponto de acesso de outros domínios.
- `testes`: integração com PGlite, `supertest` e cookie real.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: senha nunca registrada em log nem persistida; e-mail desconhecido com mensagem genérica; sem hash porque não há senha armazenada (decisão da TechSpec).
- `modular-architecture.md`: `identity.users` só acessada por este domínio.
- `folder-structure.md`: `http → core ← persistence`.
</rules>

<requirements>
- RF1, RF2: e-mail corporativo e qualquer senha não vazia; e-mail desconhecido recusado com `invalid_credentials`.
- RF3: o papel vem dos dados de exemplo.
- RF4: `logout` limpa o cookie e responde 204 mesmo sem sessão; `me` devolve 401 sem sessão.
- RF5: `SessionUser` com nome, e-mail, setor, nível e iniciais.
- `IdentityApi.findProfiles({ userIds })`.
</requirements>

## Subtarefas

- [x] 6.1 Schema Drizzle `identity.users`, migration e seed a partir de `DEMO_PEOPLE`.
- [x] 6.2 `core/`: `LoginUseCase` (gera `sid` novo), `UserProfile` e `IdentityService`.
- [x] 6.3 `http/`: `AuthController` com `login`, `logout` e `me`.
- [x] 6.4 `IdentityModule` `@Global()` com o token `IDENTITY_API`.

## Detalhes de implementação

- TechSpec, "Domínio `identity`".
- TechSpec, "SessionUser" e "UserProfile".
- TechSpec, "`POST /api/auth/login`" e "`POST /api/auth/logout` · `GET /api/auth/me`".

## Critérios de aceitação relacionados

- CA-01
- CA-03

## Testes da tarefa

### Testes de unidade

- [x] `LoginUseCase`: e-mail conhecido em qualquer caixa cria sessão; senha vazia e e-mail desconhecido geram o mesmo erro genérico.

### Testes de integração

- [x] TI-01 — autentica funcionário e analista e recusa e-mail desconhecido com mensagem genérica.

## Arquivos relevantes

- `packages/identity/src/{core,persistence,http}/**`
- `packages/identity/drizzle/**` (novo)
- `packages/identity/src/identity.module.ts`, `index.ts`, `package.json`
