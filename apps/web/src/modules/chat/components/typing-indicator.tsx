const DOT_DELAYS = ['[--typing-delay:0ms]', '[--typing-delay:140ms]', '[--typing-delay:280ms]'];

export function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-1">
      <span className="sr-only">Nexo Assist está digitando</span>
      {DOT_DELAYS.map((delay: string) => (
        <span
          key={delay}
          aria-hidden="true"
          className={`size-1.5 rounded-full bg-ink-3 motion-safe:animate-typing ${delay}`}
        />
      ))}
    </span>
  );
}
