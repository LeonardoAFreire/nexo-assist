import { Inject, Injectable } from '@nestjs/common';
import { ticketCategorySchema } from '@nexo/contracts';
import { DATABASE, type Database } from '@nexo/shared/database';
import { eq, sql } from 'drizzle-orm';
import type { Article } from '../core/article.js';
import type { ArticleRepository } from '../core/article-repository.js';
import { articlesTable } from './articles.table.js';

const SEARCH_LANGUAGE = 'portuguese';

type ArticleRow = typeof articlesTable.$inferSelect;

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    conditions: row.conditions,
    category: ticketCategorySchema.parse(row.category),
  };
}

@Injectable()
export class DrizzleArticleRepository implements ArticleRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async search(input: { query: string; limit: number }): Promise<Article[]> {
    const tsQuery = sql`websearch_to_tsquery(${SEARCH_LANGUAGE}::regconfig, ${input.query})`;
    const rows = await this.database
      .select()
      .from(articlesTable)
      .where(sql`${articlesTable.searchVector} @@ ${tsQuery}`)
      .orderBy(sql`ts_rank(${articlesTable.searchVector}, ${tsQuery}) desc`, articlesTable.id)
      .limit(input.limit);
    return rows.map(toArticle);
  }

  async findById(articleId: string): Promise<Article | null> {
    const rows = await this.database
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, articleId))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : toArticle(row);
  }

  async count(): Promise<number> {
    const rows = await this.database
      .select({ total: sql<number>`count(*)::int` })
      .from(articlesTable);
    return rows[0]?.total ?? 0;
  }

  async insertMany(articles: Article[]): Promise<void> {
    await this.database.insert(articlesTable).values(articles);
  }
}
