import type { HandoffReason } from '@nexo/contracts';

export type RouteHandoffReason = Extract<HandoffReason, 'requested' | 'low_confidence'>;

export type TurnRoute =
  | { kind: 'handoff'; reason: RouteHandoffReason }
  | { kind: 'redirect' }
  | { kind: 'respond' };
