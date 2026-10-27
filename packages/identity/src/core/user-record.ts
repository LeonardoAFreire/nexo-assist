import type { UserProfile } from '@nexo/contracts';

export type UserRecord = UserProfile & { email: string };
