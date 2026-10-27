---
name: arquitetura-modular
description: Como construir e evoluir o monólito modular do Nexo Assist sem quebrar as fronteiras entre domínios. Cobre como um módulo chama outro (interface e token em @nexo/contracts, módulo @Global() do provedor), eventos de domínio (<módulo>.<entidade>.<ação>), a estrutura interna de um domínio (http, core, persistence), o checklist para criar um novo domínio e como promover um módulo a app dedicada. Use ao criar domínio ou pacote, ao fazer um domínio consumir outro, ao definir interface pública, token ou evento, ao ver erro de pnpm check:boundaries ou import entre domínios, ou ao discutir separar um módulo em serviço.
---

# Arquitetura modular: como fazer

As invariantes (tags, quem pode depender de quem) estão em `.claude/rules/modular-architecture.md` e são carregadas sempre. Esta skill traz o procedimento. A ideia que sustenta tudo: fronteira lógica (módulo no código) é separada de fronteira física (app que sobe em produção). Se o único acoplamento entre dois módulos é um contrato em `@nexo/contracts`, trocar a implementação local por uma remota não exige refatorar quem consome.

## Escolha como os módulos conversam

| Preciso de | Use | Porque |
| ---------- | --- | ------ |
| A resposta do outro módulo | Interface + token (chamada local) | Retorno tipado, e o provedor pode virar HTTP depois |
| Avisar que algo aconteceu | Evento | Quem publica não conhece quem escuta |
| Falar entre processos ou com o `web` | HTTP com schemas zod de `@nexo/contracts` | Contrato validado nas duas pontas |

Prefira evento quando o chamador não precisa da resposta.

## Chamada local: interface, token e módulo global

1. Declare a interface e o token em `@nexo/contracts`. O token é um `Symbol`, porque `contracts` não depende de framework.
2. No domínio provedor, ligue o token à implementação em um módulo `@Global()` que exporta só o token. Nada mais do provedor fica visível.
3. O consumidor injeta pelo token e nunca importa o pacote do provedor.

```ts
export const TICKETS_API = Symbol('TICKETS_API');

export interface TicketsApi {
  findOwn(input: { ticketId: string; requesterId: string }): Promise<TicketSummary | null>;
}
```

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

`@Global()` evita que o consumidor importe `TicketsModule` (o que criaria dependência de pacote). O custo é que qualquer módulo enxerga o token; por isso o contrato fica pequeno e orientado ao que os consumidores precisam, não ao modelo interno do provedor. Nunca exponha entidade ou repositório pelo contrato: devolva tipos de `contracts`.

## Eventos

- Nome `<módulo>.<entidade>.<ação>`, minúsculas e ponto: `chat.conversation.handed-off`. O wildcard do emitter usa o ponto como separador, então `@OnEvent('chat.conversation.*')` funciona.
- O tipo do evento (`DomainEvent<Nome, Payload>`) e o payload ficam em `@nexo/contracts/events.ts`.
- Publique com `EventPublisher` de `@nexo/shared/events`; escute com `OnEvent` exportado do mesmo subpath, para o domínio não depender de `@nestjs/event-emitter`.
- O `EventPublisher` usa `emitAsync`: ele espera os listeners, e um listener que lança rejeita a publicação. Trate o erro dentro do listener se a falha dele não deve derrubar quem publicou.

```ts
await this.events.publish({
  name: 'chat.conversation.handed-off',
  occurredAt: this.clock.now().toISOString(),
  payload: { conversationId },
});
```

## Estrutura de um domínio

```text
packages/<domínio>/src/
├── index.ts            # exporta só <domínio>.module
├── <domínio>.module.ts
├── core/               # entidades, regras, casos de uso e portas; sem HTTP nem banco
├── persistence/        # repositórios que implementam as portas do core
└── http/               # controllers e DTOs
```

`http → core ← persistence`: o `core` define as portas e não importa as outras pastas. Submódulos dentro de um domínio podem compartilhar entidades e repositórios, não services nem lógica de aplicação.

## Quando ler as referências

- Criar um domínio novo: [references/novo-dominio.md](references/novo-dominio.md), com o checklist passo a passo.
- Promover um módulo a app dedicada: [references/promover-para-app.md](references/promover-para-app.md). Só com motivo concreto (escala, equipe, falha isolada).

## Falhas e observabilidade

Todo log leva o campo `module` com o domínio de origem (veja a skill `nestjs`). Chamadas a sistemas externos têm timeout, limite de tentativas e degradação definida, para a falha de um módulo não derrubar os demais.

## Quando `check:boundaries` falha

A mensagem diz qual pacote depende de qual. Não "resolva" movendo código para `shared`: se dois domínios precisam da mesma regra de negócio, a fronteira está errada. Extraia um contrato para `@nexo/contracts` (interface + token ou evento) e remova a dependência do `package.json`.
