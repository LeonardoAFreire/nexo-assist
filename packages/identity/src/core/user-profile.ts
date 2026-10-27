import type { SessionUser, UserProfile } from '@nexo/contracts';
import type { UserRecord } from './user-record.js';

export function toUserProfile(record: UserRecord): UserProfile {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    department: record.department,
    supportLevel: record.supportLevel,
    initials: record.initials,
  };
}

export function toSessionUser(record: UserRecord, expiresAt: Date): SessionUser {
  return {
    ...toUserProfile(record),
    email: record.email,
    session: { expiresAt: expiresAt.toISOString() },
  };
}
