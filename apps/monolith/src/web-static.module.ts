import type { DynamicModule } from '@nestjs/common';
import { ServeStaticModule, type ServeStaticModuleOptions } from '@nestjs/serve-static';
import { AppConfig } from '@nexo/shared/config';

const API_ROUTES_PATTERN = '/api{*any}';

export function buildWebStaticOptions(webDir: string | undefined): ServeStaticModuleOptions[] {
  if (!webDir) {
    return [];
  }
  return [{ rootPath: webDir, exclude: [API_ROUTES_PATTERN] }];
}

export const WebStaticModule: DynamicModule = ServeStaticModule.forRootAsync({
  inject: [AppConfig],
  useFactory: (config: AppConfig) => buildWebStaticOptions(config.get('SERVE_WEB_DIR')),
});
