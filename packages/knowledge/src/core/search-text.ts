const COMBINING_MARKS = /\p{M}/gu;
const WORD_PATTERN = /[a-z0-9]+/g;
const OR_OPERATOR = 'or';

export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(COMBINING_MARKS, '');
}

export function buildSearchQuery(rawQuery: string): string {
  const words = removeAccents(rawQuery.toLowerCase()).match(WORD_PATTERN) ?? [];
  const searchableWords = words.filter((word: string) => word !== OR_OPERATOR);
  return [...new Set(searchableWords)].join(` ${OR_OPERATOR} `);
}
