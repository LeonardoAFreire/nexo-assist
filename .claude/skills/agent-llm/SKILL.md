---
name: agent-llm
description: Padrões para implementar e revisar o agent de atendimento do Nexo Assist (packages/agent) e qualquer uso do modelo de linguagem. Cobre a porta LlmClient, o laço limitado de passos, tools com schema zod, onde ficam as regras do service desk, custo e latência (janela de contexto, escolha de modelo, prompt caching, orçamento de tokens, streaming), transparência dos passos e tratamento de falhas do modelo e do sistema legado. Use ao criar ou alterar o agent, prompts, tools, o cliente do provedor, o orçamento de tokens, a transferência para o analista, a explicação "o que o agent fez e por quê", ou ao decidir se uma regra vai no prompt ou no código.
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

## Transparência

Cada resposta carrega os passos que a geraram (consultou chamados, consultou a central de ajuda, classificou). Esse registro é produzido pelo código a partir das chamadas de tool reais, não por texto gerado pelo modelo, que poderia descrever um passo que não aconteceu.

## Falhas

O modelo e o sistema de chamados legado falham. Para cada chamada defina timeout, nova tentativa limitada com espera e uma resposta degradada (mensagem clara ao funcionário, sem stack nem detalhe do provedor). Em caso de dúvida do agent ou falha repetida, transfira com um resumo do caso, para o analista não recomeçar a conversa. Detalhes de resiliência em chamadas externas estão na skill `nestjs`.
