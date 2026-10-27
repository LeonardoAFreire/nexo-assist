# Evals do agent

Os evals medem a qualidade do modelo real e custam dinheiro e tempo. Detalhes e justificativas estão na skill `testes` (`references/agent.md`) e na skill `agent-llm`.

## Execução e custo

- Evals nunca rodam em `pnpm test` nem no CI. O comando é `pnpm --filter @nexo/agent eval`, e a tarefa `eval` do Turborepo fica sem cache.
- Para iterar, rode só os cenários afetados (`--scenario`) com `--runs 1`. A rodada completa serve para decidir o modelo ou para registrar o resultado no README, no máximo uma por decisão.
- A chave vem só do `.env`. Não imprima, registre nem commite a chave. Resultados ficam em `packages/agent/evals/results/` (ignorado pelo Git), sem texto de mensagens nem de chamados.
- Antes de uma rodada completa, confira o teto da chave no OpenRouter (`GET /api/v1/key`) e estime o custo (turnos × custo por turno).

## Cenários e critérios

- Pontue pelo resultado e pelo estado, não pelo caminho: não exija uma sequência fixa de tools nem texto exato. Cada critério tem nome, descrição e vale pass ou fail.
- Todo cenário tem um roteiro de ensaio (`rehearsal`) que passa em todos os critérios. Isso garante que o gabarito é satisfazível.
- Padrões de texto aceitam acentos, caixa e sinônimos. Critério de texto é o último recurso; prefira verificar tool, passo, proposta e transferência.
- Mantenha casos positivos e negativos (buscar e não buscar na central, transferir e não transferir, abrir e não duplicar).
- Cenário que falha em todos os modelos aponta primeiro para o cenário, a tool ou a busca, e só depois para o prompt. Leia o que o modelo respondeu e quais tools chamou antes de mexer em qualquer coisa.

## Metas

- Confirmação antes de escrever, privacidade, escopo e transparência valem 100% em todas as execuções (`pass^k`), não em média.
- Resolução e chamados bem abertos usam meta de taxa (90%) sobre as execuções.
- Regra do service desk (prioridade, prazo, deduplicação, escopo) fica no código e nos testes determinísticos. Eval não substitui teste, e prompt não substitui código.

## Modelos

- Registre o preço de todo modelo candidato em `model-prices.ts` antes de medir custo.
- Confira no catálogo se o raciocínio é obrigatório (`reasoning.mandatory`). Quando não for, envie `reasoning.enabled=false`; modelos de raciocínio consomem `max_tokens` pensando e devolvem conteúdo vazio.
- Meça a latência do primeiro trecho (p50 e p95), o custo por turno e a taxa de aprovação. Escolha o modelo por esses três, e registre a escolha e o motivo no README.
