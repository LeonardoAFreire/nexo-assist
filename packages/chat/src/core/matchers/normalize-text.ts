const DIACRITICS = /\p{M}/gu;
const COMMAS = /,/g;
const TRAILING_EXCLAMATIONS_AND_DOTS = /[!.\s]+$/;
const WHITESPACE = /\s+/g;

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(COMMAS, ' ')
    .replace(TRAILING_EXCLAMATIONS_AND_DOTS, '')
    .replace(WHITESPACE, ' ')
    .trim();
}
