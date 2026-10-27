import { pgSchema } from 'drizzle-orm/pg-core';

export const AGENT_SCHEMA = 'agent';

export const agentSchema = pgSchema(AGENT_SCHEMA);
