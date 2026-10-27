import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PasswordVisibilityToggleProps = {
  isVisible: boolean;
  onToggle: () => void;
};

export function PasswordVisibilityToggle({ isVisible, onToggle }: PasswordVisibilityToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={isVisible}
      onClick={onToggle}
      className="size-[30px] rounded-[6px] text-ink-3 [&_svg]:size-4"
    >
      {isVisible ? <EyeOff /> : <Eye />}
    </Button>
  );
}
