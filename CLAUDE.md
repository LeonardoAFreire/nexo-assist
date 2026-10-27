# Nexo Assist

Agent de atendimento do service desk de TI da Nexo: o funcionário conversa no chat, o agent consulta a central de ajuda e os chamados, abre ou atualiza chamados com confirmação e transfere para um analista quando precisa. Documento-fonte: `docs/Desafio_Tecnico_Nexo_Assist_PRD_v5.pdf`. Protótipo visual: `docs/nexo/nexo.pen`.

## Stack

- Monorepo: Turborepo + pnpm, TypeScript estrito.
- Backend: NestJS, monólito modular (`apps/monolith`) com domínios em `packages/`.
- Frontend: React 19 + Vite, Tailwind, shadcn/ui, TanStack Query e axios (`apps/web`).
- Testes: Vitest, Testing Library, MSW, Playwright (`e2e/`).
- Qualidade: oxlint (lint, com checagem por tipos), oxfmt (formatação) e TypeScript 7.

## Regras do projeto

As regras em `.claude/rules/` são curtas, sempre válidas e carregadas automaticamente:

- `modular-architecture.md`: unidades, tags e invariantes de dependência entre pacotes.
- `folder-structure.md`: estrutura de pastas do backend, frontend e testes.
- `code-standards.md` e `javascript-typescript.md`: estilo de código e TypeScript.
- `security-privacy.md`: segredos e privacidade dos chamados.
- `git-commits.md`: Conventional Commits.

Invariantes de Node:

- Só pnpm; nada de `npm` ou `yarn`.
- Nada de `process.env` fora de `@nexo/shared/config`.
- Imports relativos terminam em `.js` (ESM), mesmo em arquivos `.ts`.

## Skills do projeto

As skills em `.claude/skills/` são procedimentais. Carregue a que se aplica antes de começar o trabalho:

- `testes`: ao escrever, revisar ou planejar testes, definir cobertura ou decidir "vale a pena testar isso?".
- `nestjs`: ao criar ou alterar controller, módulo, provider, filtro, config, logger ou `main.ts` no backend.
- `arquitetura-modular`: ao fazer um módulo chamar outro, definir interface, token ou evento, criar um domínio novo ou promover um módulo a app.
- `agent-llm`: ao mexer no agent, em prompts, tools, no cliente do modelo, em custo de tokens ou na transferência para o analista.
- `react`: antes de qualquer implementação, correção, refatoração ou revisão em `apps/web`.

## Fluxo de desenvolvimento (SDD)

Cada funcionalidade é desenvolvida em `tasks/prd-<slug>/`:

1. `/criar-prd` gera `prd.md` (lê `docs/` antes de perguntar).
2. `/criar-techspec` gera `techspec.md` (domínios, contratos, casos de teste).
3. `/criar-tasks` gera `tasks.md` e `task_N.md`.
4. `/executar-task` implementa a próxima tarefa.
5. `/executar-review` gera `codereview.md`.
6. `/executar-qa` gera `qa.md` e as evidências.

## Comandos (a partir da raiz)

```bash
pnpm install
pnpm dev                       # sobe monolith (3000) e web (5173)
pnpm build
pnpm typecheck
pnpm lint                      # oxlint
pnpm format                    # oxfmt
pnpm test
pnpm check:boundaries          # nenhum domínio pode depender de outro
pnpm --filter @nexo/<pacote> <script>
```

Copie `.env.example` para `.env` antes de rodar. Para validações isoladas por worktree use portas `30**` no backend e `51**` no frontend.

## Antes de concluir uma alteração

<critical>Siga a skill `testes`: escreva testes onde há risco real e um teste de regressão para cada bug. Rode `pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries` e os testes do que mudou.</critical>

- Preserve as fronteiras: um domínio nunca importa outro; use `@nexo/contracts`.
- Segredos só em variáveis de ambiente; o `requesterId` vem sempre da sessão.
- Cada funcionalidade adicionada termina em commit pequeno, no padrão de `git-commits.md`, sem esperar pedido. `push` só quando o usuário pedir.
