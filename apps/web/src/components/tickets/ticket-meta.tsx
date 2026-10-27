type TicketMetaProps = {
  term: string;
  value: string;
};

export function TicketMeta({ term, value }: TicketMetaProps) {
  return (
    <div className="flex gap-1.5 text-xs">
      <dt className="text-ink-3">{term}:</dt>
      <dd className="font-medium text-ink-2">{value}</dd>
    </div>
  );
}
