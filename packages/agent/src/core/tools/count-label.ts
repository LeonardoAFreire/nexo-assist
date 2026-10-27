const SINGULAR_COUNT = 1;

export type CountWords = {
  none: string;
  one: string;
  many: string;
};

export function countLabel(count: number, words: CountWords): string {
  if (count === 0) {
    return words.none;
  }
  return count === SINGULAR_COUNT ? `1 ${words.one}` : `${count} ${words.many}`;
}
