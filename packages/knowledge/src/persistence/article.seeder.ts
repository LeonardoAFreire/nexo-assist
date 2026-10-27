import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { AppConfig } from '@nexo/shared/config';
import { ARTICLE_REPOSITORY, type ArticleRepository } from '../core/article-repository.js';
import { seedArticles } from './seed/seed-articles.js';

@Injectable()
export class ArticleSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly config: AppConfig,
    @Inject(ARTICLE_REPOSITORY) private readonly articles: ArticleRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get('SEED_DEMO_DATA')) {
      return;
    }
    if ((await this.articles.count()) > 0) {
      return;
    }
    await this.articles.insertMany(seedArticles);
  }
}
