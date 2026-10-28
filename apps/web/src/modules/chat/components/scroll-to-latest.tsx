import { ArrowDown } from 'lucide-react';

type ScrollToLatestProps = {
  visible: boolean;
  onClick: () => void;
};

export function ScrollToLatest({ visible, onClick }: ScrollToLatestProps) {
  if (!visible) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-[0_4px_14px_rgba(27,36,49,0.10)] outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
    >
      <ArrowDown aria-hidden="true" className="size-3.5" />
      Ir para a última mensagem
    </button>
  );
}
