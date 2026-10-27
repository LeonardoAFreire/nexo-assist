export type LogFields = Record<string, unknown>;

export interface AgentLogger {
  info(fields: LogFields, message: string): void;
  warn(fields: LogFields, message: string): void;
}
