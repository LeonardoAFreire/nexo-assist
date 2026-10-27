# Tarefa 20.0: `web`: base (shell, rotas, cliente HTTP, MSW), login e perfil

## Visão geral

Prepara o frontend para as telas do Nexo Assist: remove o scaffold, cria as rotas com proteção por papel, o `AppShell` fiel ao protótipo, o interceptor de erros do cliente HTTP e a infraestrutura de testes com MSW. Entrega as telas de login e de perfil.

<skills>
### Conformidade com skills

- `react`: fluxo `page → components/hooks → api`; React Query para a sessão; shadcn/ui e tokens de tema; acessibilidade (rótulos, foco visível).
- `testes`: Testing Library, `user-event`, MSW 3, providers reais e `QueryClient` com `retry: false` (`references/frontend.md`).
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `folder-structure.md`: um módulo do frontend não importa outro; tipos da API vêm de `@nexo/contracts`; URL da API de `VITE_API_URL`.
- `security-privacy.md`: nenhuma chave em `VITE_*`; mensagem genérica no login inválido.
- `code-standards.md`: componentes pequenos, sem comentários.
</rules>

<requirements>
- RF1, RF2: tela de login com e-mail, senha, "Manter conectado" e a apresentação do protótipo; erro genérico.
- RF3: redirecionamento por papel (`/atendimento` ou `/console`).
- RF4: "Sair" encerra a sessão; 401 manda para `/login`.
- RF5: "Meu perfil" com nome, e-mail ("Gerenciado pela TI") e "Redefinir senha" desabilitado.
- Layout desktop fiel ao protótipo a partir de 1280 px; textos em pt-BR.
</requirements>

## Subtarefas

- [ ] 20.1 Remover `status-page.tsx`, `use-api-health.ts` e `modules/tickets/`.
- [ ] 20.2 `lib/http.ts` com interceptor de `ApiError` e redirecionamento em 401.
- [ ] 20.3 `test/server.ts` (MSW) e `test/render.tsx` (providers reais).
- [ ] 20.4 Rotas, `RequireRole` e `AppShell` (sidebar, barra superior com "Assistente online" e "Sair"), com os tokens de cor e tipografia do protótipo.
- [ ] 20.5 `modules/identity`: `login`, `logout`, `getMe`, `useSession`, `useLogin`, `useLogout`, `LoginPage` (`LoginHero`, `LoginForm`) e `ProfilePage` (`ProfileCard`).

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", itens `app/` e `modules/identity` do frontend.
- TechSpec, "`POST /api/auth/login`" e "`POST /api/auth/logout` · `GET /api/auth/me`".
- Protótipo `docs/nexo/nexo.pen`: Tela 1 (login) e "Meu perfil".
- PRD, "Requisitos de UI/UX" e "Acessibilidade".

## Critérios de aceitação relacionados

- CA-01
- CA-03

## Testes da tarefa

### Testes de integração

- [ ] TI-27 — redireciona por papel após o login e mostra o perfil com redefinir senha desabilitado.

## Arquivos relevantes

- `apps/web/src/app/**`, `apps/web/src/lib/http.ts`
- `apps/web/src/modules/identity/**`
- `apps/web/src/test/{server.ts,render.tsx}` (novos)
- `docs/nexo/nexo.pen`
