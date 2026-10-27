export class CorruptedRecordError extends Error {
  constructor(origin: string, cause: unknown) {
    super(`Registro corrompido em ${origin}: o conteúdo gravado não segue o contrato.`, { cause });
    this.name = 'CorruptedRecordError';
  }
}
