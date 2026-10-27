const DOT_DELAYS = ['0ms', '150ms', '300ms'];

export function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-1">
      <span className="sr-only">Nexo Assist está digitando</span>
      {DOT_DELAYS.map((delay: string) => (
        <span
          key={delay}
          aria-hidden="true"
          style={{ animationDelay: delay }}
          className="size-1.5 rounded-full bg-ink-3 motion-safe:animate-pulse"
        />
      ))}
    </span>
  );
}
