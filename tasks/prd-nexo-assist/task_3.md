# Tarefa 3.0: `shared/http` e `shared/resilience`: códigos de erro, SSE e novas tentativas

## Visão geral

Completa a infraestrutura HTTP com os códigos de erro da API, o filtro que os respeita e o `SseResponse` para o POST com stream. Cria o `withResilience`, usado por quem consome o sistema de chamados legado.

<skills>
### Conformidade com skills

- `nestjs`: `APP_FILTER`, `ZodValidationPipe`, timeouts e tentativas em chamadas externas. Desvio documentado: o POST com stream escreve na `Response` do Express, encapsulado em `SseResponse`.
- `testes`: timers falsos do Vitest para o `withResilience`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: mensagens de erro ao cliente sem stack, caminhos nem detalhes do provedor.
- `javascript-typescript.md`: erros como instâncias de `Error` com `cause`; `catch (error: unknown)`.
- `code-standards.md`: constantes nomeadas para tentativas, timeout e espera.
</rules>

<requirements>
- Códigos de `ApiError` da TechSpec ("ApiError — envelope de erro") em `@nexo/contracts`.
- `ApiExceptionFilter` respeita o `code` de `ApiHttpException`, inclusive 503 com código próprio; 5xx não tratado vira `internal_error` genérico.
- `ZodValidationPipe` devolve `validation_error`.
- `SseResponse`: cabeçalhos, `event:`/`data:`, heartbeat de 25 s e fechamento quando o cliente desconecta.
- `withResilience(operation, policy)`: timeout por tentativa, tentativas limitadas, espera exponencial e `onAttemptFailed` (RF29, RF39).
</requirements>

## Subtarefas

- [ ] 3.1 Adicionar os códigos de erro em `packages/contracts/src/api-error.ts`.
- [ ] 3.2 Ajustar `ApiExceptionFilter` e `ZodValidationPipe`.
- [ ] 3.3 Implementar `SseResponse` em `shared/http`.
- [ ] 3.4 Implementar `withResilience` no subpath `@nexo/shared/resilience`, com o `package.json` atualizado.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", itens `resilience` e `http` de `packages/shared`.
- TechSpec, "ApiError — envelope de erro".
- TechSpec, "Pontos de integração", sistema de chamados legado (3 tentativas, 2 s, 300 ms e 900 ms são parâmetros da política, definidos por quem chama).

## Critérios de aceitação relacionados

- CA-28

## Testes da tarefa

### Testes de unidade

- [ ] TU-29 — tenta de novo com espera e desiste após o limite.
- [ ] `ApiExceptionFilter` devolve o `code` e o status de `ApiHttpException` e esconde detalhes de erros não tratados.
- [ ] `SseResponse` formata eventos e encerra ao desconectar.

## Arquivos relevantes

- `packages/contracts/src/api-error.ts`
- `packages/shared/src/http/api-exception.filter.ts`, `zod-validation.pipe.ts`, `sse-response.ts` (novo), `index.ts`
- `packages/shared/src/resilience/**` (novo)
- `packages/shared/package.json`
