---
name: agent-llm
description: Padrões para implementar e revisar o agent de atendimento do Nexo Assist (packages/agent) e qualquer uso do modelo de linguagem. Cobre a porta LlmClient, o laço limitado de passos, tools com schema zod, onde ficam as regras do service desk, custo e latência (janela de contexto, escolha de modelo e provedor, raciocínio dos modelos, prompt caching, orçamento de tokens, streaming), transparência dos passos e tratamento de falhas do modelo e do sistema legado. Use ao criar ou alterar o agent, prompts, tools, o cliente do provedor, o orçamento de tokens, a transferência para o analista, a explicação "o que o agent fez e por quê", ou ao decidir se uma regra vai no prompt ou no código.
---

# Agent e uso do modelo

O PRD pede respostas rápidas, uso consciente do modelo e atenção ao custo por conversa. Estes padrões valem para `packages/agent` e para qualquer código que chame o modelo. Segurança das tools e confirmação de escrita estão em `.claude/rules/security-privacy.md`; testes do agent (modelo falso, evals) estão na skill `testes`.

## Estrutura

- Defina o modelo atrás de uma porta, `LlmClient`, no `core` do domínio `agent`. A implementação do provedor fica em `persistence/`. Assim dá para trocar de provedor e testar com um fake determinístico, sem rede nem custo.
- Escreva o agent como laço limitado: no máximo N passos por mensagem, com N em constante nomeada. Ao estourar, responda de forma tratada ou transfira para um analista. Sem limite, um erro de raciocínio do modelo vira custo ilimitado.
- Cada tool é uma função com schema zod de entrada e saída, nome e descrição em um único arquivo. O schema valida o que o modelo manda (é entrada não confiável) e gera a descrição que o modelo vê, então os dois não divergem.
- Tools de escrita exigem confirmação registrada no estado da conversa e verificada no código.
- Acesse chamados e artigos pelas interfaces públicas `TicketsApi` e `KnowledgeApi` de `@nexo/contracts` (injeção por token, skill `arquitetura-modular`) e comunique a transferência por evento. O agent nunca importa os pacotes `tickets`, `knowledge` ou `chat`.
- Deixe as regras do service desk (prioridade, prazo, escopo, duplicidade, transferência) no código dos domínios, não no prompt. O prompt orienta a conversa; o código decide e valida. Regra só no prompt falha de forma silenciosa e não tem teste.

## Custo e latência

- Envie ao modelo só o necessário: janela limitada de mensagens, resumo do que ficou fora dela e os trechos relevantes dos artigos.
- Escolha o modelo por etapa: menor para classificação e roteamento, maior só onde a qualidade pede.
- Use prompt caching na parte estável do prompt (instruções e definições de tools) e coloque o conteúdo variável no final, porque o cache casa por prefixo.
- Defina orçamento de tokens por conversa e por mensagem. Ao atingir o limite, o agent informa e transfere em vez de continuar.
- Responda por streaming para reduzir a latência percebida.
- Registre por conversa: modelo, tokens de entrada e saída, passos, tools chamadas e duração, sem conteúdo sensível. É a base da explicação "o que o agent fez e por quê" e da análise de custo.

## Escolha de modelo e provedor

- Compare candidatos com os evals (`.claude/rules/evals.md`) por três números: taxa de aprovação, latência do primeiro trecho (p50 e p95) e custo por turno. Registre a escolha e o motivo no README.
- Modelos de raciocínio (DeepSeek V4, Qwen 3.x, Gemini 3.x) pensam consumindo `max_tokens` e podem devolver conteúdo vazio com `finish_reason: length`. Consulte `reasoning.mandatory` no catálogo do OpenRouter: se não for obrigatório, envie `reasoning.enabled=false` (já feito em `llm-client.factory.ts`); se for, evite o modelo para roteamento e respostas curtas.
- O catálogo padrão (`/api/v1/models`) esconde modelos que não geram texto, como os de decisão do Jev. Use `?output_modalities=all` para listá-los.
- Meça a latência por etapa. O roteador (`understand`) é uma chamada sequencial antes de qualquer tool, e modelos baratos geram cerca de 60 tokens por segundo, então cada 100 tokens de saída custam perto de 1,5 s. Mantenha a saída do roteador curta, use um modelo rápido nele (hoje `google/gemini-2.5-flash-lite`) e deixe o modelo maior só para a resposta.
- Preço dinâmico (`-1` no catálogo, como o `jev-router`) impede o controle de orçamento por token. Prefira modelos com preço fixo e registre o preço em `model-prices.ts`.
- Modelos de decisão estruturada (Jev) classificam em cerca de 0,4 s, mas devolvem opções com probabilidade, não texto. Servem para `intent` e `confidence`, não para o resumo e as entidades do `Understanding`.
- Troque de modelo por configuração (`LLM_MODEL`, `LLM_ROUTER_MODEL`), sem mudar código, e confirme a troca com os evals.

## Transparência

Cada resposta carrega os passos que a geraram (consultou chamados, consultou a central de ajuda, classificou). Esse registro é produzido pelo código a partir das chamadas de tool reais, não por texto gerado pelo modelo, que poderia descrever um passo que não aconteceu.

## Falhas

O modelo e o sistema de chamados legado falham. Para cada chamada defina timeout, nova tentativa limitada com espera e uma resposta degradada (mensagem clara ao funcionário, sem stack nem detalhe do provedor). Em caso de dúvida do agent ou falha repetida, transfira com um resumo do caso, para o analista não recomeçar a conversa. Detalhes de resiliência em chamadas externas estão na skill `nestjs`.
