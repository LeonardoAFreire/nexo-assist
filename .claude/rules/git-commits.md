# Commits

O histórico deve contar a história do desenvolvimento: dá para entender o que mudou e por quê lendo só `git log`.

- Faça commits pequenos e coesos: uma mudança lógica por commit, com testes junto do código que protegem. Não misture refatoração, correção e funcionalidade no mesmo commit.
- Use Conventional Commits: `tipo(escopo): descrição`, em português, no imperativo, até 72 caracteres.
  - Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.
  - Escopo: o domínio ou app (`tickets`, `chat`, `agent`, `web`, `monolith`, `contracts`, `shared`) ou `repo` para mudanças transversais.
  - Exemplo: `feat(tickets): calcula prazo por prioridade em horas úteis`.
- O corpo explica o porquê quando não for óbvio e cita a tarefa SDD (`tasks/prd-<slug>/task_N.md`).
- Nunca commite `.env`, chaves, dumps de banco ou artefatos de build. Não use `--no-verify`.
- Toda funcionalidade adicionada termina em commit, sem esperar pedido do usuário. Ao concluir uma tarefa SDD (`task_N.md`) ou outra funcionalidade, commite o que foi entregue seguindo este padrão. Se a entrega tiver mais de uma mudança lógica, faça um commit para cada uma.
- Antes de commitar, rode `typecheck`, `lint`, `check:boundaries` e os testes do que mudou. Se alguma validação falhar, corrija antes; não commite código quebrado.
- Commite só os arquivos da funcionalidade (`git add <caminhos>`, nunca `git add -A` às cegas). Não faça `push`, `amend` nem `rebase` sem pedido do usuário.
