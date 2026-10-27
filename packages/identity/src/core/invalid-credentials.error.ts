export const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha incorretos.';

export class InvalidCredentialsError extends Error {
  constructor() {
    super(INVALID_CREDENTIALS_MESSAGE);
    this.name = 'InvalidCredentialsError';
  }
}
