import { normalizeText } from './normalize-text.js';

const CONFIRMATION_PHRASES: ReadonlySet<string> = new Set([
  'sim',
  'sim pode',
  'sim confirmo',
  'sim confirmar',
  'confirmo',
  'confirmar',
  'confirmado',
  'pode sim',
  'pode confirmar',
  'pode abrir',
  'pode abrir o chamado',
  'sim pode abrir',
  'pode criar',
  'pode criar o chamado',
  'sim pode criar',
  'pode atualizar',
  'pode atualizar o chamado',
  'pode adicionar',
  'pode reabrir',
  'pode reabrir o chamado',
  'isso mesmo',
  'isso mesmo pode abrir',
]);

export class ConfirmationMatcher {
  matches(text: string): boolean {
    return CONFIRMATION_PHRASES.has(normalizeText(text));
  }
}
