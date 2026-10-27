import { Navigate } from 'react-router';
import { homePathFor } from '@/lib/routes';
import { LoginHero } from '../components/login-hero.js';
import { SignInPanel } from '../components/sign-in-panel.js';
import { useSession } from '../hooks/use-session.js';

export function LoginPage() {
  const { data: user } = useSession();
  if (user) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return (
    <main className="flex min-h-screen bg-paper">
      <LoginHero />
      <SignInPanel />
    </main>
  );
}
