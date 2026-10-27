const MIN_TOKEN_LENGTH = 3;
const MIN_SHARED_TOKENS = 2;
const DIACRITICS = /\p{Diacritic}/gu;
const NON_ALPHANUMERIC = /[^a-z0-9]+/;

const STOPWORDS = new Set([
  'nao',
  'com',
  'para',
  'por',
  'uma',
  'uns',
  'que',
  'esta',
  'esse',
  'isso',
  'meu',
  'minha',
  'dos',
  'das',
  'nos',
  'nas',
  'mais',
  'muito',
  'estou',
  'tenho',
  'consigo',
]);

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
}

export function significantTokens(text: string): Set<string> {
  const tokens = normalizeText(text)
    .split(NON_ALPHANUMERIC)
    .filter((token: string) => token.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(token));
  return new Set(tokens);
}

export function areTextsSimilar(first: string, second: string): boolean {
  const secondTokens = significantTokens(second);
  const shared = [...significantTokens(first)].filter((token: string) => secondTokens.has(token));
  return shared.length >= MIN_SHARED_TOKENS;
}
