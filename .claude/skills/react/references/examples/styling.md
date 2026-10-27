# Exemplos de estilização

## Componente do shadcn/ui com Tailwind

```tsx
import { Button } from '@/components/ui/button'

<Button type="button" variant="outline" aria-label="Atualizar chamados" onClick={onRefresh}>
  Atualizar
</Button>
```

## Classes condicionais com `cn()`

```tsx
import { cn } from '@/lib/utils'

<span className={cn('rounded-md px-2 py-1 text-sm', overdue && 'bg-destructive text-destructive-foreground')}>
  {label}
</span>
```
