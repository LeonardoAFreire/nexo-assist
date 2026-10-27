export type Deadline = {
  signal: AbortSignal;
  expired: Promise<never>;
  cancel(): void;
};

export function startDeadline(timeoutMs: number, createError: () => Error): Deadline {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = createError();
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  expired.catch(() => undefined);
  return { signal: controller.signal, expired, cancel: () => clearTimeout(timer) };
}
