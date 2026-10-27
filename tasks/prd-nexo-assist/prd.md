# Documento de Requisitos do Produto (PRD): Nexo Assist

Fontes: `docs/Desafio_Tecnico_Nexo_Assist_PRD_v5.md` (transcrição do PDF do desafio, com os Anexos A, B e C) e `docs/nexo/nexo.pen` (protótipo com 6 telas). Itens marcados com **[premissa]** não estão definidos nas fontes e foram decididos para fechar o escopo; podem ser revistos na TechSpec.

## Visão geral

A Nexo tem cerca de 2.000 funcionários e hoje abre chamados de TI por formulário. Isso gera chamados para dúvidas que a central de ajuda já responde, chamados duplicados, prioridade errada, informações faltando e analistas gastando boa parte do dia com triagem.

O **Nexo Assist** é um agent de atendimento num chat. O funcionário descreve o problema com as próprias palavras, e o agent consulta os chamados dele, busca na central de ajuda, abre ou atualiza chamados (sempre após confirmação) e transfere para um analista quando precisa, seguindo as regras do service desk. Do outro lado, o analista (Suporte N1 e N2) usa um console para ver as conversas que precisam dele, assumir o atendimento com o agent pausado e devolvê-lo ou encerrá-lo. Em toda resposta é possível ver o que o agent fez, o que entendeu, com que grau de segurança e por quê. Essa transparência é a parte mais importante do desafio.

## Objetivos

O desafio mede o sucesso por quatro resultados. Para cada um, a meta abaixo é verificável num conjunto de cenários de avaliação (evals) com o modelo real e em testes automatizados com o modelo simulado.

| Resultado | Métrica | Meta |
| --- | --- | --- |
| Resolução sem fila | Cenários de dúvida coberta pela central de ajuda e de consulta de status resolvidos no chat, sem abrir chamado nem transferir | ≥ 90% dos cenários |
| Chamados bem abertos | Rascunhos com os seis campos obrigatórios preenchidos e tipo, categoria e prioridade iguais ao gabarito | ≥ 90% dos cenários; 100% dos campos obrigatórios presentes |
| Sem duplicidade | Cenários com chamado aberto sobre o mesmo problema em que o agent propõe atualizar em vez de criar | 100% dos cenários |
| Confirmação antes de escrever | Chamados criados, atualizados ou reabertos sem confirmação registrada do funcionário | 0 ocorrências |
| Encaminhamento certo | Cenários de pedido explícito, caso crítico, chamado vencido ou baixa confiança que terminam em transferência com resumo | 100% dos cenários |
| Escopo | Assuntos fora de TI (RH, financeiro, facilities) redirecionados, sem chamado | 100% dos cenários |
| Privacidade | Respostas, contexto do modelo ou telas que expõem chamado de outro funcionário | 0 ocorrências (testes automatizados de listar, consultar, atualizar, reabrir e deduplicar) |
| Transparência | Respostas do agent com passos executados e detalhe (entendimento, ação, confiança e motivo) disponível | 100% das respostas |
| Latência percebida **[premissa, revista na QA]** | (a) indicador de atividade depois de enviar; (b) primeiro passo do agent visível no chat; (c) primeiro trecho do texto da resposta | (a) ≤ 1 s; (b) p50 ≤ 3 s e p95 ≤ 5 s; (c) p50 ≤ 5 s e p95 ≤ 10 s |
| Custo **[premissa]** | Custo médio de modelo por conversa típica (até 10 mensagens do funcionário) | ≤ US$ 0,02, medido e reportado no README |
| Resiliência | Indisponibilidade de alguns segundos do sistema de chamados não derruba a conversa | 100% dos cenários de falha simulada terminam com nova tentativa bem-sucedida ou mensagem clara ao funcionário |
| Execução | Subir o projeto localmente a partir de um clone limpo | No máximo 4 comandos documentados no README |

Nota sobre a latência: o documento do desafio só pede "respostas em tempo real" e "respostas rápidas e uso consciente do modelo" (sem números). A meta original de p50 ≤ 2 s para o primeiro trecho era uma premissa deste PRD e foi revista na QA de 2026-10-27, com a aprovação do usuário, para as três medidas acima. Os valores medidos com o modelo real (Luna) foram: aceite p50 de 51 ms; primeiro passo p50 de 2,9 s e p90 de 3,7 s; primeiro texto p50 de 4,6 s e p95 de 9,9 s.

Meta de negócio: entregar um produto que atenda aos critérios de avaliação do desafio (qualidade das decisões, condução da conversa, transparência, interface fiel ao protótipo, arquitetura e boas práticas, clareza do README) e o diferencial de deploy.

## Histórias de usuário

### Funcionário da Nexo (usuário principal)

- **US1:** Como funcionário, quero tirar uma dúvida sem abrir chamado, para resolver na hora com a central de ajuda.
- **US2:** Como funcionário, quero saber o status de um chamado meu, mesmo sem lembrar o número, e saber se ele está atrasado, para decidir se preciso cobrar.
- **US3:** Como funcionário, quero complementar um chamado aberto com novas informações, para que o analista tenha o que precisa.
- **US4:** Como funcionário, quero abrir um chamado só conversando e conferir o rascunho antes de ele ser criado, para não preencher formulário e evitar dados errados.
- **US5:** Como funcionário, quero falar com um analista quando eu preferir ou quando o problema for grave, para ter atendimento humano quando o agent não basta.
- **US6:** Como funcionário, quero voltar outro dia e continuar de onde parei, para não repetir o contexto.
- **US7:** Como funcionário, quero ver o que o agent fez e por quê em cada resposta, para confiar na decisão ou corrigi-la.
- **US8:** Como funcionário, quero entrar com meu e-mail corporativo e ver meus dados de perfil, para acessar o atendimento com segurança.

### Analista do service desk (Suporte N1 e N2)

- **US9:** Como analista, quero receber chamados com tipo, categoria e prioridade corretos e uma descrição completa, para não perguntar tudo de novo.
- **US10:** Como analista, quero ver as conversas que precisam de mim, inclusive aquelas em que o agent não teve segurança para decidir, para atender na hora certa.
- **US11:** Como analista, quero assumir uma conversa com o agent pausado e depois devolvê-la ao agent ou encerrá-la, para atender sem interferência.
- **US12:** Como analista, quero ver o histórico da conversa, o resumo da transferência e os chamados do funcionário, para entender o caso sem perguntar de novo.

### Casos de borda

- Funcionário pergunta sobre um chamado que não é dele ou que não existe: a resposta é a mesma nos dois casos e não revela a existência do chamado.
- Funcionário descreve um problema que já tem chamado aberto: o agent propõe atualizar o existente.
- Funcionário relata problema de um chamado resolvido há até 7 dias: o agent propõe reabrir; há mais de 7 dias, propõe um chamado novo citando o anterior.
- Artigo da central de ajuda não se aplica ao caso (ex.: erro 809 em Windows 11): o agent não sugere o artigo como solução e segue para abertura de chamado.
- Sistema de chamados indisponível por alguns segundos: o agent tenta de novo e, se persistir, avisa o funcionário sem perder o que já foi conversado.
- Funcionário atinge 30 mensagens na sessão.
- Funcionário envia mensagem enquanto a conversa está com um analista: o agent não responde.
- Assunto fora de TI ou tentativa de instruir o agent a ignorar regras: o agent redireciona ou recusa e segue as regras.

## Principais funcionalidades

### F1. Login e perfil (Tela 1 e "Meu perfil")

Dá acesso autenticado ao chat e ao console e garante que cada pessoa veja apenas os próprios dados.

- **RF1:** A tela de login pede e-mail corporativo e senha, com a apresentação do Nexo Assist conforme o protótipo.
- **RF2:** Qualquer funcionário ou analista dos dados de exemplo entra com qualquer senha não vazia; e-mails desconhecidos são recusados com mensagem genérica.
- **RF3:** **[premissa]** O papel (funcionário ou analista) vem dos dados de exemplo; após o login, o funcionário vai para o chat e o analista vai para o console.
- **RF4:** A sessão expira e o botão "Sair" encerra a sessão. A identidade usada em toda consulta vem da sessão, nunca de dados enviados pela tela ou escolhidos pelo modelo.
- **RF5:** A tela "Meu perfil" mostra nome, e-mail corporativo ("Gerenciado pela TI") e o bloco de senha somente como informação; "Redefinir senha" fica visível e desabilitado.

### F2. Chat do funcionário (Telas 2 e 3)

É o canal principal: conversa com o agent, respostas em tempo real e componentes ricos que evitam digitação.

- **RF6:** O funcionário envia mensagens em texto livre e recebe a resposta do agent de forma incremental (em tempo real).
- **RF7:** Acima de cada resposta do agent aparecem os passos executados (ex.: "consultou seus chamados", "buscou na central de ajuda", "classificou a prioridade", "consultou o SLA", "montou o rascunho").
- **RF8:** Perguntas com opções rápidas numeradas (ex.: "Quem está sendo afetado?": Só eu, Minha equipe, Toda a empresa, Não sei) podem ser respondidas por clique, por número no teclado ou por texto livre.
- **RF9:** Seleção de chamado: quando o funcionário tem mais de um chamado relevante, o agent mostra uma lista com número, título, status e data, e a escolha vira uma mensagem do funcionário.
- **RF10:** Card de chamado com número, status, título, descrição, categoria, prioridade, data de abertura, última atualização e indicação de prazo vencido.
- **RF11:** Card de rascunho com número do rascunho, estado "Aguardando confirmação", título, descrição, categoria, prioridade com o horário-limite de resposta e afetados, e as ações Confirmar (também por atalho de teclado), Editar e Cancelar.
- **RF12:** **[premissa]** Editar permite ajustar título, descrição, categoria e afetados no próprio card; a prioridade e o prazo são recalculados pelas regras e o rascunho volta a aguardar confirmação.
- **RF13:** Limite de 30 mensagens do funcionário por sessão, com contador visível ("18/30 mensagens nesta sessão"). **[premissa]** Uma sessão é o período de um login; ao atingir o limite, o campo de mensagem é desabilitado, com explicação e a opção de falar com um analista.
- **RF14:** Ao voltar (inclusive em outro dia), o funcionário vê o histórico da conversa em andamento, com os cards e o estado atual (com o agent, aguardando atendente ou com um analista).
- **RF15:** Enquanto a conversa está transferida, o chat mostra esse estado; mensagens do funcionário são entregues ao analista e o agent não responde. Mensagens do analista aparecem no chat identificadas pelo nome e pelo nível de suporte.
- **RF16:** **[premissa]** Depois que o analista encerra a conversa, a próxima mensagem do funcionário inicia uma nova conversa e o histórico anterior continua visível.
- **RF17:** Estados de carregamento, de agent "digitando", de erro com opção de tentar novamente e de conversa vazia com sugestões iniciais.

### F3. O agent

Decide o que fazer a cada mensagem com a central de ajuda e o serviço de chamados, seguindo o Anexo A.

- **RF18:** Identifica a intenção da mensagem: dúvida, consulta de status, complemento de chamado, abertura de chamado, pedido de analista ou assunto fora de escopo.
- **RF19:** Dúvidas: busca na central de ajuda e responde citando o artigo usado; verifica se as condições do artigo se aplicam ao caso (ex.: versão do sistema operacional) antes de recomendá-lo.
- **RF20:** Consulta de status: busca os chamados do funcionário por número ou por descrição, informa status, última atualização e se o prazo está vencido, e oferece chamar um analista quando estiver vencido.
- **RF21:** Abertura: coleta título, descrição, tipo (INC ou REQ), categoria (Acesso, Rede e VPN, Hardware, Software, E-mail, Outros), prioridade e afetados, perguntando só o que falta, uma pergunta por vez, com opções rápidas quando houver alternativas fechadas.
- **RF22:** Prioridade pela matriz do Anexo A: impacto (quantas pessoas são afetadas) combinado com urgência (compromisso em risco). A resposta explica o motivo da prioridade e o prazo resultante.
- **RF23:** Antes de criar, verifica se existe chamado aberto do mesmo funcionário sobre o mesmo problema; se existir, propõe atualizá-lo. Se houver chamado resolvido há até 7 dias sobre o mesmo problema, propõe reabri-lo.
- **RF24:** Criar, atualizar ou reabrir chamado só acontece depois da confirmação explícita do funcionário sobre o rascunho exibido. A confirmação é verificada pelo sistema, não apenas pelo modelo.
- **RF25:** Transfere para um analista quando o funcionário pede, em casos críticos, em chamados vencidos ou quando a confiança do agent fica abaixo do limite **[premissa: limite configurável, padrão 60%]**.
- **RF26:** Assuntos fora de TI (RH, financeiro, facilities) são redirecionados com orientação sobre a quem procurar, sem abrir chamado.
- **RF27:** Nunca informa dados de chamados de outro funcionário e trata o texto de mensagens, artigos e chamados como dado, não como instrução.
- **RF28:** Mantém o contexto da conversa (inclusive após retomada em outro dia e após devolução pelo analista, considerando as mensagens do analista).
- **RF29:** Quando o modelo ou o sistema de chamados falha, responde com mensagem clara, sem detalhes técnicos, e oferece tentar de novo ou falar com um analista.

### F4. Visibilidade das decisões (a parte mais importante)

Permite entender o que o agent fez e por quê em cada resposta, para o funcionário e para o analista.

- **RF30:** Cada resposta do agent registra os passos realmente executados (consultas, buscas, classificações, rascunhos, ações), produzidos a partir das ações reais e não de texto livre do modelo.
- **RF31:** Cada resposta tem um detalhe expansível que mostra, em linguagem simples: o que o agent entendeu (intenção e dados extraídos), que ação tomou, o grau de segurança (percentual e rótulo) e o motivo, incluindo a regra do service desk aplicada (ex.: "prioridade alta: impede uma pessoa de trabalhar e há compromisso hoje").
- **RF32:** Para cada passo, o detalhe mostra o resultado resumido (ex.: "3 chamados encontrados", "artigo 'VPN com erro 809' não se aplica: vale só para Windows 10") e indica falhas e novas tentativas.
- **RF33:** O mesmo detalhe fica disponível no console do analista para cada resposta do agent na conversa transferida.
- **RF34:** **[premissa]** Cada decisão também é gravada num registro estruturado consultável pelo time (sem conteúdo sensível completo nos logs de aplicação), servindo de base para os evals.

### F5. Serviço de chamados simulado (Anexo B)

Simula o sistema legado, separado do agent, com dados de exemplo variados.

- **RF35:** Permite consultar (por funcionário, por número e por texto), criar, atualizar (complemento e mudança de status), reabrir e transferir chamados.
- **RF36:** Toda operação é restrita ao solicitante autenticado; o analista acessa chamados de outros funcionários só pelo papel de analista e no contexto de uma conversa transferida a ele.
- **RF37:** Numeração por tipo (INC-xxxxx para incidente, REQ-xxxxx para requisição), status (ex.: Aberto, Aguardando analista, Em andamento, Em atendimento, Aprovado, Resolvido), datas de abertura, de última atualização e de resolução.
- **RF38:** Calcula o prazo pela prioridade em horas e dias úteis (segunda a sexta, 8h às 18h); prioridade crítica conta 1 hora corrida (plantão 24 horas). O prazo vale para a primeira resposta e para cada atualização; passado o prazo, o chamado está vencido.
- **RF39:** Simula indisponibilidade ocasional de alguns segundos (ativável e configurável), para demonstrar o tratamento de falhas.
- **RF40:** Dados de exemplo: de 5 a 10 artigos curtos (incluindo "VPN com erro 809" e "Horário do service desk"), funcionários (incluindo Ana Souza), analistas N1 e N2 (incluindo Rafael Lima, N2) e chamados em situações variadas: aberto, vencido, resolvido há até 7 dias, resolvido há mais de 7 dias e de outros funcionários, incluindo INC-20311, REQ-10442 e INC-20150 do Anexo B.

### F6. Transferência para analista

Garante que o que precisa de uma pessoa chegue ao analista na hora certa e com contexto.

- **RF41:** Ao transferir, a conversa fica "Aguardando atendente", o agent para de responder e o funcionário é informado do nível de suporte e do tempo esperado para o contato.
- **RF42:** A transferência leva um resumo do caso: o que o funcionário quer, o que o agent já fez, chamados envolvidos, motivo da transferência (pedido, crítico, vencido, baixa confiança) e a confiança do agent.
- **RF43:** **[premissa]** Suporte N1 é o nível padrão; casos críticos e chamados vencidos vão para o N2. O tempo de primeiro contato do analista é de até 2 horas úteis, ou 1 hora para casos críticos.
- **RF44:** Quando há chamado relacionado, a transferência fica registrada no histórico do chamado.

### F7. Console do analista (Telas 4 e 5)

Ferramenta do analista para atender as conversas que precisam dele.

- **RF45:** Lista de conversas com nome, horário, última mensagem, contador de não lidas e status: Transferida (com chamado ou tempo para contato), Agent pediu ajuda (com a confiança), Agent atendendo, Você está atendendo, Resolvida pelo agent e Encerrada.
- **RF46:** Filtros: Todas, Para você (aguardando atendente), Com o agent e Minhas (assumidas pelo analista), com contadores; busca por nome do funcionário ou número de chamado.
- **RF47:** Histórico completo da conversa, com as mensagens do funcionário, do agent (com o detalhe da decisão, RF33), do analista e os eventos (transferida, assumida, devolvida, encerrada) com horário.
- **RF48:** Barra de atendimento: "Assumir atendimento" (o agent fica pausado e o campo de resposta é liberado), "Devolver ao agent" e "Encerrar atendimento". Sem assumir, o analista não consegue responder.
- **RF49:** Painel "Chamados do funcionário": chamados desta conversa e outros chamados (abertos e encerrados), com status, categoria e prioridade, e o evento mais recente.
- **RF50:** A lista e a conversa aberta se atualizam sem recarregar a página quando chegam mensagens ou mudanças de status.
- **RF51:** Uma conversa assumida por um analista não pode ser assumida por outro ao mesmo tempo.

### F8. Persistência e operação

- **RF52:** Conversas, mensagens, passos e detalhes das decisões, chamados e o estado de cada conversa (com o agent, aguardando atendente, com um analista, encerrada) sobrevivem a um reinício da aplicação.
- **RF53:** O projeto roda localmente com poucos comandos documentados, a partir de um `.env.example`, com os dados de exemplo carregados automaticamente.
- **RF54:** Limite de uso por usuário nos endpoints de chat para conter abuso e custo.

### F9. Entrega: README e deploy

- **RF55:** README com: como rodar, visão geral da arquitetura, como o agent decide o que fazer, como a qualidade das decisões foi garantida (testes e evals com resultados), principais trade-offs, escolha do modelo e do OpenRouter, custo por conversa medido e o que faria com mais tempo.
- **RF56:** Deploy publicado como etapa final, com chaves protegidas, limite de uso e teto de custo, e a explicação de como foi feito no README.
- **RF57:** Histórico de commits que conta a evolução do desenvolvimento.

## Critérios de aceitação

- **CA-01 (US8, RF1–RF3):** Dado um e-mail de funcionário dos dados de exemplo e qualquer senha, quando entra, então vê o chat; dado um e-mail de analista, então vê o console; dado um e-mail desconhecido, então vê uma mensagem genérica de falha.
- **CA-02 (US8, RF4):** Dado um funcionário autenticado, quando a tela envia o identificador de outro funcionário em qualquer requisição, então os dados retornados continuam sendo apenas os do funcionário da sessão.
- **CA-03 (US8, RF5):** Dado um funcionário autenticado, quando abre "Meu perfil", então vê nome e e-mail, e "Redefinir senha" aparece desabilitado.
- **CA-04 (US1, RF19):** Dado que existe um artigo que responde à dúvida, quando o funcionário pergunta (ex.: "qual o horário do service desk?"), então recebe a resposta citando o artigo, com o passo "buscou na central de ajuda", e nenhum chamado é criado.
- **CA-05 (US1, US4, RF19):** Dado o artigo do erro 809 válido só para Windows 10, quando o funcionário relata o erro 809 no Windows 11, então o agent explica que o artigo não se aplica e segue para a abertura de chamado.
- **CA-06 (US2, RF9, RF20):** Dado um funcionário com 3 chamados abertos, quando pergunta "qual o status do meu chamado?" sem número, então vê a lista para seleção e, ao escolher, vê o card do chamado.
- **CA-07 (US2, RF20, RF38):** Dado o INC-20311 de prioridade média sem atualização acima de 3 dias úteis, quando é consultado, então o card mostra "prazo vencido" e o agent oferece chamar um analista.
- **CA-08 (US2, RF27, RF36):** Dado um chamado de outro funcionário, quando o funcionário pergunta por ele pelo número, então a resposta é idêntica à de um número inexistente e nenhum dado do chamado aparece.
- **CA-09 (US3, RF23, RF24):** Dado um chamado aberto do funcionário, quando ele traz nova informação sobre o mesmo problema, então o agent mostra o complemento proposto e só atualiza o chamado após a confirmação.
- **CA-10 (US4, RF21, RF22):** Dado o relato "minha VPN não conecta, erro 809, Windows 11", quando o agent coleta os dados, então pergunta quem é afetado com opções rápidas e não pergunta o que já foi dito.
- **CA-11 (US4, RF22):** Dado "só eu" e "reunião com cliente às 14h", quando o agent classifica, então a prioridade é Alta, com prazo de 4 horas úteis, e o motivo citado é o compromisso no mesmo dia.
- **CA-12 (US4, RF11, RF24):** Dado um rascunho exibido, quando o funcionário clica em Confirmar ou usa o atalho, então o chamado é criado com os seis campos obrigatórios e o card passa a mostrar o número definitivo (INC ou REQ).
- **CA-13 (US4, RF24):** Dado um rascunho exibido, quando o funcionário escreve algo diferente de uma confirmação ou clica em Cancelar, então nenhum chamado é criado.
- **CA-14 (US4, RF12):** Dado um rascunho, quando o funcionário edita a categoria ou os afetados, então o rascunho é atualizado, a prioridade é recalculada e volta a aguardar confirmação.
- **CA-15 (US4, RF23):** Dado um chamado aberto sobre VPN do mesmo funcionário, quando ele relata de novo o problema de VPN, então o agent propõe atualizar o chamado existente em vez de criar outro.
- **CA-16 (US4, RF23):** Dado o INC-20150 resolvido há 4 dias, quando o funcionário relata que a senha do SAP bloqueou de novo, então o agent propõe reabri-lo; dado um chamado resolvido há mais de 7 dias, então propõe um chamado novo.
- **CA-17 (US5, RF25, RF41, RF42):** Dado qualquer momento da conversa, quando o funcionário pede um analista, então a conversa fica "Aguardando atendente", o funcionário é informado do nível e do tempo de contato, e o resumo aparece no console.
- **CA-18 (US5, RF25):** Dado um relato de algo parado para uma equipe ou para a empresa, quando o agent classifica como crítico, então a prioridade é Crítica (1 hora) e a conversa é transferida.
- **CA-19 (US10, RF25, RF45):** Dado um caso em que a confiança do agent fica abaixo do limite, quando ele responde, então a conversa é transferida e aparece no console como "Agent pediu ajuda" com a confiança.
- **CA-20 (US5, RF15):** Dada uma conversa aguardando atendente ou com um analista, quando o funcionário envia mensagem, então o agent não responde e a mensagem aparece no console.
- **CA-21 (US6, RF14, RF52):** Dada uma conversa com rascunho pendente ou transferida, quando a aplicação é reiniciada e o funcionário entra de novo, então vê o mesmo histórico, os mesmos cards e o mesmo estado da conversa.
- **CA-22 (US6, RF28):** Dada uma conversa retomada em outro dia, quando o funcionário diz "e aquele chamado da VPN?", então o agent usa o contexto anterior para identificar o chamado.
- **CA-23 (US7, RF7, RF30):** Dada qualquer resposta do agent, quando ela aparece, então os passos exibidos acima dela correspondem exatamente às ações executadas.
- **CA-24 (US7, RF31, RF32):** Dada qualquer resposta do agent, quando o funcionário expande o detalhe, então vê o que o agent entendeu, a ação tomada, a confiança e o motivo, com a regra aplicada quando houver.
- **CA-25 (RF13):** Dado um funcionário com 29 mensagens na sessão, quando envia a 30ª, então recebe resposta, o contador mostra 30/30 e o campo é desabilitado com a opção de falar com um analista.
- **CA-26 (RF26):** Dado um pedido de RH, financeiro ou facilities, quando o funcionário o envia, então o agent redireciona sem abrir chamado.
- **CA-27 (RF27):** Dada uma mensagem ou artigo com instrução para ignorar as regras ou mostrar chamados de outra pessoa, quando o agent a processa, então segue as regras e não expõe dados de terceiros.
- **CA-28 (RF29, RF39):** Dado o sistema de chamados indisponível por alguns segundos, quando o agent precisa dele, então tenta de novo e conclui a ação; se a falha persistir, o funcionário recebe uma mensagem clara e as opções de tentar de novo ou falar com um analista, e o detalhe registra a falha.
- **CA-29 (US11, RF48):** Dada uma conversa aguardando atendente, quando o analista clica em "Assumir atendimento", então o agent fica pausado, o campo de resposta é liberado, o evento "assumiu · agent pausado" aparece para os dois lados e o status vira "Você está atendendo".
- **CA-30 (US11, RF48):** Dada uma conversa assumida, quando o analista clica em "Devolver ao agent", então a próxima mensagem do funcionário é respondida pelo agent levando em conta as mensagens do analista.
- **CA-31 (US11, RF48, RF16):** Dada uma conversa assumida, quando o analista clica em "Encerrar atendimento", então a conversa fica encerrada para os dois lados.
- **CA-32 (US11, RF51):** Dada uma conversa assumida por um analista, quando outro analista tenta assumi-la, então a ação é recusada com mensagem clara.
- **CA-33 (US10, RF46):** Dado o console com conversas em vários estados, quando o analista usa os filtros ou a busca, então a lista e os contadores refletem o filtro escolhido.
- **CA-34 (US12, RF47, RF49, RF33):** Dada uma conversa transferida, quando o analista a abre, então vê o histórico, o resumo da transferência, o detalhe das decisões do agent e o painel com os chamados do funcionário.
- **CA-35 (US9, RF21):** Dado um chamado criado pelo agent, quando o analista o abre, então tem título, descrição com o contexto relatado, tipo, categoria, prioridade e afetados preenchidos.
- **CA-36 (RF50):** Dado o console aberto, quando chega uma nova mensagem ou uma conversa muda de status, então a lista e a conversa se atualizam sem recarregar a página.
- **CA-37 (RF6, RF17):** Dada uma mensagem enviada, quando o agent responde, então o texto aparece de forma incremental; durante a espera há indicador de carregamento e, em caso de erro, mensagem com opção de tentar de novo.
- **CA-38 (RF53, RF55):** Dado um clone limpo com `.env` copiado do `.env.example` e uma chave de API, quando os comandos do README são executados, então a aplicação sobe com os dados de exemplo.
- **CA-39 (RF54, RF56):** Dado o ambiente publicado, quando um usuário excede o limite de uso, então recebe uma mensagem de limite atingido e nenhuma chamada ao modelo é feita.
- **CA-40 (Objetivos):** Dado o conjunto de evals do README, quando executado com o modelo configurado, então as metas da seção Objetivos são atingidas e o resultado é publicado no README.

## Experiência do usuário

### Perfis e necessidades

- **Funcionário:** não técnico em boa parte dos casos, quer resolver rápido e sem formulário; precisa de linguagem simples, poucas perguntas e confiança de que o agent não fará nada sem confirmar.
- **Analista N1/N2:** atende várias conversas em paralelo; precisa de triagem clara (quem precisa de mim e por quê), contexto completo e controle explícito sobre quando o agent está pausado.

### Fluxos principais

1. **Dúvida:** pergunta → busca na central → resposta com artigo citado → fim, sem chamado.
2. **Abertura (Tela 2):** relato → consulta de chamados e da central → perguntas do que falta (opções rápidas) → classificação da prioridade com prazo → rascunho → Confirmar, Editar ou Cancelar → card com número definitivo.
3. **Consulta (Tela 3):** "qual o status?" → lista para seleção → card com prazo → se vencido, oferta de analista (Falar com um analista, Adicionar informação, Não, obrigado).
4. **Transferência:** pedido, crítico, vencido ou baixa confiança → conversa aguardando atendente com aviso do tempo de contato → agent pausado.
5. **Console (Telas 4 e 5):** lista filtrada → conversa com resumo e chamados → Assumir → conversa com o funcionário → Devolver ao agent ou Encerrar.
6. **Retomada:** login em outro dia → histórico e estado restaurados → continua a conversa.

### Requisitos de UI/UX

- Seguir o layout e o estilo do protótipo `docs/nexo/nexo.pen` (6 telas desktop 1440×900), com liberdade nos detalhes: sidebar com Atendimento e Meu perfil, barra superior com "Assistente online", coluna de chat central, cards e campo de mensagem com contador.
- Console em três colunas: lista de conversas, conversa com a barra de atendimento e painel de chamados do funcionário.
- Os dados do protótipo são ilustrativos; a interface usa os dados de exemplo do serviço simulado.
- Tratar estados de carregamento, vazio, erro, transferido e limite de mensagens em todas as telas.
- Textos em português do Brasil, datas e horas no formato brasileiro.
- **[premissa]** Desktop-first: telas fiéis ao protótipo a partir de 1280 px; o chat do funcionário continua utilizável a partir de 375 px de largura; o console é otimizado para desktop.

### Acessibilidade

- **[premissa]** Meta WCAG 2.1 nível AA: contraste, foco visível e rótulos em todos os controles.
- Todo o fluxo operável por teclado: opções rápidas por número, Confirmar por atalho, navegação na lista de conversas e no detalhe expansível.
- Respostas incrementais e mudanças de estado (transferida, assumida, limite atingido) anunciadas a leitores de tela sem repetir o texto a cada trecho.
- Status e prioridade não dependem só de cor (sempre com texto).

## Restrições técnicas de alto nível

- **Linguagem:** TypeScript com tipagem estrita em todo o projeto.
- **Agent:** Mastra (preferência do desafio), encapsulado de forma que o restante do sistema não dependa do framework; as regras do service desk que podem ser verificadas (confirmação antes de escrever, privacidade, prazos, reabertura em 7 dias) são garantidas pelo sistema, não apenas pelo prompt.
- **Modelo:** acesso aos modelos via OpenRouter; a escolha do modelo é configurável e justificada no README considerando qualidade, latência e custo por conversa.
- **Interface:** React, seguindo o protótipo do Anexo C.
- **Dados:** serviço de chamados simulado separado do agent, tratado como sistema legado sujeito a indisponibilidade de alguns segundos.
- **Persistência:** conversas, chamados e estado das conversas sobrevivem a um reinício.
- **Execução:** roda localmente com poucos comandos documentados e um `.env.example`.
- **Segurança e privacidade:** chaves só em variáveis de ambiente e nunca no frontend; identidade do solicitante só da sessão autenticada; chamados de um funcionário nunca expostos a outro, nem no contexto enviado ao modelo; respostas de "não encontrado" e "sem permissão" indistinguíveis; entradas validadas na borda; conteúdo completo de prompts e chamados fora dos logs de nível informativo; erros ao usuário sem detalhes internos ou do provedor.
- **Custo e abuso:** limite de 30 mensagens por sessão, limite de uso por usuário e teto de custo no ambiente publicado.
- **Desempenho:** latência percebida e custo por conversa conforme as metas da seção Objetivos. **[premissa]** Escala de demonstração: dezenas de usuários simultâneos, não os 2.000 funcionários.

## Fora do escopo

- Integração com o sistema de chamados real, diretório corporativo (SSO, AD) ou e-mail; o login aceita qualquer senha para os usuários dos dados de exemplo.
- Redefinição de senha e edição de perfil (o botão aparece desabilitado).
- Cadastro e edição de artigos da central de ajuda pela interface; os artigos vêm dos dados de exemplo.
- Gestão de chamados pelo analista fora da conversa (fila de chamados, mudança de status em massa, relatórios); o analista atua pelo console de conversas. O link "Ver todos os chamados" pode abrir apenas a lista do funcionário em modo leitura.
- Notificações por e-mail, push ou alertas de prazo para analistas.
- Anexos, imagens, áudio e acesso remoto na conversa.
- Atendimento em outros idiomas além do português.
- Roteamento automático para um analista específico, escala de plantão e controle de disponibilidade além do indicador "Disponível".
- Painéis de métricas operacionais (os números da tela de login são ilustrativos).
- Assuntos fora de TI: são apenas redirecionados.
- Escala de produção para os 2.000 funcionários.
