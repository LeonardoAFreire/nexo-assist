# Criar um novo domínio

Copie a forma de um domínio existente (por exemplo `packages/tickets`) em vez de inventar. Substitua `<d>` pelo nome em kebab-case.

## Checklist

1. **Pasta e estrutura:** `packages/<d>/src/{core,persistence,http}/`, `src/<d>.module.ts` e `src/index.ts`.
2. **`package.json`:** nome `@nexo/<d>`, `"type": "module"`, `exports` apontando para `dist`, os scripts (`build`, `dev`, `typecheck`, `lint`, `test`) iguais aos dos outros domínios, dependências só em `@nexo/contracts` e `@nexo/shared` (`workspace:*`) e a tag obrigatória:

   ```json
   "nexo": { "tag": "domain:<d>" }
   ```

   Sem `nexo.tag` o `pnpm check:boundaries` falha, porque é ele que aplica as regras de dependência.
3. **`tsconfig.json`** estendendo `../../tsconfig.base.json` com `outDir: "dist"`, `rootDir: "src"` e `include: ["src"]`; **`tsconfig.build.json`** estendendo o anterior e excluindo `src/**/*.test.ts` e `src/**/*.test.tsx`.
4. **Módulo Nest** em `<d>.module.ts`. Se outros módulos vão chamá-lo, ele é `@Global()` e exporta só o token da API pública (veja o SKILL.md).
5. **`src/index.ts`** exporta apenas o módulo: `export { <D>Module } from './<d>.module.js';`
6. **Contratos** em `@nexo/contracts`: interface pública, token, schemas zod de DTO e tipos de evento que o domínio publica.
7. **Registrar na app:** em `apps/monolith/package.json` adicione `"@nexo/<d>": "workspace:*"` e em `apps/monolith/src/monolith.module.ts` importe `<D>Module`.
8. **Instalar e validar:** `pnpm install`, depois `pnpm build`, `pnpm typecheck`, `pnpm lint` e `pnpm check:boundaries`.
9. **Testes:** se o pacote tem decorators sob teste, configure `unplugin-swc` no `vitest.config.ts` (veja a skill `testes`).
10. **Documentação:** inclua o pacote na tabela de `.claude/rules/folder-structure.md`.

## Conferências antes de concluir

- O domínio não importa nenhum outro `@nexo/<domínio>` nem declara um no `package.json`.
- Só tabelas próprias: nenhuma consulta a dados de outro domínio; se precisa deles, use a interface pública do outro.
- Todo import relativo termina em `.js`.
- O `index.ts` não exporta entidade, repositório nem service.
