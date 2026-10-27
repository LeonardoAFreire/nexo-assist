import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { ApiHttpException } from '@nexo/shared/http';
import { DATABASE, type Database, pingDatabase } from '@nexo/shared/database';

type HealthStatus = { status: 'ok' };

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  @Get()
  async check(): Promise<HealthStatus> {
    try {
      await pingDatabase(this.database);
    } catch {
      throw new ApiHttpException({
        code: 'internal_error',
        message: 'Banco de dados indisponível',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
    return { status: 'ok' };
  }
}
