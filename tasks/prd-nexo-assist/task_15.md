# Tarefa 15.0: `chat/core`: estado da conversa, limite, matchers, opção rápida e ações pendentes

## Visão geral

Implementa as regras determinísticas do `chat`: a máquina de estados da conversa, o limite de 30 mensagens por sessão, o reconhecimento de confirmação e de cancelamento por texto, a conversão de dígito em opção rápida, o nível e o prazo de contato da transferência e o ciclo de vida das ações pendentes (propor, editar, confirmar, cancelar e substituir).

<skills>
### Conformidade com skills

- `agent-llm`: a confirmação é verificada pelo código, não pelo modelo.
- `testes`: repositórios em memória e fakes de `TicketsApi`; testes de tabela para os matchers.
- `arquitetura-modular`: o `chat` usa `TICKETS_API` só pelo contrato.
</skills>

<rules>
### Conformidade com o CLAUDE.md e as rules

Lidos o `CLAUDE.md` e todas as rules em `.claude/rules/`. Relevantes:

- `security-privacy.md`: escrita só após confirmação registrada no estado da conversa (`confirmedVia`); `requesterId` do dono da conversa.
- `code-standards.md`: 30 mensagens e frases fixas como constantes; objetos-parâmetro nos casos de uso.
</rules>

<requirements>
- RF8: dígito com opções abertas vira o rótulo da opção.
- RF12: edição recalcula prioridade e prazo por `assessPriority` e mantém `pending`.
- RF13: 30 mensagens por sessão; a 31ª é recusada com `message_limit_reached`.
- RF24: só ação `pending` pode ser confirmada; nova proposta marca a anterior `superseded`; `ConfirmPendingAction` chama `TicketsApi` com `idempotencyKey` igual ao id da ação e `withResilience`; em indisponibilidade, a ação continua `pending`.
- RF41, RF43: N1 padrão; N2 para `critical` e `overdue`; contato em 2 horas úteis, ou 1 hora quando crítico.
- Transições `agent → waiting_analyst → with_analyst → agent | closed`; transição inválida lança `invalid_conversation_state`.
</requirements>

## Subtarefas

- [ ] 15.1 `Conversation` (máquina de estados) e as portas `ConversationRepository`, `MessageRepository`, `PendingActionRepository` e `SessionUsageRepository`, com fakes em memória.
- [ ] 15.2 `MessageAllowance`.
- [ ] 15.3 `ConfirmationMatcher`, `CancellationMatcher` e `QuickReplyResolver`.
- [ ] 15.4 `HandoffPolicy`.
- [ ] 15.5 `PendingActions`, `EditPendingAction`, `ConfirmPendingAction` e o cancelamento.

## Detalhes de implementação

- TechSpec, "Domínio `chat`", itens do `core`.
- TechSpec, "PendingAction" e a nota de substituição.
- TechSpec, "Conversation e HandoffInfo".
- TechSpec, "Casos de uso do `chat` usados pelo HTTP".

## Critérios de aceitação relacionados

- CA-09
- CA-10
- CA-12
- CA-13
- CA-14
- CA-17
- CA-18
- CA-25
- CA-29
- CA-30
- CA-31

## Testes da tarefa

### Testes de unidade

- [ ] TU-09 — reconhece frases afirmativas como confirmação e recusa respostas ambíguas.
- [ ] TU-10 — só confirma uma ação pendente e substitui a anterior ao propor outra.
- [ ] TU-11 — recalcula prioridade e prazo ao editar afetados ou categoria do rascunho.
- [ ] TU-12 — aplica as transições de estado da conversa.
- [ ] TU-14 — aceita a 30ª mensagem da sessão e recusa a 31ª.
- [ ] TU-15 — define nível e prazo de contato da transferência pelo motivo.
- [ ] TU-26 — converte dígito em opção rápida quando há opções abertas.

## Arquivos relevantes

- `packages/chat/src/core/**` (novo)
