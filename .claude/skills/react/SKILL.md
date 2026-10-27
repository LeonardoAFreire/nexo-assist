---
name: react
description: Padrões para implementar, revisar e refatorar código React 19 com TypeScript em apps/web, incluindo componentes, props, hooks, efeitos, React Query, axios, shadcn/ui, acessibilidade e Tailwind CSS. Use ao trabalhar em arquivos React do frontend, criar ou alterar componentes, hooks e telas, revisar estado e efeitos, ou avaliar a qualidade de uma interface React.
---

# Regras para React

Estas regras se aplicam ao código do frontend (`apps/web`). A organização de pastas está em `.claude/rules/folder-structure.md` e a estratégia de testes na skill `testes`.

## Como usar esta skill

Aplicar estas regras ao criar, alterar ou revisar código React. Carregar os exemplos somente quando forem necessários:

- [Componentes pequenos e props explícitas](references/examples/components.md)
- [Hooks, efeitos e memoização](references/examples/hooks-effects.md)
- [Acesso ao backend com axios e React Query](references/examples/backend.md)
- [Acessibilidade](references/examples/accessibility.md)
- [Estilização com Tailwind e shadcn/ui](references/examples/styling.md)
- [10 boas práticas adicionais de React](references/react-best-practices.md)

## Componentes pequenos e reutilizáveis

- Crie componentes com uma única responsabilidade.
- Não crie componentes com mais de 30 linhas. Extraia partes da interface, regras ou estados para componentes e hooks menores.
- Prefira nomes que expressem o papel do componente, como `ConversationList`, `TicketDraftCard` e `LoadingIndicator`.
- Reutilize componentes para comportamentos e estruturas visuais comuns, evitando duplicação.

Consulte os [exemplos de componentes pequenos e props explícitas](references/examples/components.md).

## Props explícitas

Evite encaminhar props com o spread operator, pois isso esconde a API do componente e pode repassar atributos inesperados. Declare e utilize as propriedades explicitamente.

Consulte os [exemplos de props explícitas](references/examples/components.md).

## Hooks e efeitos

- Prefira componentes funcionais.
- Crie hooks customizados com o prefixo `use`, como `useTickets` ou `useSendMessage`.
- Use `useEffect` somente para sincronizar o React com sistemas externos (assinaturas, timers, APIs do navegador). Dados do servidor vêm do React Query, não de `useEffect`.
- Não use `useEffect` para calcular valores derivados, responder a eventos ou manter estado que pode ser obtido de props e estado existente.

Consulte os [exemplos de hooks, efeitos e memoização](references/examples/hooks-effects.md).

## Memoização

Use `useMemo` somente para evitar cálculos realmente pesados entre re-renders, com todas as dependências declaradas. Não use para operações simples.

## Acesso ao backend

- Chamadas HTTP ficam em `modules/<módulo>/api/` e usam o cliente axios de `src/lib/http.ts` (URL de `VITE_API_URL`, interceptor que converte a resposta de erro em `ApiError`).
- Dados do servidor são lidos com `useQuery` e alterados com `useMutation`, encapsulados em hooks em `modules/<módulo>/hooks/`. Defina as chaves de query em uma fábrica por módulo.
- Não copie dados do React Query para `useState`. Invalide ou atualize o cache após uma mutação.
- Tipos e schemas de resposta vêm de `@nexo/contracts`.
- Componentes e páginas não importam axios nem chamam o backend; consomem os hooks e cuidam só de apresentação e interação.
- Trate `isPending`, `isError` e dados vazios em toda tela, com ação de nova tentativa no erro.

Consulte os [exemplos de acesso ao backend](references/examples/backend.md).

## Acessibilidade

- Prefira elementos semânticos (`button`, `nav`, `main`, `section`, `form`) e complemente com `aria-label`, `aria-live`, `aria-busy`, `aria-expanded` ou `aria-pressed` quando aplicável.
- Controles interativos indicam seu estado e têm nome acessível. Mensagens assíncronas, de carregamento e de erro são anunciadas (`<output>` para status, `role="alert"` para erro).
- As respostas do chat chegam em uma região `aria-live="polite"`.
- Os componentes do shadcn/ui (Radix) já tratam foco e teclado; não os sobrescreva.

Consulte os [exemplos de acessibilidade](references/examples/accessibility.md).

## Estilização

- Use Tailwind CSS e os componentes do shadcn/ui em `src/components/ui`. Adicione componentes com `pnpm dlx shadcn@latest add <componente>` dentro de `apps/web`.
- Compose classes com `cn()` de `src/lib/utils.ts`. Use as variáveis de tema do shadcn (`bg-background`, `text-muted-foreground`) em vez de cores fixas.
- Siga o protótipo em `docs/nexo/nexo.pen` para layout e estilo.
- Evite CSS inline e folhas de estilo específicas. Garanta estados de foco, hover, disabled e responsividade.

Consulte os [exemplos de estilização](references/examples/styling.md).

## Boas práticas adicionais

Aplicar também as [10 boas práticas adicionais de React](references/react-best-practices.md).
