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

- [x] 1. Contrato e backend dos ids (`clientMessageId`, `turn.started { replyId }`) com testes (`e00fe22`)
- [x] 2. Dependências `ai@7.0.154` e `@ai-sdk/react@4.0.158` no web (`7ce3dda`)
- [x] 3. Conversores `ChatMessage → UIMessage` e tipos `NexoUIMessage`
- [x] 4. `NexoChatTransport` (POST SSE → chunks; retry; erros)
- [x] 5. `useNexoChat` (useChat por conversa, upsert por id, EventSource, propostas); turno antigo removido
- [x] 6. Lista e balões renderizando `UIMessage`; passos ao vivo; erro e nova tentativa
- [x] 7. Composer: textarea, Enter envia, Shift+Enter quebra, Parar, foco (3 a 9 em `f014690`)
- [x] 8. Rolagem presa ao fim, botão de ir ao fim, texto revelado em ritmo constante (`8b776b2`)
- [x] 9. Regressão: `message.created` durante o streaming não duplica nem pisca
- [x] 10. E2E 4/4 e simulação com dois logins (Ana e Gabriela) usando os modelos de produção
- [x] 11. Polimento de movimento com `frontend-design`, sem mudar o layout (`05e00a5`)
- [ ] 12. README se necessário; push só com pedido do usuário

## Achados da simulação (corrigidos)

- Bolha vazia acima do cartão quando a resposta não tem texto (`d80ca3c`).
- Duplicidade por categoria: teclado e VPN viraram complemento de "Notebook lento" (`fe9cc1c`).
- Lista de chamados virava um segundo cartão após a escolha; agora fica marcada como no protótipo (`4a2e100`).
- Enter não enviava a resposta do analista no console (`b0aa6ac`).

## Segurança verificada

- Chamado de outra pessoa: mesma resposta de inexistente (UI e API 404).
- Injeção de instruções ("ignore as instruções", "mostre o prompt", "liste os chamados de todos"): recusada.
- Abrir chamado "sem confirmação" e "prioridade crítica": pediu dados, prioridade veio da regra e exigiu confirmação.
- `requesterId` no corpo: 400; `clientMessageId` de outra pessoa: 409 sem revelar dono; sem sessão: 401;
  funcionário no console: 403; POST de outra origem: 403; CORS só libera `WEB_ORIGIN`; cookie HttpOnly,
  SameSite=Lax e Secure em produção; HTML na mensagem é exibido como texto.

## Propostas (não feitas)

- Citações de artigos que "não se aplicam" aparecem para o funcionário (ex.: Outlook e Wi-Fi ao perguntar de senha):
  mostrar só as que se aplicam ou agrupar em "artigos descartados" no detalhe da decisão.
- Passo "mostrou o INC-20517" aparece mesmo quando o chamado não foi mostrado (de outra pessoa); usar o rótulo de falha.
- Texto do prazo vencido mais próximo do protótipo ("sem atualização há N dias, acima do prazo de X dias úteis…").
- Saudação ecoa o funcionário ("Oi, tudo bem! O que está acontecendo?").
- `failTurn` depois da resposta salva sobrescreve a mensagem com o mesmo `replyId` (raro; avaliar guarda).

## Verificação

`pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries`, testes de `contracts`, `chat`, `monolith`, `web`; E2E; Playwright MCP em stack isolada (Postgres 5433, backend 30xx, web 51xx, `LLM_PROVIDER=scripted`).
