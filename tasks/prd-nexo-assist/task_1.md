# Tarefa 1.0: Ambiente local, configuração e base de testes

## Visão geral

Prepara o que todos os domínios usam: o Postgres local, as variáveis de ambiente validadas no boot, a configuração do Vitest nos pacotes Nest e a rule de estrutura de pastas com os subpaths novos. Não tem regra de negócio.

<skills>
### Conformidade com skills

- `nestjs`: `@nexo/shared/config`, `AppConfig` e validação do ambiente.
- `testes`: `unplugin-swc` nos pacotes Nest e cobertura de 80% restrita a `core/`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: segredos só no `.env`; schema zod que falha rápido; `LOG_LEVEL=debug` recusado em produção.
- `code-standards.md` e `javascript-typescript.md`: nada de `process.env` fora de `@nexo/shared/config`.
- `folder-structure.md`: esta tarefa atualiza a própria rule.
</rules>

<requirements>
- RF53: roda localmente com `.env.example` e poucos comandos.
- RF56: variáveis de teto de custo e de limite de uso disponíveis para as tarefas seguintes.
- `LLM_PROVIDER=scripted` proibido quando `NODE_ENV=production`; `OPENROUTER_API_KEY` obrigatória quando `LLM_PROVIDER=openrouter`.
</requirements>

## Subtarefas

- [ ] 1.1 Criar `docker-compose.yml` com `postgres:17` e volume nomeado.
- [ ] 1.2 Atualizar `.env.example` com todas as variáveis da tabela "Parâmetros fixos" da TechSpec, com valores fictícios.
- [ ] 1.3 Estender `env.schema.ts` com as variáveis novas, `DATABASE_URL` para Postgres e as validações condicionais (`scripted`, chave do OpenRouter, `debug` em produção).
- [ ] 1.4 Configurar `vitest.config.ts` dos pacotes Nest com `unplugin-swc` e cobertura de `src/core/**`.
- [ ] 1.5 Atualizar `.claude/rules/folder-structure.md` com os subpaths de `shared` (`auth`, `resilience`, `database/testing`), `drizzle/` por domínio e `packages/agent/evals/`.

## Detalhes de implementação

- TechSpec, "Parâmetros fixos (`.env.example`)" e "Dependências técnicas".
- TechSpec, "Monitoramento e observabilidade", sobre `LOG_LEVEL=debug`.
- TechSpec, "Abordagem de testes", sobre cobertura e `unplugin-swc`.

## Critérios de aceitação relacionados

- CA-38

## Testes da tarefa

### Testes de unidade

- [ ] Estender `env.schema.test.ts`: falta de `OPENROUTER_API_KEY` com `openrouter`, `scripted` em produção, `debug` em produção e padrões aplicados.

## Arquivos relevantes

- `docker-compose.yml` (novo)
- `.env.example`
- `packages/shared/src/config/env.schema.ts` e `env.schema.test.ts`
- `packages/{shared,identity,knowledge,tickets,chat,agent}/vitest.config.ts`, `apps/monolith/vitest.config.ts`
- `.claude/rules/folder-structure.md`
