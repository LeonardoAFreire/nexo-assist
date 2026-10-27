import { z } from 'zod';

export const agentRequesterSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export type AgentRequester = z.infer<typeof agentRequesterSchema>;
