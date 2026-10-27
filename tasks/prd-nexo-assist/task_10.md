# Tarefa 10.0: Domínio `knowledge`: artigos, busca em português e seed

## Visão geral

Implementa a central de ajuda: a tabela de artigos com busca textual em português, a seed com 8 artigos e a `KnowledgeApi` consumida pelo `agent`. Não tem rotas HTTP.

<skills>
### Conformidade com skills

- `nestjs`: módulo `@Global()` exportando `KNOWLEDGE_API`, migrations e seed no ciclo de vida.
- `arquitetura-modular`: `index.ts` exporta só o módulo.
- `testes`: integração com PGlite para a busca.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: o texto dos artigos é dado, não instrução (inclua na seed um artigo que não traga instruções ao modelo, e nenhum com dado pessoal).
- `modular-architecture.md`: schema `knowledge` próprio.
</rules>

<requirements>
- RF19: busca de artigos com as condições de aplicação (`conditions`).
- RF40: 8 artigos, incluindo "VPN com erro 809" (só Windows 10) e "Horário do service desk".
- `KnowledgeApi.search({ query, limit })` com trechos de até 600 caracteres e `get({ articleId })`.
- Busca com `to_tsvector('portuguese', …)` e `websearch_to_tsquery`, sem `unaccent`, normalizando acentos na aplicação.
</requirements>

## Subtarefas

- [ ] 10.1 Schema `knowledge.articles` com `search_vector` gerada e índice GIN, com a migration.
- [ ] 10.2 Seed dos 8 artigos.
- [ ] 10.3 `SearchArticles` e `KnowledgeService`.
- [ ] 10.4 `KnowledgeModule` `@Global()` com o token `KNOWLEDGE_API`.

## Detalhes de implementação

- TechSpec, "Domínio `knowledge`".
- TechSpec, "ArticleExcerpt".
- TechSpec, "Esquema do banco", linha `knowledge.articles`.
- TechSpec, "Riscos conhecidos", item sobre PGlite e busca em português.

## Critérios de aceitação relacionados

- CA-04

## Testes da tarefa

### Testes de integração

- [ ] TI-18 — encontra o artigo de horário pela busca em português.
- [ ] "VPN erro 809" devolve `vpn-erro-809` com `conditions` preenchido.

## Arquivos relevantes

- `packages/knowledge/src/{core,persistence}/**`
- `packages/knowledge/drizzle/**` (novo)
- `packages/knowledge/src/knowledge.module.ts`, `index.ts`
