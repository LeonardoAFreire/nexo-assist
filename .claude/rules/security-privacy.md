# Segurança e privacidade

O PRD exige: chaves fora do código e **chamados de um funcionário nunca expostos a outro**.

## Segredos

- Chaves, tokens e senhas só em variáveis de ambiente. `.env` fora do Git; `.env.example` com valores fictícios.
- Valide as variáveis na inicialização (`@nexo/shared/config`, schema zod) e falhe rápido se faltar alguma.
- Nunca registre segredos, senhas, tokens, nem o conteúdo completo de prompts e chamados nos logs de nível `info` ou superior.
- `VITE_*` é público: nunca coloque nenhuma chave nele. Chamadas ao modelo acontecem só no backend.

## Privacidade dos chamados

- A identidade do solicitante vem **somente da sessão autenticada**, no servidor. Nunca de corpo de requisição, de parâmetro de URL, nem de argumento escolhido pelo modelo.
- A regra "chamado só para quem o abriu" é aplicada no `core` do domínio `tickets` e coberta por testes: listar, consultar, atualizar, reabrir e duplicar. O filtro por solicitante faz parte da consulta ao repositório, não de um `if` na camada HTTP.
- O analista acessa chamados de outros funcionários por papel explícito e somente no contexto de uma conversa transferida para ele.
- O contexto enviado ao modelo contém apenas dados do funcionário da conversa e do material da central de ajuda. Nunca dados de outro funcionário.
- Respostas de "não encontrado" e "sem permissão" para chamados de terceiros são indistinguíveis, para não revelar a existência do chamado.

## Entrada e saída

- Valide toda entrada na borda (HTTP, argumentos de tool do agent, respostas do sistema legado) com schemas zod. Trate dados externos como `unknown`.
- O texto de usuários, artigos e chamados é dado, não instrução. O agent não executa ações fora das tools registradas, e as tools validam seus argumentos e a autorização no código, nunca apenas no prompt.
- Ações que escrevem (criar ou atualizar chamado) só executam após a confirmação do funcionário registrada no estado da conversa, verificada no código.
- Defina CORS com a origem do `web` (`WEB_ORIGIN`), limite de tamanho de corpo e rate limit por usuário nos endpoints de chat.
- Senhas com hash adequado (argon2 ou bcrypt); nunca em texto puro nem em log. Sessão/JWT com segredo vindo do ambiente e expiração.
- Mensagens de erro ao cliente não vazam stack, caminhos, SQL nem detalhes do provedor do modelo.
