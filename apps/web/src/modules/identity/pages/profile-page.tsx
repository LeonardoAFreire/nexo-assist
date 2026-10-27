import { PasswordCard } from '../components/password-card.js';
import { ProfileCard } from '../components/profile-card.js';
import { useSession } from '../hooks/use-session.js';

export function ProfilePage() {
  const { data: user } = useSession();
  if (!user) {
    return null;
  }
  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-8 px-10 py-12">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Meu perfil</h1>
        <p className="text-[14.5px] text-ink-3">Seus dados de acesso ao service desk de TI.</p>
      </header>
      <ProfileCard name={user.name} email={user.email} />
      <PasswordCard email={user.email} />
    </div>
  );
}
