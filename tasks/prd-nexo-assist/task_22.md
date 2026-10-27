# Tarefa 22.0: `web`: chat em streaming (mensagens, composer, contador, erros)

## Visão geral

Implementa a tela de atendimento do funcionário com o turno em streaming: carregar a conversa atual, enviar mensagem e aplicar os eventos SSE do POST (aceite, passos, trechos de texto, partes e conclusão), com os estados de vazio, digitando, erro com "Tentar novamente" e limite de mensagens.

<skills>
### Conformidade com skills

- `react`: reducer do turno em `useSendMessage`; dados do servidor no cache do React Query, sem copiar para `useState`; `aria-live="polite"` anunciando só ao concluir o turno; `role="alert"` nos erros. Desvio documentado: `fetch` com `ReadableStream` e `eventsource-parser` no lugar do axios para o POST com stream.
- `testes`: MSW com respostas SSE.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `folder-structure.md`: `fetch` só em `modules/chat/api`; componentes não chamam a API diretamente.
- `code-standards.md`: componentes e hooks pequenos.
</rules>

<requirements>
- RF6: texto incremental.
- RF7: passos acima de cada resposta (`StepsLine` e `DecisionDetails` da tarefa 21).
- RF13: contador "N/30 mensagens nesta sessão" a partir de `usage`; em 30/30, campo desabilitado com explicação e botão "Falar com um analista".
- RF14: histórico e estado ao voltar.
- RF17: carregamento, digitando, erro com "Tentar novamente" (`turns/retry`) e conversa vazia com sugestões.
- Chat utilizável a partir de 375 px.
</requirements>

## Subtarefas

- [ ] 22.1 `api/`: `getCurrentConversation`, `streamMessage`, `retryTurn` e `requestHandoff`.
- [ ] 22.2 `hooks/`: `useConversation` e `useSendMessage`.
- [ ] 22.3 `components/`: `MessageList`, `EmployeeMessage`, `AgentMessage`, `TypingIndicator`, `TurnError`, `EmptyConversation`, `MessageComposer` e `MessageCounter`.
- [ ] 22.4 `pages/ChatPage` na rota `/atendimento`.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", item `modules/chat` do frontend.
- TechSpec, "ChatStreamEvent", "EmployeeConversationView" e "`POST /api/conversations/current/messages`".
- Protótipo `docs/nexo/nexo.pen`: Telas 2 e 3.

## Critérios de aceitação relacionados

- CA-23
- CA-25
- CA-37

## Testes da tarefa

### Testes de integração

- [ ] TI-20 — mostra o texto do agent chegando aos poucos, os passos e o erro com tentar de novo.
- [ ] TI-25 — desabilita o campo em 30/30 com opção de falar com analista.

## Arquivos relevantes

- `apps/web/src/modules/chat/{api,hooks,components,pages}/**`
- `apps/web/package.json` (`eventsource-parser`)
