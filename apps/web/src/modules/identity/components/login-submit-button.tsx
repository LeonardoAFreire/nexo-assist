import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LoginSubmitButtonProps = {
  isPending: boolean;
};

export function LoginSubmitButton({ isPending }: LoginSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="h-11 w-full gap-2 rounded-lg bg-cta text-[15.5px] font-semibold text-white shadow-[0_1px_2px_#0062c433,0_6px_16px_#0062c426] hover:bg-cta/90"
    >
      {isPending ? 'Entrando...' : 'Entrar'}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
}
