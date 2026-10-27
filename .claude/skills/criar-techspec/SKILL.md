---
name: criar-techspec
description: TechSpec — especificação técnica derivada de um PRD existente. Use quando o usuário pedir uma TechSpec ou a arquitetura de uma funcionalidade que já tenha um PRD em `tasks/prd-*/prd.md`. Não use sem PRD (criar-prd) nem para decompor em tarefas (criar-tasks).
argument-hint: --prd nome-da-funcionalidade
---

O argumento `--prd` identifica o slug da funcionalidade. Sem argumento, localize a pasta em `./tasks/prd-*/`. O PRD obrigatório é `tasks/prd-[slug]/prd.md`; se não existir, pare e indique `/criar-prd`.

A TechSpec define a arquitetura, os componentes, os contratos e os testes da solução. O problema, os objetivos e o escopo já estão no PRD; referencie-o em vez de repetir essas informações. Especifique sem implementar: inclua código somente nos exemplos de interface do template. Prefira uma arquitetura simples e evolutiva, com interfaces claras.

## Fluxo

1. **Analisar o PRD** — leia-o por completo; extraia requisitos, critérios de aceitação, restrições e métricas de sucesso.
   **Conclua quando:** os requisitos, os critérios de aceitação, as restrições e as métricas de sucesso estiverem identificados.

2. **Explorar o projeto** — leia o `CLAUDE.md` e todas as rules em `.claude/rules/`; use o agente Explore antes de perguntar qualquer coisa ao usuário. Identifique os **domínios** (`packages/<domínio>`) e apps afetados e, para cada um, os contratos públicos em `@nexo/contracts` e os eventos envolvidos (veja `.claude/rules/modular-architecture.md` e a skill `arquitetura-modular`). Examine os arquivos e módulos afetados, as interfaces e os pontos de integração, quem chama e quem é chamado, as configurações, a persistência, o tratamento de erros, os testes e a infraestrutura existentes. Avalie se é melhor reutilizar bibliotecas existentes ou construir uma solução nova. Pesquise na web a documentação das bibliotecas envolvidas e as regras de negócio em aberto.
   **Conclua quando:** for possível nomear cada componente novo ou modificado e indicar onde ele se encaixa no código atual.

3. **Esclarecer** — faça perguntas ao usuário usando `AskUserQuestion` antes de redigir. Concentre-se no que a exploração não esclareceu: limites do domínio (qual domínio é dono de cada dado e regra), fluxo de dados e contratos (APIs públicas e eventos entre domínios), dependências externas (modos de falha, timeouts e idempotência), interfaces principais e cenários de teste críticos.
   **Conclua quando:** toda pergunta tiver uma resposta ou premissa explícita.

4. **Redigir** — leia `./references/TEMPLATE.md` desta skill na íntegra e siga sua estrutura exatamente. Em “Conformidade com o CLAUDE.md e as rules”, confirme a leitura do `CLAUDE.md` e de todas as rules em `.claude/rules/`. Em “Conformidade com skills”, verifique somente as skills aplicáveis do projeto em `.claude/skills/` e registre os desvios com justificativa. Em “Abordagem de testes”, defina os casos aplicáveis, nomeados e identificados por camada (`TU-*` para testes de unidade, `TI-*` para testes de integração e `E2E-*` para testes E2E), associando cada caso aos critérios de aceitação que ele verifica. Siga a skill `testes`: priorize por risco, nomeie apenas os casos que protegem comportamento relevante, registre como não aplicável a camada que não agrega e justifique. Não crie casos para código sem comportamento relevante apenas para aumentar a cobertura.
   **Conclua quando:** toda seção do template estiver preenchida e cada componente do passo 2 estiver especificado.

5. **Salvar e reportar** — grave o documento em `tasks/prd-[slug]/techspec.md` e informe o caminho com um resumo de uma linha.
