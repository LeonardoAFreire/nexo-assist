const ARTICLE_NOT_SEARCHED_MESSAGE = 'O artigo não veio de uma busca feita neste turno.';

export class ArticleNotSearchedError extends Error {
  constructor(options?: ErrorOptions) {
    super(ARTICLE_NOT_SEARCHED_MESSAGE, options);
    this.name = 'ArticleNotSearchedError';
  }
}
