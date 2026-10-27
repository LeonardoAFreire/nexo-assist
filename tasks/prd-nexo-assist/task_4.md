# Tarefa 4.0: `shared/auth`: sessão JWT, guards e cookie

## Visão geral

Infraestrutura de sessão usada por todos os controllers: assinatura e verificação do JWT no cookie `nexo_session`, o guard que exige sessão, o decorador da sessão atual, o controle por papel e a verificação de origem nas rotas que escrevem. Não decide quem pode entrar; isso é do `identity`.

<skills>
### Conformidade com skills

- `nestjs`: guards, decoradores de parâmetro, `main.ts` (`cookie-parser`, limite de corpo de 32 kB, CORS com `WEB_ORIGIN`).
- `arquitetura-modular`: `auth` em `shared` é infraestrutura, sem regra de negócio.
- `testes`: teste dos guards com sessão válida, expirada e ausente.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: JWT com segredo do ambiente e expiração; identidade só da sessão; CORS com `WEB_ORIGIN`; limite de corpo.
- `code-standards.md`: segredos fora do código.
</rules>

<requirements>
- RF4: identidade de toda consulta vem da sessão.
- `SessionTokenService` com `jose` e `JWT_SECRET`; o JWT contém só `sub`, `role`, `sid` e `exp`.
- Cookie httpOnly, `SameSite=Lax` e `Secure` em produção; expiração por `SESSION_TTL_HOURS` ou `SESSION_REMEMBER_DAYS`.
- `SessionGuard` (401 `unauthenticated`), `@CurrentSession()`, `@Roles('employee' | 'analyst')` (403 `forbidden`) e `OriginGuard`.
</requirements>

## Subtarefas

- [ ] 4.1 Instalar `jose` e `cookie-parser` nos pacotes que os usam.
- [ ] 4.2 Implementar `SessionTokenService` e as opções do cookie.
- [ ] 4.3 Implementar `SessionGuard`, `@CurrentSession()`, `@Roles()` e `OriginGuard`.
- [ ] 4.4 Ajustar `apps/monolith/src/main.ts`: `cookie-parser`, limite de corpo de 32 kB e CORS com credenciais.
- [ ] 4.5 Exportar o subpath `@nexo/shared/auth`.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", item `auth` de `packages/shared`.
- TechSpec, "SessionUser", parágrafo sobre o JWT e a expiração.
- TechSpec, "Endpoints da API", introdução (guards por rota).

## Critérios de aceitação relacionados

- CA-02

## Testes da tarefa

### Testes de unidade

- [ ] `SessionTokenService` assina e verifica; token expirado ou com assinatura inválida é recusado.
- [ ] `SessionGuard`, `@Roles()` e `OriginGuard`: 401 sem sessão, 403 com papel errado, recusa de origem diferente de `WEB_ORIGIN` em rota que escreve.

## Arquivos relevantes

- `packages/shared/src/auth/**` (novo)
- `packages/shared/package.json`
- `apps/monolith/src/main.ts`
