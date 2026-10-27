const SESSION_SCOPE = 'session';

export const sessionKeys = {
  scope: SESSION_SCOPE,
  current: [SESSION_SCOPE, 'current'] as const,
};
