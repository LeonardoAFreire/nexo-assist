import { KeyRound, Mail, RotateCcwKey } from 'lucide-react';
import { CARD_SURFACE_CLASS } from '@/components/tickets/card-shell';
import { Button } from '@/components/ui/button';

type PasswordCardProps = {
  email: string;
};

function PasswordRow() {
  return (
    <div className="flex items-center gap-4 p-6">
      <span className="flex size-10 items-center justify-center rounded-full bg-desk text-ink-2">
        <KeyRound aria-hidden="true" className="size-[18px]" />
      </span>
      <div className="flex flex-1 flex-col gap-[3px]">
        <h2 id="password-title" className="text-[14.5px] font-semibold text-ink">
          Senha
        </h2>
        <p className="text-[13.5px] text-ink-3">Mesma senha da rede Nexo</p>
      </div>
      <Button type="button" variant="outline" disabled className="h-9 rounded-lg px-3.5">
        <RotateCcwKey aria-hidden="true" />
        Redefinir senha
      </Button>
    </div>
  );
}

export function PasswordCard({ email }: PasswordCardProps) {
  return (
    <section aria-labelledby="password-title" className={CARD_SURFACE_CLASS}>
      <PasswordRow />
      <p className="flex items-center gap-2 border-t border-rule bg-desk px-6 py-3 text-[13px] text-ink-3">
        <Mail aria-hidden="true" className="size-3.5" />
        Enviaremos um link de redefinição para {email}.
      </p>
    </section>
  );
}
