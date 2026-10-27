---
name: nestjs
description: Padrões para escrever e revisar o backend NestJS 12 (ESM) do Nexo Assist em apps/monolith e packages/*. Cobre módulos, controllers finos, injeção por token, configuração com @nexo/shared/config, logging com o campo module, shutdown hooks, filtro de exceção global (APP_FILTER), pipes zod, assincronismo, chamadas externas, dependências com pnpm e imports ESM com .js. Use ao criar ou alterar controller, service, módulo, provider, pipe, filtro ou listener de evento, ao mexer em main.ts, em package.json de pacote ou em config/logger, ou quando surgir dúvida de "como faço isso no Nest aqui".
---

# NestJS no Nexo

O backend é ESM puro (`"type": "module"`). Estes padrões existem para manter os módulos pequenos, testáveis e sem acoplamento escondido. Para fronteiras entre domínios e eventos, use a skill `arquitetura-modular`; para testes, a skill `testes`.

## ESM

- Todo import relativo termina em `.js`, mesmo em arquivo `.ts`: `import { X } from './x.js'`. O Node resolve o arquivo compilado, e sem a extensão o build passa e a execução falha.
- `main.ts` chama `await bootstrap()` no topo do arquivo (top-level await), sem `.catch` solto.
- Não existe `__dirname`; use `import.meta.dirname`.
- Classe injetada pelo construtor é importada como valor, nunca com `import type`: o Nest lê o tipo pelo metadado de decorators e um import apagado quebra a injeção. Para tipos puros, `import type`.

## Módulos e controllers

- Um domínio expõe só o módulo Nest em `src/index.ts`. Providers internos não são exportados.
- Controller valida a entrada, chama o `core` e monta a resposta. Regra de negócio no controller não é testável sem HTTP e vaza para outros pontos de entrada.
- O DTO é derivado do schema zod de `@nexo/contracts`, validado por `ZodValidationPipe` de `@nexo/shared/http`, para o contrato do `web` e do backend ter uma única fonte.

```ts
@Post()
open(
  @Body(new ZodValidationPipe(openTicketSchema)) body: OpenTicketRequest,
  @Session() session: SessionData,
): Promise<TicketResponse> {
  return this.openTicket.execute({ requesterId: session.userId, ...body });
}
```

## Injeção por token

Interfaces somem em runtime, então porta e API pública são injetadas por um token. O token e a interface ficam em `@nexo/contracts` (sem dependência de framework); o módulo do provedor liga os dois.

```ts
@Global()
@Module({
  providers: [{ provide: TICKETS_API, useClass: TicketsService }],
  exports: [TICKETS_API],
})
export class TicketsModule {}
```

```ts
constructor(@Inject(TICKETS_API) private readonly tickets: TicketsApi) {}
```

- `useClass` para implementação própria, `useValue` para fake ou constante, `useExisting` para apontar o token para um provider já registrado, `useFactory` quando precisa de `inject`.
- Em testes, `overrideProvider(TOKEN).useValue(fake)` troca só a borda (veja `testes`).

## Configuração

- Variáveis de ambiente passam só por `@nexo/shared/config`: `AppConfig.get('CHAVE')`, tipado pelo schema zod em `env.schema.ts`. Ler `process.env` em outro lugar contorna a validação e espalha chaves sem tipo.
- A validação roda no `ConfigModule.forRoot({ validate })`, antes de a porta HTTP abrir; faltou variável, o processo não sobe.
- Nada de portas, URLs ou credenciais fixas no código. Acrescente toda variável nova ao `env.schema.ts` e ao `.env.example`.

## Logging

- Use `PinoLogger` de `@nexo/shared/logger`. O módulo de logger configura `renameContext: 'module'`, então o contexto do logger vira o campo `module` em cada linha.
- Defina o contexto com o nome do domínio, para filtrar logs por módulo.

```ts
constructor(private readonly logger: PinoLogger) {
  this.logger.setContext('tickets');
}
```

- Inclua contexto útil (rota, duração, id da conversa), sem segredos nem dados pessoais desnecessários. `console.log` só dentro de adaptador, e o lint bloqueia no resto.

## Erros

- Lance a exceção quando a camada não tem contexto para tratá-la. O filtro global converte em `ApiError` de `@nexo/contracts`.
- O filtro é `ApiExceptionFilter` de `@nexo/shared/http`, registrado como `{ provide: APP_FILTER, useClass: ApiExceptionFilter }` em `monolith.module.ts`. `APP_FILTER` dá injeção de dependência ao filtro e vale globalmente, em qualquer módulo que o declare.
- Erro 5xx volta como mensagem genérica, sem stack. Um teste que monta só um módulo de domínio não herda o `APP_FILTER` da app: registre o filtro no teste.

## Ciclo de vida

- `app.enableShutdownHooks()` no `main.ts`: sem ele, SIGTERM não dispara `onModuleDestroy` nem `onApplicationShutdown`.
- Recursos (banco, filas, clientes) fecham em `onModuleDestroy` ou `onApplicationShutdown`, e o fechamento é idempotente, porque o hook pode rodar mais de uma vez.

## Assincronismo e chamadas externas

- Use `async/await` e tipe com `Promise<T>`. Sem callbacks aninhados.
- Não bloqueie o event loop na requisição: nada de `readFileSync`, `execSync` ou laços longos. Cálculo pesado vai para `worker_threads`, processo separado ou fila, com limites de tamanho, tempo e concorrência.
- Chamada a serviço externo (modelo, sistema de chamados legado) leva timeout e nova tentativa limitada com espera. O legado fica indisponível por alguns segundos de vez em quando.

## Dependências

- Gerenciador: **pnpm**, na raiz do workspace. Sem `npm install`, `yarn` ou lock file concorrente; versione o `pnpm-lock.yaml` e nunca o apague para resolver conflito.
- Adicione a dependência no pacote que a usa: `pnpm --filter @nexo/<pacote> add <lib>`; ferramenta do workspace: `pnpm add -Dw <lib>`.
- Pacotes do workspace usam `workspace:*`. Em CI, `pnpm install --frozen-lockfile`.
- Os pacotes exportam `dist/`; depois de alterar `contracts` ou `shared`, rode `pnpm build` (o Turborepo já faz `^build` antes de typecheck, lint e test).

## Ciclos

Dependências apontam em uma direção: `apps → domínios → contracts/shared`; no domínio, `http → core ← persistence`. Confirme que o novo import não cria ciclo, direto ou indireto (`import/no-cycle` no lint, `pnpm check:boundaries` entre pacotes). Para quebrar um ciclo, extraia o contrato para `@nexo/contracts` ou componha na app.
