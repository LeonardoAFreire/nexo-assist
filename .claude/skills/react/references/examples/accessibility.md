# Exemplos de acessibilidade

## Mensagem de carregamento

```tsx
function LoadingMessage() {
  return (
    <output aria-live="polite" aria-busy="true">
      Consultando a API...
    </output>
  )
}
```
