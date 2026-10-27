import { Global, Module } from '@nestjs/common';
import { KNOWLEDGE_API } from '@nexo/contracts';
import { ARTICLE_REPOSITORY, type ArticleRepository } from './core/article-repository.js';
import { KnowledgeService } from './core/knowledge.service.js';
import { SearchArticles } from './core/search-articles.js';
import { ArticleSeeder } from './persistence/article.seeder.js';
import { DrizzleArticleRepository } from './persistence/drizzle-article.repository.js';
import { KnowledgeMigrator } from './persistence/knowledge.migrator.js';

@Global()
@Module({
  providers: [
    KnowledgeMigrator,
    ArticleSeeder,
    { provide: ARTICLE_REPOSITORY, useClass: DrizzleArticleRepository },
    {
      provide: KNOWLEDGE_API,
      inject: [ARTICLE_REPOSITORY],
      useFactory: (articles: ArticleRepository) =>
        new KnowledgeService(new SearchArticles(articles), articles),
    },
  ],
  exports: [KNOWLEDGE_API],
})
export class KnowledgeModule {}
