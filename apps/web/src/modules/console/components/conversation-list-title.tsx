export function ConversationListTitle() {
  return (
    <div className="flex items-center gap-2">
      <h1 className="flex-1 text-xl font-bold tracking-[-0.015em] text-ink">Conversas</h1>
      <p className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-[5px] text-[12.5px] font-semibold text-success-text">
        <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
        Disponível
      </p>
    </div>
  );
}
