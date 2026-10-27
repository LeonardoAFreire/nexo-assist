# Arquitetura modular

Monólito modular: fronteiras lógicas (módulos no código) separadas de fronteiras físicas (apps que sobem em produção), para que um módulo possa virar app dedicada sem refatorar.

| Unidade        | Onde                                                          | Tag             |
| -------------- | ------------------------------------------------------------- | --------------- |
| App            | `apps/monolith`, `apps/web`: compõe módulos, sem regra de negócio | `app`           |
| Domínio        | `packages/identity`, `chat`, `tickets`, `knowledge`, `agent`  | `domain:<nome>` |
| Infraestrutura | `packages/shared`: config, logger, database, events, http     | `shared`        |
| Contratos      | `packages/contracts`: tipos, schemas zod, eventos, interfaces | `shared`        |

A tag fica em `package.json` (`"nexo": { "tag": "..." }`) e é aplicada por `pnpm check:boundaries`.

## Invariantes de dependência

- Um domínio só depende de `shared` e `contracts`. **Nunca de outro domínio**, nem de classe, repositório ou entidade dele.
- Cada domínio acessa apenas as suas tabelas.
- `shared` e `contracts` não dependem de domínios. Se dois domínios precisam da mesma regra de negócio, a fronteira está errada.
- Apps podem depender de qualquer pacote.
- O `index.ts` de um domínio exporta somente o módulo Nest.
- Dentro de um domínio: `http → core ← persistence`.

Para fazer um módulo chamar outro, publicar eventos, criar um domínio ou promover um módulo a app, carregue a skill `arquitetura-modular`.
