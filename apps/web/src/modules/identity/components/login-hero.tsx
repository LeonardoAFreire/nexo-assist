import { NexoMark } from '@/components/nexo-mark';
import { ConversationPreview } from './conversation-preview';
import { HeroStats } from './hero-stats';

export function LoginHero() {
  return (
    <section
      aria-label="Apresentação do Nexo Assist"
      className="hidden flex-col justify-between bg-ink px-16 pt-10 pb-12 text-white lg:flex lg:w-5/9"
    >
      <div className="flex items-center gap-2.5">
        <NexoMark className="-my-0.5 -mr-1 size-7 text-white" />
        <span className="text-[17px] font-bold tracking-tight">Nexo Assist</span>
      </div>
      <div className="flex flex-col gap-9">
        <div className="flex flex-col gap-[18px]">
          <p className="text-[13.5px] font-medium text-white/55">Service desk de TI da Nexo</p>
          <p className="font-display text-[54px] leading-[1.04] tracking-[-0.022em]">
            Seu problema de TI, resolvido em uma conversa.
          </p>
          <p className="max-w-[520px] text-base leading-[1.55] text-white/65">
            Descreva o que está acontecendo. O assistente consulta seus chamados, busca na central
            de ajuda e chama um analista quando precisa.
          </p>
        </div>
        <ConversationPreview />
      </div>
      <HeroStats />
    </section>
  );
}
