# Testes de frontend (React)

Ferramentas: Vitest, Testing Library, `user-event` e MSW. O que se testa é o que o usuário percebe.

## Princípios

- Consulte por papel, rótulo ou texto (`getByRole`, `getByLabelText`, `findByText`). Evite classes e estrutura interna: elas mudam sem que o comportamento mude.
- Simule apenas a rede, com MSW. Deixe axios, hooks e React Query reais, para o teste exercitar o caminho completo e achar bug de cache e de transporte.
- Renderize com os mesmos providers da aplicação. Crie um `QueryClient` novo por teste, com `retry: false`: o padrão tenta novamente três vezes com espera, e um teste de erro estoura o timeout.
- Teste estados observáveis: carregando, erro com ação de nova tentativa, vazio e sucesso.
- Não teste componentes do shadcn/ui nem estilos.
- Verifique acessibilidade pelo papel e nome acessível. A varredura completa fica para o QA.

## Helper de render

```tsx
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}
```

## Exemplo

```tsx
it('mostra mensagem com opção de tentar de novo quando a lista de chamados falha', async () => {
  server.use(http.get('*/tickets', () => HttpResponse.json({ error: { code: 'x', message: 'x' } }, { status: 502 })));

  renderWithProviders(<TicketList />);

  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeEnabled();
});
```

## Onde vale a pena

Alto valor: o fluxo do chat (envio, resposta em tempo real, rascunho de chamado e confirmação, limite de mensagens), o console do analista (assumir, devolver, encerrar) e o mapeamento de erros. Baixo valor: páginas só de composição e componentes de apresentação sem estado.
