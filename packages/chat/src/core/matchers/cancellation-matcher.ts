import { normalizeText } from './normalize-text.js';

const CANCELLATION_PHRASES: ReadonlySet<string> = new Set([
  'nao',
  'nao quero',
  'nao precisa',
  'nao abre',
  'nao abrir',
  'cancelar',
  'cancela',
  'cancelado',
  'pode cancelar',
  'quero cancelar',
  'desisto',
  'esquece',
  'deixa pra la',
  'deixa para la',
]);

export class CancellationMatcher {
  matches(text: string): boolean {
    return CANCELLATION_PHRASES.has(normalizeText(text));
  }
}
