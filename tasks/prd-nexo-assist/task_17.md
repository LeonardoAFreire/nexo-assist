# Tarefa 17.0: `chat/persistence`: schema, repositórios e seed do console

## Visão geral

Implementa as portas do `core` do `chat` com Drizzle sobre o schema `chat`, valida os `jsonb` com os schemas de `@nexo/contracts` na leitura e carrega 4 conversas de exemplo para o console não começar vazio.

<skills>
### Conformidade com skills

- `nestjs`: migrations em `onModuleInit`, seed em `onApplicationBootstrap`, módulo `@Global()`.
- `arquitetura-modular`: schema `chat` próprio; referências a outros domínios só como valor (`employee_id`, `ticketNumber`).
- `testes`: integração dos repositórios com PGlite.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: dados externos (`jsonb`) tratados como `unknown` e validados com zod.
- `modular-architecture.md`: sem FK para outros schemas.
</rules>

<requirements>
- RF52: conversas, mensagens, passos e decisões, ações pendentes e estado sobrevivem a um reinício.
- Índice parcial único de conversa ativa por funcionário e de ação `pending` por conversa.
- Trava de turno (`turn_lock_until`) e assumir condicional (`WHERE state = 'waiting_analyst'`) no banco.
- Seed com 4 conversas (agent atendendo, resolvida pelo agent, encerrada, agent pediu ajuda).
</requirements>

## Subtarefas

- [ ] 17.1 Schemas Drizzle `chat.conversations`, `messages`, `pending_actions` e `session_usage`, com as migrations.
- [ ] 17.2 Repositórios Drizzle das quatro portas, com `parse` dos `jsonb`.
- [ ] 17.3 Seed das conversas do console.
- [ ] 17.4 `ChatModule` com os providers do `core` e dos repositórios.

## Detalhes de implementação

- TechSpec, "Esquema do banco", linhas `chat.*`, e o parágrafo sobre validação de `jsonb`.
- TechSpec, "Dados de exemplo (RF40)", linha "Conversas do console".

## Critérios de aceitação relacionados

- CA-21
- CA-32

## Testes da tarefa

### Testes de integração

- [ ] Repositórios no PGlite: assumir condicional só funciona uma vez; segunda ação `pending` na mesma conversa é recusada; `jsonb` corrompido falha de forma explícita na leitura.

## Arquivos relevantes

- `packages/chat/src/persistence/**`
- `packages/chat/drizzle/**` (novo)
- `packages/chat/src/chat.module.ts`, `package.json`
