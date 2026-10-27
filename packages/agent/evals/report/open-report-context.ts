import type { INestApplicationContext } from '@nestjs/common';

const INVALID_CONFIG_MESSAGE =
  'Configuração inválida para o relatório. Copie .env.example para .env e confira DATABASE_URL';

export async function openReportContext(): Promise<INestApplicationContext> {
  try {
    const { NestFactory } = await import('@nestjs/core');
    const { ReportModule } = await import('./report.module.js');
    return await NestFactory.createApplicationContext(ReportModule, {
      logger: false,
      abortOnError: false,
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'erro desconhecido';
    throw new Error(`${INVALID_CONFIG_MESSAGE} (${detail}).`, { cause: error });
  }
}
