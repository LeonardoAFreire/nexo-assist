import { z } from 'zod';
import { envFields } from './env.fields.js';

type EnvInput = z.infer<z.ZodObject<typeof envFields>>;

function addIssue(context: z.RefinementCtx, path: string, message: string): void {
  context.addIssue({ code: 'custom', path: [path], message });
}

function validateConditionals(env: EnvInput, context: z.RefinementCtx): void {
  const isProduction = env.NODE_ENV === 'production';
  if (env.LLM_PROVIDER === 'openrouter' && !env.OPENROUTER_API_KEY) {
    addIssue(context, 'OPENROUTER_API_KEY', 'obrigatória quando LLM_PROVIDER=openrouter');
  }
  if (env.LLM_PROVIDER === 'scripted' && isProduction) {
    addIssue(context, 'LLM_PROVIDER', 'scripted não é permitido em produção');
  }
  if (env.LOG_LEVEL === 'debug' && isProduction) {
    addIssue(context, 'LOG_LEVEL', 'debug não é permitido em produção');
  }
}

export const envSchema = z.object(envFields).superRefine(validateConditionals);

export type Env = z.infer<typeof envSchema>;
