# Tarefa 25.0: Composição final do monólito e testes E2E

## Visão geral

Fecha a composição do backend (todos os módulos registrados, `db:reset`, persistência após reinício) e valida os três fluxos críticos de ponta a ponta no navegador, com o modelo falso roteirizado por cenário.

<skills>
### Conformidade com skills

- `testes`: Playwright em `e2e/`, só os 3 fluxos críticos; modelo falso; banco recriado antes da suíte.
- `nestjs`: composição em `monolith.module.ts`, sem regra de negócio na app.
- `agent-llm`: roteiros do `ScriptedLlmClient` por cenário.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `modular-architecture.md`: `apps/monolith` só compõe módulos.
- CLAUDE.md: validações em worktree com portas `30**` no backend e `51**` no frontend.
- `security-privacy.md`: E2E-02 verifica que nenhum dado de terceiro aparece.
</rules>

<requirements>
- RF52: estado completo após reinício.
- RF53: `pnpm --filter @nexo/monolith db:reset` recria os schemas e roda as seeds.
- Roteiros em `packages/agent/src/persistence/scripted/scenarios.ts` para os cenários dos E2E.
- Fluxos E2E: abertura de chamado, privacidade e transferência com o console.
</requirements>

## Subtarefas

- [x] 25.1 Revisar `monolith.module.ts` com todos os módulos de domínio e o script `db:reset`.
- [x] 25.2 Teste de reinício sobre o mesmo PGlite (TI-14).
- [x] 25.3 `e2e/playwright.config.ts` subindo o monólito com `LLM_PROVIDER=scripted` e o `web`.
- [x] 25.4 Roteiros dos cenários e os três specs.

## Detalhes de implementação

- TechSpec, "Abordagem de testes", "Testes E2E" e TI-14.
- TechSpec, "Esquema do banco", parágrafo sobre `db:reset`.

## Critérios de aceitação relacionados

- CA-01
- CA-05
- CA-08
- CA-10
- CA-11
- CA-12
- CA-17
- CA-21
- CA-27
- CA-29
- CA-30
- CA-36
- CA-38

## Testes da tarefa

### Testes de integração

- [x] TI-14 — mantém histórico, cards, rascunho pendente e estado após reiniciar a aplicação.

### Testes E2E

- [x] E2E-01 — funcionário entra, relata VPN com erro 809, responde as perguntas e confirma o rascunho.
- [x] E2E-02 — funcionário pede chamado de outra pessoa e recebe a mesma resposta de inexistente.
- [x] E2E-03 — funcionário pede analista, analista assume, responde, devolve e o agent volta a responder.

## Arquivos relevantes

- `apps/monolith/src/monolith.module.ts`, `apps/monolith/package.json`
- `packages/agent/src/persistence/scripted/scenarios.ts`
- `e2e/{playwright.config.ts,*.spec.ts}` (novos)
