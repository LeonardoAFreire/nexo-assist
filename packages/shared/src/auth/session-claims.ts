import type { UserRole } from '@nexo/contracts';

export type SessionClaims = {
  userId: string;
  role: UserRole;
  sessionId: string;
  expiresAt: Date;
};

export type AuthenticatedRequest = {
  cookies?: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  session?: SessionClaims;
};
