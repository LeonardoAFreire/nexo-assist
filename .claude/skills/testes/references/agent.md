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

Conjunto pequeno de conversas de referência em `packages/agent/evals/`, por exemplo: pedido ambíguo, fora de escopo (RH), caso crítico, chamado duplicado, tentativa de ver chamado alheio, VPN erro 809 em Windows 10 versus 11. As regras operacionais curtas estão em `.claude/rules/evals.md`.

- Pontue por critérios (tool correta, pergunta de esclarecimento, tom, ausência de dado de terceiro), não por texto exato.
- Rode com `pnpm --filter @nexo/agent eval`, fora do CI padrão, com número de execuções e custo controlados.
- Use evals para escolher modelo e prompt e detectar regressão de qualidade. Regra de negócio fica no código e nos testes determinísticos, nunca só em eval.

### Graders

- **Código (padrão aqui):** rápido, barato e reproduzível. Verifique estado e eventos: tool executada, proposta criada, rascunho completo, transferência com motivo, ausência de dado de terceiro.
- **Modelo (LLM-as-judge):** só para qualidade subjetiva (tom, clareza) que o código não mede. Exige rubrica, uma saída "não sei" para evitar alucinação e calibragem com revisão humana. Hoje o projeto não usa.
- **Humano:** revisão por amostragem das transcrições onde o resultado é ambíguo.
- **Crédito parcial:** cada critério vale pass ou fail por nome, e o relatório mostra quais falharam. Um agent que acha o chamado mas não propõe o complemento está melhor que um que erra a intenção.

### Evite graders rígidos

- Não exija uma sequência fixa de tools nem o texto exato. Avalie o resultado.
- Um grader mal calibrado derruba a nota por motivo errado (num caso público, um modelo foi de 42% para 95% só corrigindo o grader). Leia o gabarito antes de culpar o modelo.
- Torne o critério resistente a atalho: passar exige resolver o caso, não citar a palavra certa.

### Não determinismo

- Temperatura zero não torna o agent repetível. Rode várias execuções por cenário (`--runs`).
- `pass@k` (ao menos uma execução passa) mede capacidade; `pass^k` (todas passam) mede consistência. Para confirmação, privacidade, escopo e transparência vale `pass^k` = 100%. Exemplo: 75% por execução em 3 execuções dá cerca de 42% de `pass^3`.
- Execuções repetidas devem começar de estado limpo (banco, relógio, fixtures) para não herdarem estado da anterior.

### Montagem do conjunto

- Comece com poucos cenários tirados de falhas reais ou de requisitos do PRD (20 a 50 bastam para começar) e cresça com cada bug de qualidade que aparecer.
- Se dois revisores discordariam do veredito de um cenário, ele está mal escrito. Cada cenário tem um roteiro de ensaio que passa em todos os critérios.
- Cenário com 0% em todas as execuções e em todos os modelos geralmente é problema do cenário, da tool ou da busca, não do agent.
- Balanceie casos que exigem o comportamento e casos que o proíbem (buscar e não buscar na central, transferir e não transferir).

### Capacidade e regressão

- Cenários de capacidade começam abaixo da meta e orientam melhorias (resolução, chamados bem abertos: meta de 90%).
- Cenários de regressão ficam perto de 100% e protegem o que já funciona (confirmação, privacidade, escopo). Quando um de capacidade estabiliza, ele passa a ser de regressão.
- Um eval em 100% não mostra progresso; acrescente cenários mais difíceis quando saturar.

### Como iterar sem gastar à toa

1. Leia as transcrições (rode 1 execução do cenário e inspecione resposta, tools e argumentos). O JSON de resultado não guarda texto, então instrumente localmente sem commitar.
2. Descubra a causa raiz: gabarito, descrição da tool, busca, prompt ou bug no código. Corrija na camada certa.
3. Reavalie só os cenários afetados (`--scenario`, `--runs 1`).
4. Faça uma única rodada completa no final, com o modelo escolhido, e salve o resultado para o README.

### Fontes

- [Demystifying evals for AI agents (Anthropic)](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [AI Agent Evaluation (Mastra)](https://mastra.ai/articles/ai-agent-evaluation)
- [How to handle non-determinism in agent evaluation (Label Studio)](https://labelstud.io/learning-center/how-to-handle-non-determinism-in-agent-evaluation/)
