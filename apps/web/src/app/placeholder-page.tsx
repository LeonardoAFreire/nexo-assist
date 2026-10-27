type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="text-[14.5px] text-ink-3">Esta tela estará disponível em breve.</p>
    </section>
  );
}
