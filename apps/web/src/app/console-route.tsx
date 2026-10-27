import { ConsolePage } from '@/modules/console';
import { useSession } from '@/modules/identity';

export function ConsoleRoute() {
  const { data: user } = useSession();
  if (!user) {
    return null;
  }
  return <ConsolePage analystId={user.id} />;
}
