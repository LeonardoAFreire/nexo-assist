import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema.js';

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<TKey extends keyof Env>(key: TKey): Env[TKey] {
    return this.config.get(key, { infer: true });
  }
}
