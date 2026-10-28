# Tarefa 27.0: Deploy e README

## Visão geral

Publica a aplicação como serviço único (o monólito serve o build do `web`) com Postgres gerenciado e escreve o README final, que cabe em 4 comandos para rodar localmente e documenta a arquitetura, as decisões do agent, a qualidade medida, o custo e o deploy.

<skills>
### Conformidade com skills

- `nestjs`: `@nestjs/serve-static` com `SERVE_WEB_DIR`, health check usado pela plataforma.
- `agent-llm`: teto de custo e limite de uso no ambiente publicado; escolha do modelo justificada.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: segredos nas variáveis da plataforma; cookie `Secure`; `LLM_PROVIDER=scripted` e `LOG_LEVEL=debug` proibidos em produção.
- `git-commits.md`: sem `.env` nem artefatos de build no Git.
- O deploy é uma ação externa: confirmar com o usuário antes de publicar.
</rules>

<requirements>
- RF53: README com 4 comandos (`cp .env.example .env`, `docker compose up -d`, `pnpm install`, `pnpm dev`).
- RF55: README com como rodar, arquitetura, como o agent decide, qualidade (testes e evals com resultados), trade-offs, escolha do modelo e do OpenRouter, custo por conversa medido e o que faria com mais tempo.
- RF56: deploy com chaves protegidas, rate limit, 30 mensagens por sessão e teto diário de custo, explicado no README.
- RF57: histórico de commits coerente.
</requirements>

## Subtarefas

- [x] 27.1 `serve-static` no `monolith.module.ts` quando `SERVE_WEB_DIR` está definido.
- [x] 27.2 `Dockerfile` multi-stage (`pnpm build` e imagem final só com o necessário).
- [x] 27.3 Publicar no Render (Postgres, variáveis, health check): https://nexo-assist.onrender.com
- [ ] 27.4 Verificar no ambiente publicado o limite de uso e a mensagem de limite atingido.
- [x] 27.5 Escrever o `README.md` com os resultados dos testes, dos evals (tarefa 26) e o custo medido.

> Pendente: 27.4 (verificar o limite de uso no ambiente publicado). O README já traz os passos do deploy como instruções e os resultados dos evals e o custo medido.

## Detalhes de implementação

- TechSpec, "Pontos de integração", Deploy.
- TechSpec, "Dependências técnicas", os 4 comandos.
- TechSpec, "Principais decisões" e "Riscos conhecidos", como base das seções de trade-offs do README.

## Critérios de aceitação relacionados

- CA-38
- CA-39
- CA-40

## Testes da tarefa

### Testes E2E

- [ ] Verificação manual no ambiente publicado: login, uma conversa completa e limite de uso atingido sem chamada ao modelo.
- [ ] Clone limpo seguindo só o README sobe a aplicação com os dados de exemplo.

## Arquivos relevantes

- `apps/monolith/src/monolith.module.ts`
- `Dockerfile`, `.dockerignore` (novos)
- `README.md` (novo)
