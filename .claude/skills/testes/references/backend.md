# Testes de backend (NestJS)

## Unitário: regra de `core/`

Teste a regra sem Nest, passando as dependências pelo construtor e usando fakes em memória.

```ts
it('classifica como vencido um chamado alto sem resposta após 4 horas úteis', () => {
  const clock = new FakeClock('2026-03-02T09:00:00Z');
  const ticket = makeTicket({ priority: 'high', createdAt: '2026-03-02T09:00:00Z' });
  clock.advanceBusinessHours(5);

  expect(isOverdue({ ticket, now: clock.now() })).toBe(true);
});
```

## Integração: módulo Nest com HTTP

Suba o módulo real com `Test.createTestingModule`, aplique os mesmos pipes e filtros globais de produção e chame o servidor com `supertest`. Troque só as bordas externas com `overrideProvider`. O `APP_FILTER` mora no `monolith.module.ts`, então um módulo de domínio montado sozinho não o herda: registre o filtro no teste, senão o erro não vira `ApiError`.

```ts
import request from 'supertest';
import { afterAll, beforeAll, it } from 'vitest';

let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [TicketsModule, TestInfraModule] })
    .overrideProvider(LEGACY_TICKET_CLIENT)
    .useValue(new FakeLegacyTicketClient())
    .compile();
  app = moduleRef.createNestApplication();
  app.useGlobalFilters(new ApiExceptionFilter(logger));
  await app.init();
});

afterAll(() => app.close());

it('responde 404 ao consultar chamado de outro funcionário', () =>
  request(app.getHttpServer())
    .get('/tickets/INC-20311')
    .set('Authorization', tokenFor(otherEmployee))
    .expect(404));
```

O backend é ESM: imports relativos terminam em `.js` também nos testes e o Vitest é importado explicitamente (`vi`, `it`, `expect`). Feche a app em `afterAll` para o processo não ficar pendurado.

Pontos que valem teste de integração:

- Privacidade: funcionário B consulta, atualiza ou reabre chamado do funcionário A e recebe a mesma resposta de "não encontrado".
- Validação de entrada: corpo inválido vira `ApiError` com 400, sem stack nem detalhes internos.
- Persistência: grava e lê de um banco real isolado (em memória ou arquivo temporário), nunca do banco de desenvolvimento.
- Contrato entre domínios: o consumidor funciona com o fake do token público (`TicketsApi`) e o provedor satisfaz o mesmo contrato.
- Eventos: publicar `<módulo>.<entidade>.<ação>` aciona o listener esperado.

## Decorators no Vitest

O Vitest usa esbuild, que não emite os metadados de decorators que a injeção de dependência do Nest precisa. Nos pacotes de backend, use `unplugin-swc` (é a receita da documentação do Nest):

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite()],
  test: { include: ['src/**/*.test.ts'] },
});
```

## Cobertura

Configure `coverage.thresholds` apenas com chaves glob para as pastas críticas e não configure limite global. Cada glob **não herda** os limites globais, então declare todos os limites (e `perFile`, se quiser) em cada padrão. Use `coverage.include` para que arquivos nunca importados por um teste apareçam no relatório.

```ts
test: {
  include: ['src/**/*.test.ts'],
  coverage: {
    include: ['src/**/core/**'],
    thresholds: { 'src/**/core/**': { lines: 80, branches: 80 } },
  },
},
```
