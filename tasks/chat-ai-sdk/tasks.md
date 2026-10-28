# Chat do funcionário com AI SDK, sem piscar e mais fluido

Plano aprovado em 2026-10-27. Fora do fluxo SDD completo: este arquivo é a fonte do que falta.

## Problema

A mensagem enviada aparece, pisca e volta (às vezes duplica). O mesmo texto chega por dois canais sem id em comum:

- `employee-message-store.ts` publica `message.created` no SSE de eventos antes de o POST escrever `message.accepted`; o web mostra a cópia da timeline e o `pendingText` (sem id) ao mesmo tempo.
- `turn-completion.ts` publica `message.created` da resposta do agent antes do `turn.completed`.

## Decisões

- Web usa `ai` + `@ai-sdk/react` (`useChat`) com `ChatTransport` próprio que converte o SSE atual (`ChatStreamEvent`) em `UIMessageChunk`. Backend, agent e evals mantêm o protocolo.
- `useChat` é o dono das mensagens da tela; React Query fica com conversa, uso e `turnInProgress`. Eventos do `EventSource` e confirmação de proposta fazem upsert por id.
- Ids de ponta a ponta: `clientMessageId` (opcional) no envio vira o id da mensagem do funcionário; `message.accepted` traz `replyId`, id da mensagem que o agent vai gravar (resposta, falha ou transferência).
- Visual do protótipo mantido; só comportamento de fluidez (rolagem presa ao fim, texto suave, passos ao vivo, animação curta com `motion-safe`).
- Console do analista fora do escopo.

## Mapeamento evento → chunk

| Evento | Chunk |
|---|---|
| `message.accepted` | `start {messageId: replyId}` + `data-accepted` transitório |
| `turn.step` | `data-step` com `id = step.id` |
| `turn.text-delta` | `text-start` (1ª vez) + `text-delta` |
| `turn.part` | `data-part` com id estável |
| `turn.completed` | `text-end`, `message-metadata`, `finish` |
| `turn.skipped` | `finish` sem conteúdo; mensagem vazia removida |
| `turn.failed` | `error`; "Tentar novamente" = `regenerate()` → `POST /turns/retry` |
| erro antes de aceitar | `ApiError`; remove a otimista e devolve o texto ao composer |

## Tarefas

- [ ] 1. Contrato e backend dos ids (`clientMessageId`, `replyId`) com testes
- [ ] 2. Dependências `ai` e `@ai-sdk/react` no web
- [ ] 3. Conversores `ChatMessage → UIMessage` e tipos `NexoUIMessage`
- [ ] 4. `NexoChatTransport` (POST SSE → chunks; retry; erros)
- [ ] 5. Hook `useNexoChat` (useChat por conversa, upsert, EventSource, propostas); remover o turno antigo
- [ ] 6. Lista e balões renderizando `UIMessage`; passos ao vivo; erro e nova tentativa
- [ ] 7. Composer: textarea, Enter envia, Shift+Enter quebra, Parar, foco
- [ ] 8. Rolagem presa ao fim, botão de ir ao fim, animação de entrada
- [ ] 9. Regressão: `message.created` durante o streaming não duplica nem pisca
- [ ] 10. E2E e simulação com Playwright (stack isolada, modelo falso)
- [ ] 11. Polimento visual com a skill `frontend-design` (pedido do usuário): layout de todas as telas (chat, console, perfil, login) e animações, sem sair do padrão do protótipo; `motion-safe`, foco visível, 375 px
- [ ] 12. README se necessário; commits pequenos; sem push

## Verificação

`pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries`, testes de `contracts`, `chat`, `monolith`, `web`; E2E; Playwright MCP em stack isolada (Postgres 5433, backend 30xx, web 51xx, `LLM_PROVIDER=scripted`).
