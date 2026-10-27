import { Button } from '@/components/ui/button';
import { useApiHealth } from './use-api-health';

export function StatusPage() {
  const { data, isPending, isError, refetch } = useApiHealth();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Nexo Assist</h1>
      <output aria-live="polite" aria-busy={isPending}>
        {isPending && 'Consultando a API...'}
        {isError && 'API indisponível.'}
        {data && 'API online.'}
      </output>
      <Button type="button" variant="outline" onClick={() => refetch()}>
        Verificar novamente
      </Button>
    </main>
  );
}
