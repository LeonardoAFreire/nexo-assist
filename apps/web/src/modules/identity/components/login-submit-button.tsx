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
      className="h-11 w-full rounded-lg bg-cta text-[15.5px] font-semibold text-white hover:bg-cta/90"
    >
      {isPending ? 'Entrando...' : 'Entrar'}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
}
