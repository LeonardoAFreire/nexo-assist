import type { ArticleExcerpt, KnowledgeApi } from '@nexo/contracts';

const COMBINING_MARKS = /\p{M}/gu;
const WORD_PATTERN = /[a-z0-9]+/g;
const STEM_LENGTH = 5;
const MIN_WORD_LENGTH = 2;
const STOPWORDS = new Set([
  'a',
  'ao',
  'aos',
  'as',
  'com',
  'como',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'eu',
  'em',
  'esta',
  'esse',
  'essa',
  'meu',
  'minha',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'pela',
  'pelo',
  'por',
  'qual',
  'quais',
  'que',
  'se',
  'um',
  'uma',
  'voce',
  'vai',
  'foi',
]);

type Ranked = { article: ArticleExcerpt; score: number };

function stemsOf(text: string): Set<string> {
  const plain = text.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
  const words = plain.match(WORD_PATTERN) ?? [];
  const meaningful = words.filter((word) => word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word));
  return new Set(meaningful.map((word) => word.slice(0, STEM_LENGTH)));
}

function scoreOf(queryStems: Set<string>, article: ArticleExcerpt): number {
  const articleStems = stemsOf(`${article.title} ${article.excerpt}`);
  return [...queryStems].filter((stem) => articleStems.has(stem)).length;
}

function byRelevance(first: Ranked, second: Ranked): number {
  return second.score - first.score || first.article.id.localeCompare(second.article.id);
}

export class EvalKnowledgeApi implements KnowledgeApi {
  constructor(private readonly articles: ArticleExcerpt[]) {}

  async search(input: Parameters<KnowledgeApi['search']>[0]): Promise<ArticleExcerpt[]> {
    const queryStems = stemsOf(input.query);
    return this.articles
      .map((article) => ({ article, score: scoreOf(queryStems, article) }))
      .filter((ranked) => ranked.score > 0)
      .sort(byRelevance)
      .slice(0, input.limit)
      .map((ranked) => ranked.article);
  }

  async get(input: Parameters<KnowledgeApi['get']>[0]): Promise<ArticleExcerpt | null> {
    return this.articles.find((article) => article.id === input.articleId) ?? null;
  }
}
