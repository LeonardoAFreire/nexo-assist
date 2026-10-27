import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@nexo/contracts';

export const ROLES_METADATA_KEY = 'nexo:roles';

export function Roles(...roles: UserRole[]): MethodDecorator & ClassDecorator {
  return SetMetadata(ROLES_METADATA_KEY, roles);
}
