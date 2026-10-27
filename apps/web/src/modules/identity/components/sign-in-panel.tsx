import { LoginForm } from './login-form.js';

export function SignInPanel() {
  return (
    <div className="flex flex-1 flex-col justify-between px-14 py-10">
      <p className="flex justify-end gap-1.5 text-[13.5px] text-ink-3">
        Problema para entrar?
        <span className="font-semibold text-primary-text">Ligue no ramal 4000</span>
      </p>
      <div className="mx-auto w-full max-w-[380px]">
        <LoginForm />
      </div>
      <footer className="flex justify-between text-[12.5px] text-ink-3">
        <span>© 2026 Nexo · Service desk de TI</span>
        <span>Privacidade e uso de dados</span>
      </footer>
    </div>
  );
}
