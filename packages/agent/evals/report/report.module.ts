import { Module } from '@nestjs/common';
import { NexoConfigModule } from '@nexo/shared/config';
import { DatabaseModule } from '@nexo/shared/database';

@Module({ imports: [NexoConfigModule, DatabaseModule] })
export class ReportModule {}
