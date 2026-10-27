---
name: testes
description: Estratégia e escrita de testes do Nexo Assist. Decide o que testar por risco, escolhe a camada (estática, unitário, integração, E2E), define cobertura e dublês e cobre backend NestJS, frontend React (Testing Library, MSW, React Query), o agent com modelo falso e evals. Use sempre que for escrever, revisar, planejar ou corrigir testes, montar os casos TU, TI e E2E de uma techspec, discutir cobertura, Vitest, Playwright, MSW, supertest ou "vale a pena testar isso?", mesmo que o pedido não use a palavra teste.
---

# Testes

O objetivo dos testes é dar confiança para mudar o código, não atingir um percentual. Cada teste tem custo de escrita e de manutenção, então o critério é: onde uma falha custaria caro e onde o teste dá mais confiança por menos esforço. Código sem comportamento relevante não precisa de teste.

## 1. Decida por risco

Pergunte antes de escrever: se isso quebrar, quem percebe e quanto custa?

| Risco | Exemplos neste projeto | Profundidade |
| ----- | ---------------------- | ------------ |
| Alto | Prioridade e prazo (Anexo A do PRD), vencimento, reabertura em 7 dias, deduplicação, **privacidade** (chamado só para quem abriu), confirmação antes de criar ou atualizar chamado, transferência e agent pausado, escopo só TI, limites e decisões do agent, autenticação | Unitários nas regras de `core/`, integração do contrato HTTP e dos eventos, regressão a cada bug |
| Médio | Fluxos de tela com estado (chat, console), mapeamento de erro HTTP para mensagem, hooks de dados | Integração com a rede simulada; um caso de erro por fluxo |
| Baixo | DTOs e schemas sem lógica, módulos Nest só de wiring, componentes shadcn/ui, tipos, constantes, páginas só de composição | Sem teste próprio; a tipagem e os testes dos fluxos cobrem |

Evite testes que repetem a implementação, que só verificam que um mock foi chamado ou que existem para subir cobertura: eles quebram a cada refatoração e não pegam bug.

## 2. Escolha a camada

Da mais barata para a mais cara:

1. **Estática**, sempre: `pnpm typecheck`, `pnpm lint`, `pnpm check:boundaries`. Tipagem estrita e fronteiras entre domínios eliminam classes inteiras de bug sem escrever teste.
2. **Unitário** para regra de negócio pura em `core/`. Rápido, e o lugar mais barato para cobrir muitos cenários e limites.
3. **Integração** onde as peças colaboram: módulo Nest, controller com `supertest`, persistência real em banco isolado, contrato entre domínios, hook com rede simulada. É a camada de maior retorno para wiring, validação, autorização e persistência.
4. **E2E** (Playwright, `e2e/`) para poucos fluxos críticos, no máximo: login e abertura de chamado com confirmação; consulta de chamado de terceiro negada; transferência para o analista e retorno ao agent. O modelo de linguagem nos E2E é sempre o falso, para o teste ser determinístico e barato.

Detalhes por camada: [backend](references/backend.md), [frontend](references/frontend.md), [agent e evals](references/agent.md).

## 3. Cobertura é sinal, não meta

- Não há meta global e o build não falha por percentual global: uma meta global empurra para testar código trivial e dá falsa segurança.
- O limite (80% de linhas e ramos) vale **só** para as pastas `core/` dos domínios e para as regras de decisão do agent, onde está o risco alto.
- Use o relatório para achar lacunas em código crítico.
- Todo bug corrigido ganha um teste de regressão que falha sem a correção.

## 4. Dublês

- Substitua apenas as bordas que o projeto não controla: modelo de linguagem, sistema de chamados legado, relógio, aleatoriedade e rede.
- Prefira fakes em memória a mocks que verificam chamadas. Verifique resultado e estado, não a ordem interna das chamadas.
- Não substitua o que o projeto possui (hooks, services, repositórios) em integração: isso esconde o bug que o teste deveria achar.
- O sistema legado fica indisponível por alguns segundos de vez em quando. Teste timeout, nova tentativa e a mensagem ao usuário com um fake que falha.

## 5. Estrutura e qualidade

- Unitários ao lado do código (`nome.test.ts`, `nome.test.tsx`); integração em `nome.integration.test.ts`; E2E em `e2e/*.spec.ts`.
- FIRST sem o T: rápidos, independentes, repetíveis (relógio e aleatoriedade controlados) e autovalidados (assertions que representam requisitos).
- Given/When/Then ou AAA, um comportamento por teste. O nome diz condição e resultado: `recusa abrir chamado sem confirmação do funcionário`.
- Dados em fábricas (`makeTicket`, `makeConversation`) dentro do próprio teste. Nada mutável compartilhado.
- Sem `sleep`: espere por condição. Teste instável é corrigido ou removido.
- Restaure mocks, timers e relógio a cada teste.

## 6. Ordem de trabalho

1. Classifique os fluxos por risco.
2. Regras de alto risco primeiro, em unitário.
3. Integração dos contratos HTTP, eventos e persistência.
4. Poucos E2E dos fluxos críticos.
5. Rode a suíte, olhe os buracos de cobertura nas pastas críticas e só então complemente.

Uma tarefa está concluída quando os testes de risco alto e médio que ela introduz passam, `typecheck`, `lint` e `check:boundaries` passam e os limites de cobertura das pastas críticas são respeitados.
