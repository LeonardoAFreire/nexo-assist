import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfig } from '../config/index.js';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];
const HEALTH_PATH = '/api/health';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        renameContext: 'module',
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          redact: REDACTED_PATHS,
          autoLogging: { ignore: (request) => request.url === HEALTH_PATH },
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class NexoLoggerModule {}
