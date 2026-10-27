export class AttemptTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`A tentativa excedeu o limite de ${timeoutMs} ms`);
    this.name = 'AttemptTimeoutError';
  }
}
