import { describe, expect, it } from 'vitest';
import { CancellationMatcher } from './cancellation-matcher.js';
import { ConfirmationMatcher } from './confirmation-matcher.js';

describe('ConfirmationMatcher', () => {
  const matcher = new ConfirmationMatcher();

  it.each([
    'sim',
    'Sim!',
    '  SIM  ',
    'Pode abrir!',
    'pode abrir o chamado.',
    'confirmo',
    'Confirmar',
    'Sim, pode abrir',
    'pode criar',
    'pode reabrir',
  ])('reconhece "%s" como confirmação', (text) => {
    expect(matcher.matches(text)).toBe(true);
  });

  it.each([
    'sim, mas troca a categoria',
    'talvez',
    'ok?',
    'sim?',
    'não',
    'será que pode abrir?',
    'pode abrir depois de eu revisar',
    '',
    'minha vpn não conecta',
  ])('recusa "%s" como confirmação', (text) => {
    expect(matcher.matches(text)).toBe(false);
  });
});

describe('CancellationMatcher', () => {
  const matcher = new CancellationMatcher();

  it.each(['não', 'Não!', 'cancelar', 'Cancela', 'deixa pra lá', 'não quero', 'desisto'])(
    'reconhece "%s" como cancelamento',
    (text) => {
      expect(matcher.matches(text)).toBe(true);
    },
  );

  it.each(['sim', 'não, mas muda o título', 'talvez', 'não sei', 'preciso de ajuda'])(
    'recusa "%s" como cancelamento',
    (text) => {
      expect(matcher.matches(text)).toBe(false);
    },
  );
});
