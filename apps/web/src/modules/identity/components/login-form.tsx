import { useLoginForm } from '../hooks/use-login-form.js';
import { LoginHeading } from './login-heading.js';
import { LoginSubmitButton } from './login-submit-button.js';
import { PasswordField } from './password-field.js';
import { RememberField } from './remember-field.js';
import { TextField } from './text-field.js';

export function LoginForm() {
  const form = useLoginForm();
  return (
    <form onSubmit={form.submit} className="flex flex-col gap-7" aria-busy={form.isPending}>
      <LoginHeading />
      <div className="flex flex-col gap-[18px]">
        <TextField label="E-mail corporativo" value={form.email} onChange={form.setEmail} />
        <PasswordField value={form.password} onChange={form.setPassword} />
        <RememberField checked={form.remember} onChange={form.setRemember} />
      </div>
      {form.errorMessage && (
        <p role="alert" className="text-[13.5px] font-medium text-destructive">
          {form.errorMessage}
        </p>
      )}
      <LoginSubmitButton isPending={form.isPending} />
    </form>
  );
}
