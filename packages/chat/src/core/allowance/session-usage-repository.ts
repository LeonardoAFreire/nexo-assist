export const SESSION_USAGE_REPOSITORY = Symbol('SESSION_USAGE_REPOSITORY');

export type IncrementUsageInput = {
  sessionId: string;
  userId: string;
  limit: number;
};

export interface SessionUsageRepository {
  countFor(sessionId: string): Promise<number>;
  incrementBelowLimit(input: IncrementUsageInput): Promise<number | null>;
}
