# Tarefa 23.0: `web`: cards interativos do chat e estado transferido

## Visão geral

Completa o chat com os componentes ricos que evitam digitação (opções rápidas, seleção de chamado, rascunho com Confirmar/Editar/Cancelar, complemento e reabertura) e com o estado de conversa transferida: faixa de estado, mensagens do analista, eventos de sistema e atualizações em tempo real pelo SSE do funcionário.

<skills>
### Conformidade com skills

- `react`: atalhos de teclado num hook (`useQuickReplyKeys`); SSE em `useEffect` atualizando o cache do React Query e invalidando ao reconectar; formulário de edição acessível; anúncio das mudanças de estado a leitores de tela.
- `testes`: MSW com handlers HTTP e `sse`.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: a confirmação passa sempre pela rota `confirm`; o frontend não cria chamado sozinho.
- `folder-structure.md`: `EventSource` só em `modules/chat/api`.
</rules>

<requirements>
- RF8: opções rápidas por clique, por número no teclado ou por texto, com `quickReply`.
- RF9: seleção de chamado vira mensagem do funcionário com `ticketSelection`.
- RF11: rascunho com número, "Aguardando confirmação", campos, prioridade com horário-limite e afetados; Confirmar por clique e por Ctrl/⌘+Enter; Editar e Cancelar.
- RF12: edição de título, descrição, categoria e afetados no card, com prioridade recalculada.
- RF15: faixa "Aguardando atendente"/"com um analista"; mensagens do analista com nome e nível.
- RF16: após encerrada, o histórico continua visível e a próxima mensagem inicia nova conversa.
- Cards de complemento e de reabertura com as mesmas ações de confirmação.
</requirements>

## Subtarefas

- [ ] 23.1 `QuickOptions` e `useQuickReplyKeys`.
- [ ] 23.2 `TicketSelection` (usa `TicketCard` da tarefa 21 após a escolha).
- [ ] 23.3 `api/` de ações pendentes, `usePendingAction`, `DraftCard`, `DraftEditForm`, `ComplementCard` e `ReopenCard`.
- [ ] 23.4 `subscribeConversation`, `useConversationEvents`, `ConversationStateBanner`, `AnalystMessage` e `SystemEvent`.

## Detalhes de implementação

- TechSpec, "Arquitetura do sistema", item `modules/chat` do frontend.
- TechSpec, "ChatMessage" (`MessagePart`), "PendingAction" e "ConversationStreamEvent".
- TechSpec, rotas de ações pendentes e "`GET /api/conversations/current/events`".
- Protótipo `docs/nexo/nexo.pen`: Telas 2 e 3.

## Critérios de aceitação relacionados

- CA-06
- CA-07
- CA-10
- CA-12
- CA-13
- CA-14
- CA-17
- CA-20

## Testes da tarefa

### Testes de integração

- [ ] TI-21 — confirma o rascunho por clique e por Ctrl/⌘+Enter, cancela e edita.
- [ ] TI-22 — responde opções rápidas por clique e pela tecla numérica.
- [ ] TI-23 — escolhe um chamado da lista e mostra o card com prazo vencido.
- [ ] TI-26 — mostra a conversa transferida e as mensagens do analista com nome e nível.

## Arquivos relevantes

- `apps/web/src/modules/chat/{api,hooks,components}/**`
