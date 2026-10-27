import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './app-config.service.js';
import { type Env, envSchema } from './env.schema.js';

const ENV_FILE_PATHS = ['.env', '../../.env'];

function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Variáveis de ambiente inválidas: ${fields}`);
  }
  return result.data;
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ validate: validateEnv, cache: true, envFilePath: ENV_FILE_PATHS }),
  ],
  providers: [AppConfig],
  exports: [AppConfig],
})
export class NexoConfigModule {}
