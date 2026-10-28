const REVEAL = 'motion-safe:animate-rise';

function AgentReplyPreview() {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={`flex gap-1.5 text-[12.5px] ${REVEAL} [--rise-delay:1100ms]`}>
        <span className="font-semibold text-white/80">Nexo Assist</span>
        <span className="text-white/45">consultou seus chamados · criou um chamado</span>
      </p>
      <p
        className={`w-[380px] rounded-[4px_12px_12px_12px] bg-white/8 px-3.5 py-2.5 text-[13.5px] ${REVEAL} [--rise-delay:1500ms]`}
      >
        Pronto: abri o chamado com prioridade alta. Um analista fala com você em até 4 h úteis.
      </p>
      <p
        className={`flex w-fit items-center gap-2 rounded-xl bg-paper px-3 py-[7px] text-[12.5px] ${REVEAL} [--rise-delay:2100ms]`}
      >
        <span className="size-[7px] rounded-full bg-warning" />
        <span className="font-semibold text-ink">INC-20517</span>
        <span className="text-ink-3">Rede e VPN · Alta · em até 4 h</span>
      </p>
    </div>
  );
}

export function ConversationPreview() {
  return (
    <div
      aria-hidden="true"
      className="ml-24 flex w-[500px] flex-col gap-2.5 rounded-2xl border border-white/8 bg-white/4 p-[18px]"
    >
      <div className={`flex justify-end ${REVEAL} [--rise-delay:350ms]`}>
        <p className="rounded-[12px_12px_4px_12px] bg-paper px-3.5 py-[9px] text-[13.5px] text-ink">
          Meu notebook não conecta na VPN. Erro 809.
        </p>
      </div>
      <AgentReplyPreview />
    </div>
  );
}
