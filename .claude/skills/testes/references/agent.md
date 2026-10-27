# Testes do agent e evals

O agent mistura código determinístico (orquestração, validação, regras) com comportamento do modelo (qual tool escolher, como redigir). Cada parte pede um tipo de teste diferente, e misturá-las deixa a suíte lenta, cara e instável.

## Testes determinísticos (todo commit, sem modelo real)

O modelo é uma porta (`LlmClient`) no `core` do domínio `agent`. Nos testes, use um fake roteirizado:

```ts
const llm = new ScriptedLlm([
  toolCall('search_tickets', { query: 'vpn' }),
  text('Encontrei o chamado INC-20311. Quer atualizá-lo?'),
]);
```

Verifique a orquestração, que é o que o código controla:

- A tool certa foi chamada, com argumentos que passam no schema.
- Nenhuma escrita (criar ou atualizar chamado) acontece sem confirmação registrada no estado da conversa.
- O `requesterId` vem da sessão, não de argumento escolhido pelo modelo.
- O limite de passos e o orçamento de tokens encerram o laço.
- A transferência pausa o agent e leva o resumo do caso.
- Falha de tool ou do sistema legado vira resposta tratada, não exceção.
- O fake falha o teste se o agent fizer uma chamada ao modelo que o roteiro não previu. Isso pega laço acidental, que no mundo real vira custo.

Um fake só devolve o que o autor escreveu. Ele não diz nada sobre a qualidade do modelo; para isso existem os evals.

## Evals (sob demanda, modelo real)

Conjunto pequeno de conversas de referência em `packages/agent/evals/`, por exemplo: pedido ambíguo, fora de escopo (RH), caso crítico, chamado duplicado, tentativa de ver chamado alheio, VPN erro 809 em Windows 10 versus 11.

- Pontue por critérios (tool correta, pergunta de esclarecimento, tom, ausência de dado de terceiro), não por texto exato.
- Rode com `pnpm --filter @nexo/agent eval`, fora do CI padrão, com número de execuções e custo controlados.
- Use evals para escolher modelo e prompt e detectar regressão de qualidade. Regra de negócio fica no código e nos testes determinísticos, nunca só em eval.
