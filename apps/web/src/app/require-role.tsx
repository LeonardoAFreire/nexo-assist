import type { UserRole } from '@nexo/contracts';
import { Navigate, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { homePathFor, routePaths } from '@/lib/routes';
import { useSession } from '@/modules/identity';

type RequireRoleProps = {
  roles: readonly UserRole[];
};

export function RequireRole({ roles }: RequireRoleProps) {
  const { data: user, isPending, isError, refetch } = useSession();
  if (isPending) {
    return (
      <output aria-busy="true" className="flex min-h-screen items-center justify-center text-ink-3">
        Carregando...
      </output>
    );
  }
  if (isError) {
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-ink-2">Não foi possível verificar sua sessão.</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (!user) {
    return <Navigate to={routePaths.login} replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <Outlet />;
}
