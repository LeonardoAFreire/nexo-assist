# Promover um módulo a app dedicada

Faça isso só com motivo concreto: escala diferente, equipe própria ou necessidade de isolar falhas. Cada processo novo custa deploy, observabilidade e latência de rede. A promoção é barata porque os consumidores já falam com o módulo por interface e token (veja o SKILL.md); se algum consumidor importa o pacote do provedor, corrija isso antes.

## Passos

1. **Crie a app** `apps/<módulo>-api` com `"nexo": { "tag": "app" }`, `main.ts` e um módulo raiz que compõe `NexoConfigModule`, `NexoLoggerModule`, o `DatabaseModule` e o módulo do domínio (o mesmo padrão de `apps/monolith`). Apps podem depender de qualquer pacote; sem regra de negócio na app.
2. **Exponha a API pública por HTTP.** Os controllers do domínio atendem o `web`; as operações da interface pública (por exemplo `TicketsApi.findOwn`) precisam de rotas próprias, com request e response definidos por schemas zod em `@nexo/contracts`. A autorização continua no `core`, não na rota.
3. **Escreva o adaptador HTTP** que implementa a mesma interface (`TicketsApi`) chamando essas rotas, com timeout, nova tentativa limitada e a mesma semântica de "não encontrado". Coloque-o na app que compõe (por exemplo `apps/monolith/src/adapters/`), porque nenhum domínio pode depender de outro e `shared` não conhece o contrato de negócio.
4. **Troque o provedor no monólito:** no lugar de importar o `TicketsModule` local, registre um módulo `@Global()` que liga o token ao adaptador:

   ```ts
   @Global()
   @Module({
     providers: [{ provide: TICKETS_API, useClass: HttpTicketsClient }],
     exports: [TICKETS_API],
   })
   export class RemoteTicketsModule {}
   ```

   Nenhum consumidor muda, porque eles só conhecem o token.
5. **Dados:** como cada domínio só acessa as próprias tabelas, mova essas tabelas (ou o banco) para a app nova.
6. **Eventos:** o `EventEmitter` é em memória e não cruza processos. Se um evento do módulo promovido tem listeners em outros processos, decida o transporte (fila ou webhook) antes; o nome e o payload em `@nexo/contracts` não mudam.
7. **Valide:** `pnpm check:boundaries`, os testes de contrato (o consumidor com o fake do token e o adaptador contra o provedor real satisfazem a mesma interface) e o health check das duas apps.
